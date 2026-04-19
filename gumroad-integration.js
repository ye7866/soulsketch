/**
 * SoulSketch — Gumroad Integration (Client)
 * Individual-friendly payment via Gumroad overlay popup.
 *
 * Setup:
 *   1. Create products at gumroad.com (individual, no company needed)
 *   2. Set window.GUMROAD_PRODUCT_URLS below
 *   3. Load this script
 */

(function () {
  'use strict';

  // ── Config — REPLACE WITH YOUR GUMROAD PRODUCT URLs ───────────────
  // Format: https://yourstore.gumroad.com/l/product-id
  const PRODUCT_URLS = window.GUMROAD_PRODUCT_URLS || {
    weekly:  'https://soulsketch.gumroad.com/l/soulmate-weekly',
    monthly: 'https://soulsketch.gumroad.com/l/soulmate-monthly',
    yearly:  'https://soulsketch.gumroad.com/l/soulmate-yearly',
  };

  const PLANS = {
    weekly:  { label: 'Weekly',  amount: '$6.99' },
    monthly: { label: 'Monthly', amount: '$9.99' },
    yearly:  { label: 'Yearly',  amount: '$39.99' },
  };

  const STORAGE_KEY = 'soulsketch_access';

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
    ['paywall', 'hookPaywall', 'hookProgress'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const readingContent = document.getElementById('readingContent');
    if (readingContent) {
      const el = readingContent.querySelector('.reading-text') || document.getElementById('readingText');
      if (el) { el.style.filter = 'none'; el.style.userSelect = 'auto'; }
    }
    const share = document.getElementById('shareSection');
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

  // ── Demo mode ─────────────────────────────────────────────────────
  function isDemoMode() {
    return !window.__PAYMENT_ENABLED__;
  }

  // ── Open Gumroad overlay ──────────────────────────────────────────
  function openCheckout(plan) {
    const url = PRODUCT_URLS[plan] || PRODUCT_URLS.monthly;

    // Gumroad overlay (loaded via their script)
    if (typeof window.Gumroad !== 'undefined' && typeof window.Gumroad.open === 'function') {
      window.Gumroad.open(url);
      return;
    }

    // Fallback: open in new window (centered popup)
    const w = 600, h = 700;
    const left = (screen.width - w) / 2;
    const top = (screen.height - h) / 2;
    window.open(url, 'gumroad_checkout', `width=${w},height=${h},left=${left},top=${top}`);
  }

  // ── Main subscribe handler ────────────────────────────────────────
  async function handleSubscribe() {
    const btn = document.querySelector('#paywall .cta') || document.querySelector('#hookPaywall .cta');
    const plan = (typeof selectedPlan !== 'undefined' && PLANS[selectedPlan])
      ? selectedPlan : 'monthly';

    if (typeof window.trackEvent === 'function') window.trackEvent('subscribe_click', { plan });

    // ── Demo mode ───────────────────────────────────────────────────
    if (isDemoMode()) {
      showSubscribeLoading(btn, true);
      await new Promise(r => setTimeout(r, 800));
      storeAccess(plan, generateToken());
      unlockReading();
      showSubscribeLoading(btn, false);
      if (typeof window.trackEvent === 'function') window.trackEvent('subscribe_complete', { plan, demo: true });
      return;
    }

    // ── Real Gumroad flow ───────────────────────────────────────────
    showSubscribeLoading(btn, true);
    openCheckout(plan);
    // Unlock happens via webhook pingback or redirect
  }

  // ── Handle Gumroad success redirect ───────────────────────────────
  function handleRedirectReturn() {
    const params = new URLSearchParams(window.location.search);

    // Gumroad appends ?sale_id=xxx on success redirect
    if (params.get('sale_id') || params.get('gumroad_pid')) {
      const plan = params.get('plan') || 'monthly';
      window.history.replaceState({}, '', window.location.pathname);
      storeAccess(plan, generateToken());
      unlockReading();
      if (typeof window.trackEvent === 'function') {
        window.trackEvent('subscribe_complete', { plan, provider: 'gumroad', saleId: params.get('sale_id') });
      }
      return true;
    }
    return false;
  }

  // ── Listen for Gumroad popup messages ─────────────────────────────
  function setupGumroadEvents() {
    window.addEventListener('message', (event) => {
      // Gumroad sends postMessage from gumroad.com iframe
      if (!event.origin.includes('gumroad.com')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // Gumroad fires various events; look for purchase success
        if (data.type === 'gumroad_sale' || data.success || data.sale_id) {
          const plan = (typeof selectedPlan !== 'undefined' && PLANS[selectedPlan])
            ? selectedPlan : 'monthly';
          storeAccess(plan, generateToken());
          unlockReading();
          if (typeof window.trackEvent === 'function') {
            window.trackEvent('subscribe_complete', { plan, provider: 'gumroad' });
          }
        }
      } catch (_) { /* non-JSON messages */ }
    });

    // Also check periodically if popup was closed after purchase
    let checkCount = 0;
    const poll = setInterval(() => {
      checkCount++;
      if (checkCount > 120) { clearInterval(poll); return; } // stop after 2 min
      // If access was granted by redirect, we're done
      const access = getAccess();
      if (access && access.token && !document.getElementById('hookPaywall')?.style.display !== 'none') {
        clearInterval(poll);
      }
    }, 1000);
  }

  // ── Load Gumroad script ───────────────────────────────────────────
  function loadGumroadScript() {
    if (document.querySelector('script[src*="gumroad.com/js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://gumroad.com/js/gumroad.js';
    document.head.appendChild(script);
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    handleRedirectReturn();

    const access = getAccess();
    if (access && access.token) unlockReading();

    setupGumroadEvents();

    // Check if product URLs are configured
    const configured = Object.values(PRODUCT_URLS).some(u => u && !u.includes('yourstore'));
    if (!configured) window.__PAYMENT_ENABLED__ = false;
  }

  // ── Expose globally ───────────────────────────────────────────────
  window.handleSubscribe = handleSubscribe;
  window.clearSoulSketchAccess = clearAccess;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { loadGumroadScript(); init(); });
  } else {
    loadGumroadScript();
    init();
  }
})();
