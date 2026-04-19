/**
 * SoulSketch A/B Testing Engine
 * ------------------------------
 * Invisible variant assignment with consistent hashing, DOM application,
 * exposure/conversion tracking, debug panel, and URL-force support.
 *
 * Requires: ab-config.js (AB_TESTS array on window)
 */

(function () {
  'use strict';

  // ── Storage Keys ──────────────────────────────────────────────────
  const STORAGE = {
    visitorId: 'ss_ab_visitor_id',
    assignments: 'ss_ab_assignments',   // { testId: variantId }
    events: 'ss_ab_events',             // [ { testId, variantId, type, ts } ]
  };

  // ── Visitor ID ────────────────────────────────────────────────────
  function getVisitorId() {
    let id = localStorage.getItem(STORAGE.visitorId);
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(STORAGE.visitorId, id);
    }
    return id;
  }

  // ── Hash: consistent variant assignment ───────────────────────────
  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function pickVariant(visitorId, test) {
    const hash = hashStr(visitorId + ':' + test.id);
    let bucket = hash % 100;          // 0-99
    let cumulative = 0;
    for (const v of test.variants) {
      cumulative += v.weight;
      if (bucket < cumulative) return v;
    }
    return test.variants[test.variants.length - 1]; // fallback
  }

  // ── URL Force Params ──────────────────────────────────────────────
  // ?ab_force=cta_text:B,pricing:A
  function getForcedAssignments() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('ab_force');
    if (!raw) return {};
    const forced = {};
    raw.split(',').forEach(pair => {
      const [testId, variantId] = pair.split(':').map(s => s.trim());
      if (testId && variantId) forced[testId] = variantId;
    });
    return forced;
  }

  // ── Tracking ──────────────────────────────────────────────────────
  function getEvents() {
    try { return JSON.parse(localStorage.getItem(STORAGE.events)) || []; }
    catch { return []; }
  }

  function saveEvents(events) {
    localStorage.setItem(STORAGE.events, JSON.stringify(events));
  }

  function trackEvent(testId, variantId, type) {
    const events = getEvents();
    events.push({
      testId,
      variantId,
      type,        // 'exposure' | 'conversion'
      ts: Date.now(),
      visitor: getVisitorId(),
    });
    saveEvents(events);

    // Also push to any external tracker
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'ab_' + type,
        ab_test: testId,
        ab_variant: variantId,
      });
    }

    // Push to SoulSketch tracking queue if available
    if (window.SoulSketchTracker && typeof window.SoulSketchTracker.track === 'function') {
      window.SoulSketchTracker.track('ab_' + type, {
        test_id: testId,
        variant_id: variantId,
      });
    }
  }

  // ── Apply Overrides ───────────────────────────────────────────────
  function applyOverrides(overrides) {
    overrides.forEach(o => {
      const els = document.querySelectorAll(o.selector);
      els.forEach(el => {
        switch (o.prop) {
          case 'textContent':
            el.textContent = o.value;
            break;
          case 'innerHTML':
            el.innerHTML = o.value;
            break;
          case 'style':
            Object.assign(el.style, o.value);
            break;
          case 'attr':
            el.setAttribute(o.value.name, o.value.val);
            break;
          case 'dataset':
            el.dataset[o.value.key] = o.value.val;
            break;
          case 'visibility':
            el.style.visibility = o.value === 'hidden' ? 'hidden' : 'visible';
            if (o.value === 'hidden') {
              el.style.position = 'absolute';
              el.style.pointerEvents = 'none';
              el.style.height = '0';
              el.style.overflow = 'hidden';
              el.style.margin = '0';
              el.style.padding = '0';
            }
            break;
          default:
            if (typeof el[o.prop] !== 'undefined') el[o.prop] = o.value;
        }
      });
    });
  }

  // ── Mark Variant Elements ─────────────────────────────────────────
  function tagVariantElements(testId, variantId, overrides) {
    overrides.forEach(o => {
      document.querySelectorAll(o.selector).forEach(el => {
        el.dataset.abTest = testId;
        el.dataset.abVariant = variantId;
      });
    });
  }

  // ── Debug Panel ───────────────────────────────────────────────────
  function createDebugPanel(assignments, tests) {
    const panel = document.createElement('div');
    panel.id = 'ab-debug-panel';
    panel.style.cssText = `
      position:fixed;bottom:12px;right:12px;z-index:99999;
      background:rgba(10,10,18,0.95);color:#e8e8f0;
      border:1px solid rgba(139,92,246,0.4);border-radius:12px;
      padding:16px 20px;font-family:'Inter',monospace;font-size:12px;
      max-width:360px;min-width:260px;backdrop-filter:blur(12px);
      box-shadow:0 8px 32px rgba(0,0,0,0.5);line-height:1.6;
    `;

    let html = `<div style="font-weight:700;font-size:13px;color:#d4a574;margin-bottom:10px;
      letter-spacing:1px;text-transform:uppercase;">🧪 A/B Debug Panel</div>`;
    html += `<div style="color:#8888a0;font-size:10px;margin-bottom:10px;">
      Visitor: ${getVisitorId().slice(0, 20)}…</div>`;

    tests.forEach(t => {
      const variantId = assignments[t.id];
      const variant = t.variants.find(v => v.id === variantId);
      const forced = getForcedAssignments()[t.id];
      html += `<div style="margin-bottom:6px;">
        <span style="color:#8888a0;">${t.name}</span><br>
        <span style="color:#c084fc;font-weight:600;">Variant ${variantId}</span>
        <span style="color:#8888a0;"> — ${variant ? variant.label : '?'}</span>
        ${forced ? '<span style="color:#f59e0b;font-size:10px;"> [FORCED]</span>' : ''}
      </div>`;
    });

    html += `<div style="margin-top:12px;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;">
      <button onclick="this.closest('#ab-debug-panel').remove()"
        style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);
        color:#c084fc;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:11px;">
        Close
      </button>
      <button onclick="localStorage.removeItem('ss_ab_assignments');localStorage.removeItem('ss_ab_events');location.reload();"
        style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);
        color:#f87171;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:11px;margin-left:6px;">
        Reset & Reload
      </button>
    </div>`;

    panel.innerHTML = html;
    document.body.appendChild(panel);
  }

  // ── Schedule conversion tracking on subscribe click ───────────────
  function hookConversionTracking(assignments) {
    // Find all CTA-like buttons in the paywall
    const subscribeBtns = document.querySelectorAll('.paywall .cta, #paywall .cta');
    subscribeBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        Object.keys(assignments).forEach(testId => {
          trackEvent(testId, assignments[testId], 'conversion');
        });
      }, { once: false });
    });
  }

  // ── Main Init ─────────────────────────────────────────────────────
  function initAB() {
    const tests = (typeof AB_TESTS !== 'undefined') ? AB_TESTS : [];
    if (!tests.length) return;

    const visitorId = getVisitorId();
    const forced = getForcedAssignments();
    const isDebug = new URLSearchParams(window.location.search).has('debug');

    // Load or create assignments
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(STORAGE.assignments)) || {}; } catch {}

    const assignments = {};

    tests.forEach(test => {
      if (!test.active) return;

      // Forced overrides everything
      if (forced[test.id]) {
        assignments[test.id] = forced[test.id];
      }
      // Existing stored assignment (consistent)
      else if (stored[test.id]) {
        assignments[test.id] = stored[test.id];
      }
      // New assignment via hash
      else {
        const variant = pickVariant(visitorId, test);
        assignments[test.id] = variant.id;
      }
    });

    // Persist
    localStorage.setItem(STORAGE.assignments, JSON.stringify(assignments));

    // Apply to DOM — runs synchronously in <head> or at DOMContentLoaded
    function applyAll() {
      tests.forEach(test => {
        if (!test.active) return;
        const variantId = assignments[test.id];
        const variant = test.variants.find(v => v.id === variantId);
        if (!variant) return;

        applyOverrides(variant.overrides);
        tagVariantElements(test.id, variantId, variant.overrides);

        // Track exposure
        trackEvent(test.id, variantId, 'exposure');
      });

      // Hook conversion tracking
      hookConversionTracking(assignments);

      // Debug panel
      if (isDebug) {
        createDebugPanel(assignments, tests);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyAll);
    } else {
      // Defer to allow DOM to settle (but before paint)
      requestAnimationFrame(applyAll);
    }
  }

  // ── Public API ────────────────────────────────────────────────────
  window.SoulSketchAB = {
    getVisitorId,
    getAssignments: function () {
      try { return JSON.parse(localStorage.getItem(STORAGE.assignments)) || {}; }
      catch { return {}; }
    },
    getEvents,
    trackConversion: function (testId) {
      const assignments = window.SoulSketchAB.getAssignments();
      if (assignments[testId]) {
        trackEvent(testId, assignments[testId], 'conversion');
      }
    },
    reset: function () {
      localStorage.removeItem(STORAGE.assignments);
      localStorage.removeItem(STORAGE.events);
    },
    init: initAB,
  };

  // Auto-init
  initAB();
})();
