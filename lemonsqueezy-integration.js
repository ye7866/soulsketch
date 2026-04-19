/**
 * SoulSketch — LemonSqueezy Integration (Client)
 * Replaces Stripe with LemonSqueezy overlay checkout.
 * Individual-friendly, no business entity required.
 *
 * Setup:
 *   1. Create products at app.lemonsqueezy.com
 *   2. Set window.LEMONSQUEEZY_VARIANT_IDS below
 *   3. Load this script instead of stripe-integration.js
 */

(function () {
  'use strict';

  // ── Config — REPLACE WITH YOUR VARIANT IDs ────────────────────────
  // Find these in LemonSqueezy Dashboard → Products → each variant's URL
  const VARIANT_IDS = window.LEMONSQUEEZY_VARIANT_IDS || {
    weekly:  'YOUR_WEEKLY_VARIANT_ID',
    monthly: 'YOUR_MONTHLY_VARIANT_ID',
    yearly:  'YOUR_YEARLY_VARIANT_ID',
  };

  // Your LemonSqueezy store subdomain (e.g., 'soulsketch')
  const STORE_SLUG = window.LEMONSQUEEZY_STORE_SLUG || 'soulsketch';

  const PLANS = {
    weekly:  { label: 'Weekly',  amount: '$6.99' },
    monthly: { label: 'Monthly', amount: '$9.99' },
    yearly:  { label: 'Yearly',  amount: '$39.99' },
  };

  const STORAGE_KEY = 'soulsketch_access';
  const API_BASE = window.location.origin;

  // ── Utilities ─────────────────────────────────────────────────────
  function generateToken() {
    return 'sk_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function storeAccess(plan, token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, plan, ts: Date.now() }));
  }

  function getAccess() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch { return null; }
  }

  function clearAccess() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Unlock helpers ────────────────────────────────────────────────
  function unlockReading() {
    const paywall  = document.getElementById('paywall');
    const hookPw   = document.getElementById('hookPaywall');
    const hookProg = document.getElementById('hookProgress');
    const share    = document.getElementById('shareSection');

    if (paywall) paywall.style.display = 'none';
    if (hookPw) hookPw.style.display = 'none';
    if (hookProg) hookProg.style.display = 'none';

    // Unblur reading
    const readingContent = document.getElementById('readingContent');
    if (readingContent) {
      const readingEl = readingContent.querySelector('.reading-text') || document.getElementById('readingText');
      if (readingEl) {
        readingEl.style.filter = 'none';
        readingEl.style.userSelect = 'auto';
      }
    }
    if (share) share.style.display = 'block';
  }

  function showSubscribeLoading(btn, on) {
    if (!btn) return;
    if (on) {
      btn.dataset.origText = btn.innerHTML;
      btn.innerHTML = '<span class="shimmer"></span>Opening checkout…';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      btn.innerHTML = btn.dataset.origText || btn.innerHTML;
      btn.disabled = false;
      btn.style.opacity = '';
    }
  }

  // ── Demo mode detection ───────────────────────────────────────────
  function isDemoMode() {
    return !window.__PAYMENT_ENABLED__;
  }

  // ── LemonSqueezy checkout via overlay ─────────────────────────────
  function openCheckout(plan) {
    const variantId = VARIANT_IDS[plan] || VARIANT_IDS.monthly;

    // Build checkout URL
    const checkoutUrl = `https://${STORE_SLUG}.lemonsqueezy.com/checkout/buy/${variantId}?embed=1&checkout[email]=`;

    // Use Lemon.js overlay if loaded
    if (typeof window.LemonSqueezy !== 'undefined') {
      window.LemonSqueezy.Url.Open(checkoutUrl);
      return;
    }

    // Fallback: open in new tab
    window.open(checkoutUrl, '_blank');
  }

  // ── Main subscribe handler ────────────────────────────────────────
  async function handleSubscribe() {
    const btn = document.querySelector('#paywall .cta') || document.querySelector('#hookPaywall .cta');
    const plan = (typeof selectedPlan !== 'undefined' && PLANS[selectedPlan])
      ? selectedPlan : 'monthly';

    // Track
    if (typeof window.trackEvent === 'function') window.trackEvent('subscribe_click', { plan });

    // ── Demo mode ───────────────────────────────────────────────────
    if (isDemoMode()) {
      showSubscribeLoading(btn, true);
      await new Promise(r => setTimeout(r, 800));
      const token = generateToken();
      storeAccess(plan, token);
      unlockReading();
      showSubscribeLoading(btn, false);
      if (typeof window.trackEvent === 'function') window.trackEvent('subscribe_complete', { plan, demo: true });
      return;
    }

    // ── Real LemonSqueezy flow ──────────────────────────────────────
    showSubscribeLoading(btn, true);
    openCheckout(plan);
    // Button stays in loading state — webhook + success event will unlock
  }

  // ── Handle return from LemonSqueezy (success param) ───────────────
  async function handleRedirectReturn() {
    const params = new URLSearchParams(window.location.search);

    // LemonSqueezy can redirect with ?checkout=success or ?order_id=xxx
    if (params.get('checkout') === 'success' || params.get('order_id')) {
      const orderId = params.get('order_id') || 'ls_' + Date.now();
      const plan = params.get('plan') || 'monthly';

      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);

      // Verify with backend (optional — webhook is primary verification)
      try {
        const res = await fetch(`${API_BASE}/api/verify-order/${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.access) {
            storeAccess(data.plan || plan, data.token || generateToken());
            return true;
          }
        }
      } catch (_) { /* fallback below */ }

      // Fallback: grant access (LemonSqueezy redirected here = paid)
      storeAccess(plan, generateToken());
      return true;
    }
    return false;
  }

  // ── Listen for LemonSqueezy overlay success event ─────────────────
  function setupLemonSqueezyEvents() {
    // LemonSqueezy fires events via postMessage
    window.addEventListener('message', (event) => {
      if (event.origin !== `https://${STORE_SLUG}.lemonsqueezy.com`) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data.event === 'Checkout.Success') {
          const plan = data.data?.attributes?.first_order_item?.variant_name?.toLowerCase() || 'monthly';
          const matchedPlan = ['weekly', 'monthly', 'yearly'].find(p => plan.includes(p)) || 'monthly';

          storeAccess(matchedPlan, generateToken());
          unlockReading();

          if (typeof window.trackEvent === 'function') {
            window.trackEvent('subscribe_complete', { plan: matchedPlan, provider: 'lemonsqueezy' });
          }
        }
      } catch (_) { /* ignore non-JSON messages */ }
    });
  }

  // ── Init ──────────────────────────────────────────────────────────
  async function init() {
    // 1. Handle redirect return
    await handleRedirectReturn();

    // 2. Check stored access
    const access = getAccess();
    if (access && access.token) {
      unlockReading();
    }

    // 3. Setup LemonSqueezy overlay events
    setupLemonSqueezyEvents();

    // 4. Check if payment is configured
    const hasRealIds = Object.values(VARIANT_IDS).some(id => id && !id.startsWith('YOUR_'));
    if (!hasRealIds) {
      window.__PAYMENT_ENABLED__ = false;
    }
  }

  // ── Load LemonSqueezy.js (overlay script) ─────────────────────────
  function loadLemonScript() {
    if (document.querySelector('script[src*="lemon.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
    script.defer = true;
    script.onload = function() {
      if (typeof window.LemonSqueezy !== 'undefined') {
        window.LemonSqueezy.Setup({ eventHandler: () => {} });
      }
    };
    document.head.appendChild(script);
  }

  // ── Expose globally ───────────────────────────────────────────────
  window.handleSubscribe = handleSubscribe;
  window.clearSoulSketchAccess = clearAccess;

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { loadLemonScript(); init(); });
  } else {
    loadLemonScript();
    init();
  }
})();
