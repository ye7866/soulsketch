/**
 * SoulSketch UTM Tracker
 * Zero-impact attribution tracking for TikTok and other campaigns.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ss_utm';
  var QUEUE_KEY = 'ss_event_queue';
  var VISITOR_KEY = 'ss_visitor_id';
  var TRACK_ENDPOINT = '/api/track';
  var MAX_QUEUE = 50;

  // ── UUID v4 ──────────────────────────────────────────────
  function uuid4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // ── Visitor ID ───────────────────────────────────────────
  function getVisitorId() {
    var id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid4();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  // ── Parse UTM from URL ──────────────────────────────────
  function parseUTM() {
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    keys.forEach(function (k) {
      var v = params.get(k);
      if (v) utm[k] = v;
    });

    // TikTok in-app browser detection
    if (!utm.utm_source) {
      var ua = navigator.userAgent || '';
      if (/TikTok|BytedanceWebview|musical_ly/i.test(ua)) {
        utm.utm_source = 'tiktok';
        utm.utm_medium = 'in_app_browser';
      }
    }

    return utm;
  }

  // ── Persist UTM ──────────────────────────────────────────
  function saveUTM(utm) {
    if (Object.keys(utm).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
    }
  }

  function getStoredUTM() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  // ── Event Queue ──────────────────────────────────────────
  function getQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  function saveQueue(q) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
  }

  function enqueue(evt) {
    var q = getQueue();
    q.push(evt);
    saveQueue(q);
  }

  function flushQueue() {
    var q = getQueue();
    if (!q.length) return;

    // Try sending oldest events first
    var batch = q.slice(0, 10);
    sendBatch(batch).then(function (ok) {
      if (ok) {
        var remaining = q.slice(batch.length);
        saveQueue(remaining);
        if (remaining.length) setTimeout(flushQueue, 1000);
      }
    });
  }

  function sendBatch(events) {
    return fetch(TRACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: events }),
      keepalive: true,
    })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  // ── Send single event ───────────────────────────────────
  function sendEvent(evt) {
    return sendBatch([evt]).then(function (ok) {
      if (!ok) enqueue(evt);
      return ok;
    });
  }

  // ── Public API ───────────────────────────────────────────
  var visitorId = getVisitorId();
  var urlUTM = parseUTM();
  var storedUTM = getStoredUTM();
  // Merge: URL params override stored (fresh attribution wins)
  var activeUTM = Object.assign({}, storedUTM, urlUTM);
  saveUTM(activeUTM);

  /**
   * trackEvent(eventName, metadata?)
   * @param {string} eventName - page_view, form_start, form_submit,
   *   paywall_view, subscribe_click, subscribe_complete, share_click
   * @param {object} [metadata] - arbitrary key/value pairs
   */
  window.trackEvent = function (eventName, metadata) {
    var payload = {
      event: eventName,
      visitorId: visitorId,
      utm: activeUTM,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metadata: metadata || {},
    };

    // Fire-and-forget; never block UX
    if (typeof navigator.sendBeacon === 'function') {
      try {
        var blob = new Blob([JSON.stringify({ events: [payload] })], {
          type: 'application/json',
        });
        navigator.sendBeacon(TRACK_ENDPOINT, blob);
        return;
      } catch (_) { /* fall through */ }
    }

    sendEvent(payload);
  };

  // Expose helpers for debugging
  window.__ssTracker = {
    visitorId: visitorId,
    utm: activeUTM,
    queue: getQueue,
    flush: flushQueue,
  };

  // ── Auto-track page view ────────────────────────────────
  if (document.readyState === 'complete') {
    window.trackEvent('page_view');
  } else {
    window.addEventListener('load', function () {
      window.trackEvent('page_view');
    });
  }

  // ── Flush queued events periodically ────────────────────
  setTimeout(flushQueue, 3000);
  setInterval(flushQueue, 30000);

  // ── Debug display (?debug=1) ────────────────────────────
  if (/[?&]debug=1/.test(window.location.search)) {
    document.addEventListener('DOMContentLoaded', function () {
      var el = document.createElement('div');
      el.id = 'utm-debug';
      el.style.cssText =
        'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:rgba(0,0,0,0.92);' +
        'color:#0f0;font:11px/1.6 monospace;padding:10px 14px;border-top:1px solid #333;max-height:160px;overflow:auto;';
      var isTikTok = /TikTok|BytedanceWebview|musical_ly/i.test(navigator.userAgent);
      el.innerHTML =
        '<b>SS Tracker Debug</b><br>' +
        'Visitor: ' + visitorId + '<br>' +
        'UTM: ' + JSON.stringify(activeUTM) + '<br>' +
        'TikTok UA: ' + (isTikTok ? '✅ yes' : '❌ no') + '<br>' +
        'Queue size: ' + getQueue().length;
      document.body.appendChild(el);
    });
  }
})();
