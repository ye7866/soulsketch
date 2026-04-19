/**
 * SoulSketch Deep Link & Share System
 * TikTok, Instagram, WhatsApp deep links with Web Share API fallback.
 */
(function () {
  'use strict';

  var CONFIG = {
    baseUrl: 'https://soulsketch.app',
    shortLinkPath: '/r/',
    tiktokWeb: 'https://www.tiktok.com/',
    tiktokApp: 'snssdk1233://',
    instagramStory: 'instagram://story-camera',
    whatsappBase: 'https://wa.me/',
  };

  // ── Helpers ──────────────────────────────────────────────

  function getVisitorId() {
    return localStorage.getItem('ss_visitor_id') || 'unknown';
  }

  function getShortLink() {
    return CONFIG.baseUrl + CONFIG.shortLinkPath + getVisitorId();
  }

  function getResultData() {
    var nameEl = document.getElementById('resultName');
    var zodiacEl = document.getElementById('resultZodiac');
    return {
      soulmateName: nameEl ? nameEl.textContent : 'your soulmate',
      zodiac: zodiacEl ? zodiacEl.textContent.split('·')[0].trim() : '',
    };
  }

  function buildShareText(data) {
    var d = data || getResultData();
    return (
      '🔮 My soulmate is ' + d.soulmateName +
      (d.zodiac ? ' (' + d.zodiac + ')' : '') +
      '! Find yours on SoulSketch ✨\n' + getShortLink()
    );
  }

  // ── Deep Link Functions ──────────────────────────────────

  /**
   * Attempt to open a deep link. Returns a promise that resolves
   * to true if navigation happened, false otherwise.
   */
  function tryDeepLink(url, timeoutMs) {
    timeoutMs = timeoutMs || 1500;
    return new Promise(function (resolve) {
      var start = Date.now();
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      var timer = setTimeout(function () {
        // If we're still here after timeout, deep link failed
        try { document.body.removeChild(iframe); } catch (_) {}
        resolve(false);
      }, timeoutMs);

      // Visibility change = app opened
      function onVis() {
        if (document.hidden) {
          clearTimeout(timer);
          try { document.body.removeChild(iframe); } catch (_) {}
          document.removeEventListener('visibilitychange', onVis);
          resolve(true);
        }
      }
      document.addEventListener('visibilitychange', onVis);
    });
  }

  // ── Share Strategies ─────────────────────────────────────

  function shareToTikTok() {
    var text = buildShareText();
    // Track
    if (typeof window.trackEvent === 'function') {
      window.trackEvent('share_click', { platform: 'tiktok' });
    }

    // Try app deep link first
    tryDeepLink(CONFIG.tiktokApp, 1200).then(function (opened) {
      if (!opened) {
        // Fallback: open TikTok web
        window.open(CONFIG.tiktokWeb, '_blank', 'noopener');
        // Copy text to clipboard so user can paste
        copyToClipboard(text);
      }
    });
  }

  function shareToInstagram() {
    var text = buildShareText();
    if (typeof window.trackEvent === 'function') {
      window.trackEvent('share_click', { platform: 'instagram' });
    }

    tryDeepLink(CONFIG.instagramStory, 1200).then(function (opened) {
      if (!opened) {
        window.open('https://www.instagram.com/', '_blank', 'noopener');
        copyToClipboard(text);
      }
    });
  }

  function shareToWhatsApp() {
    var text = buildShareText();
    if (typeof window.trackEvent === 'function') {
      window.trackEvent('share_click', { platform: 'whatsapp' });
    }

    var url = CONFIG.whatsappBase + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
  }

  function copyShareLink() {
    var text = buildShareText();
    if (typeof window.trackEvent === 'function') {
      window.trackEvent('share_click', { platform: 'copy_link' });
    }
    copyToClipboard(text).then(function () {
      showToast('Link copied! 💜');
    });
  }

  /**
   * Universal share — tries native Web Share API, falls back to clipboard.
   */
  function universalShare(data) {
    var text = buildShareText(data);
    var url = getShortLink();

    if (typeof window.trackEvent === 'function') {
      window.trackEvent('share_click', { platform: 'universal' });
    }

    if (navigator.share) {
      return navigator.share({
        title: 'SoulSketch — My Soulmate',
        text: text,
        url: url,
      }).catch(function (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(text).then(function () {
            showToast('Copied to clipboard!');
          });
        }
      });
    }

    return copyToClipboard(text).then(function () {
      showToast('Copied to clipboard!');
    });
  }

  // ── Clipboard ────────────────────────────────────────────

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        fallbackCopy(text);
      });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }

  // ── Toast Notification ───────────────────────────────────

  function showToast(msg) {
    var t = document.getElementById('ss-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ss-toast';
      t.style.cssText =
        'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'background:rgba(139,92,246,0.95);color:#fff;padding:12px 24px;border-radius:30px;' +
        'font:500 14px/1 Inter,system-ui,sans-serif;z-index:99999;opacity:0;' +
        'transition:opacity .3s,transform .3s;pointer-events:none;backdrop-filter:blur(8px);' +
        'box-shadow:0 8px 30px rgba(139,92,246,0.4);';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2200);
  }

  // ── Build Share Buttons UI ───────────────────────────────

  function createShareButtons(container) {
    var wrap = document.createElement('div');
    wrap.className = 'ss-share-row';
    wrap.style.cssText =
      'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px;';

    var buttons = [
      { label: 'TikTok 🎵', action: shareToTikTok, color: '#000', border: '#333' },
      { label: 'Instagram 📸', action: shareToInstagram, color: '#833AB4', border: '#833AB4' },
      { label: 'WhatsApp 💬', action: shareToWhatsApp, color: '#25D366', border: '#25D366' },
      { label: 'Copy Link 🔗', action: copyShareLink, color: 'transparent', border: 'rgba(255,255,255,0.15)' },
    ];

    buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.textContent = b.label;
      btn.style.cssText =
        'padding:10px 16px;border-radius:24px;border:1px solid ' + b.border + ';' +
        'background:' + b.color + ';color:#fff;font:500 13px/1 Inter,system-ui,sans-serif;' +
        'cursor:pointer;transition:transform .2s,box-shadow .3s;white-space:nowrap;';
      if (b.color === 'transparent') {
        btn.style.color = '#e8e8f0';
      }
      btn.addEventListener('mouseenter', function () {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 15px rgba(139,92,246,0.3)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        btn.style.boxShadow = '';
      });
      btn.addEventListener('click', b.action);
      wrap.appendChild(btn);
    });

    // Also a universal share button (uses Web Share API)
    var universalBtn = document.createElement('button');
    universalBtn.textContent = '📤 Share';
    universalBtn.style.cssText =
      'padding:10px 20px;border-radius:24px;border:1px solid rgba(139,92,246,0.4);' +
      'background:rgba(139,92,246,0.15);color:#c084fc;font:500 13px/1 Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:transform .2s;white-space:nowrap;';
    universalBtn.addEventListener('click', universalShare);
    wrap.appendChild(universalBtn);

    container.appendChild(wrap);
    return wrap;
  }

  // ── Public API ───────────────────────────────────────────
  window.DeepLink = {
    shareToTikTok: shareToTikTok,
    shareToInstagram: shareToInstagram,
    shareToWhatsApp: shareToWhatsApp,
    copyLink: copyShareLink,
    universalShare: universalShare,
    createShareButtons: createShareButtons,
    getShortLink: getShortLink,
    buildShareText: buildShareText,
    config: CONFIG,
  };
})();
