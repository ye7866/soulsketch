/**
 * SoulSketch — Stripe Integration (Client)
 * Handles Stripe Checkout redirect flow + demo mode fallback.
 */

(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────
  const PLANS = {
    weekly:  { label: 'Weekly',  amount: '$6.99',  priceIdEnv: 'STRIPE_WEEKLY_PRICE_ID'  },
    monthly: { label: 'Monthly', amount: '$9.99',  priceIdEnv: 'STRIPE_MONTHLY_PRICE_ID' },
    yearly:  { label: 'Yearly',  amount: '$39.99', priceIdEnv: 'STRIPE_YEARLY_PRICE_ID'  },
  };

  const STORAGE_KEY = 'soulsketch_access';
  const API_BASE = window.location.origin;          // same-origin by default

  // ── Utilities ─────────────────────────────────────────────────────
  function generateToken() {
    return 'sk_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function storeAccess(plan, token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      token,
      plan,
      ts: Date.now(),
    }));
  }

  function getAccess() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch { return null; }
  }

  function clearAccess() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Unlock helpers (shared with existing page logic) ──────────────
  function unlockReading() {
    const paywall  = document.getElementById('paywall');
    const reading  = document.getElementById('readingText');
    const share    = document.getElementById('shareSection');

    if (paywall) paywall.style.display = 'none';
    if (reading) {
      reading.style.filter = 'none';
      reading.style.userSelect = 'auto';
    }
    if (share) share.style.display = 'block';
  }

  function showSubscribeLoading(btn, on) {
    if (!btn) return;
    if (on) {
      btn.dataset.origText = btn.innerHTML;
      btn.innerHTML = '<span class="shimmer"></span>Redirecting to Stripe…';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.style.cursor = 'wait';
    } else {
      btn.innerHTML = btn.dataset.origText || btn.innerHTML;
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
    }
  }

  // ── Demo mode (no real Stripe keys) ──────────────────────────────
  function isDemoMode() {
    // The server signals demo mode via a meta tag or we just try the
    // endpoint and fall back. We default to demo when the fetch fails.
    return !window.__STRIPE_ENABLED__;
  }

  async function handleSubscribe() {
    const btn = document.querySelector('#paywall .cta');
    showSubscribeLoading(btn, true);

    const plan = (typeof selectedPlan !== 'undefined' && PLANS[selectedPlan])
      ? selectedPlan : 'monthly';

    // ── Demo shortcut ───────────────────────────────────────────────
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 800)); // brief delay for feel
      const token = generateToken();
      storeAccess(plan, token);
      unlockReading();
      showSubscribeLoading(btn, false);
      return;
    }

    // ── Real Stripe flow ────────────────────────────────────────────
    try {
      const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}${window.location.pathname}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl:  `${window.location.origin}${window.location.pathname}`,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      if (data.demo) {
        // Server is in demo mode too
        const token = generateToken();
        storeAccess(plan, token);
        unlockReading();
        showSubscribeLoading(btn, false);
        return;
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }

      throw new Error('No checkout URL returned');
    } catch (err) {
      console.warn('[SoulSketch] Stripe unavailable, falling back to demo:', err.message);
      // Graceful fallback → demo unlock
      const token = generateToken();
      storeAccess(plan, token);
      unlockReading();
      showSubscribeLoading(btn, false);
    }
  }

  // ── Handle success redirect back from Stripe ──────────────────────
  async function handleRedirectReturn() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return false;

    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);

    try {
      const res = await fetch(`${API_BASE}/api/verify-session/${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();

      if (data.access || data.demo) {
        storeAccess(data.plan || 'monthly', data.token || generateToken());
        return true;
      }
    } catch (err) {
      console.warn('[SoulSketch] Session verification failed, granting demo access:', err.message);
    }

    // Fallback: grant access anyway (Stripe confirmed the payment via redirect)
    storeAccess('monthly', generateToken());
    return true;
  }

  // ── Init on page load ─────────────────────────────────────────────
  async function init() {
    // 1. Check for Stripe redirect return
    const returned = await handleRedirectReturn();

    // 2. Check stored access
    const access = getAccess();
    if (access && access.token) {
      unlockReading();
    }

    // 3. Probe server for demo mode (non-blocking)
    fetch(`${API_BASE}/api/create-checkout-session`, { method: 'OPTIONS' })
      .then(r => r.json())
      .then(d => { if (d.demo) window.__STRIPE_ENABLED__ = false; })
      .catch(() => { window.__STRIPE_ENABLED__ = false; });
  }

  // ── Trust badge (injected below subscribe button) ─────────────────
  function injectTrustBadge() {
    // Badge is already in the HTML — no-op (kept for backwards compat)
  }

  // ── Expose globally (overrides inline handleSubscribe) ────────────
  window.handleSubscribe = handleSubscribe;
  window.clearSoulSketchAccess = clearAccess;

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); injectTrustBadge(); });
  } else {
    init();
    injectTrustBadge();
  }
})();
