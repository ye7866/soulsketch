/**
 * SoulSketch Share Modal
 * Modal overlay for previewing, downloading, and sharing branded share cards.
 */
(function () {
  'use strict';

  var currentSize = 'story';
  var currentCardResult = null;
  var watermarkEnabled = true;
  var modalEl = null;

  // ── Subscriber check ────────────────────────────────────
  function isSubscriber() {
    return !!localStorage.getItem('ss_subscribed');
  }

  // ── Collect result data from DOM ────────────────────────
  function getResultData() {
    var userName = document.getElementById('userName');
    var resultName = document.getElementById('resultName');
    var resultZodiac = document.getElementById('resultZodiac');
    var scoreNum = document.getElementById('scoreNum');
    var traitsEl = document.getElementById('traits');
    var avatarEl = document.getElementById('soulmateAvatar');

    // Parse zodiacs from the result page
    var userZod = 'Unknown';
    var soulZod = 'Unknown';
    try {
      if (typeof selectedZodiac !== 'undefined' && selectedZodiac) {
        userZod = selectedZodiac.name;
      }
    } catch (_) {}
    if (resultZodiac) {
      var zodiacText = resultZodiac.textContent || '';
      soulZod = zodiacText.split('·')[0].trim() || 'Unknown';
    }

    // Try to get portrait URL from avatar
    var portraitUrl = null;
    if (avatarEl) {
      var img = avatarEl.querySelector('img');
      if (img) portraitUrl = img.src;
      var svg = avatarEl.querySelector('svg');
      if (svg && !img) {
        // Serialize SVG to data URL
        var svgStr = new XMLSerializer().serializeToString(svg);
        portraitUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
      }
    }

    var traits = [];
    if (traitsEl) {
      var traitEls = traitsEl.querySelectorAll('.trait');
      for (var i = 0; i < traitEls.length; i++) {
        traits.push(traitEls[i].textContent);
      }
    }

    return {
      userName: userName ? userName.value.trim() || 'You' : 'You',
      soulmateName: resultName ? resultName.textContent : 'Your Soulmate',
      userZodiac: userZod,
      soulmateZodiac: soulZod,
      score: parseInt(scoreNum ? scoreNum.textContent : '85', 10) || 85,
      traits: traits,
      portraitUrl: portraitUrl,
    };
  }

  // ── Generate and show preview ───────────────────────────
  function generateAndShowPreview(data, size, container) {
    var sub = isSubscriber();
    var showWM = !sub && watermarkEnabled;

    if (!window.ShareCard) return Promise.resolve();

    // Show loading indicator
    container.innerHTML =
      '<div style="text-align:center;padding:60px 0;color:#8888a0;font-size:14px">' +
      '<div style="width:40px;height:40px;border:3px solid rgba(139,92,246,0.2);' +
      'border-top-color:#8b5cf6;border-radius:50%;animation:ss-spin 0.8s linear infinite;' +
      'margin:0 auto 16px"></div>Generating your card...</div>';

    return ShareCard.generate(data, size, showWM).then(function (result) {
      currentCardResult = result;
      container.innerHTML = '';
      var preview = ShareCard.createPreview(result, 420);
      container.appendChild(preview);

      if (typeof window.trackEvent === 'function') {
        trackEvent('share_card_generated', { size: size, watermark: showWM });
      }
    });
  }

  // ── Build Modal DOM ─────────────────────────────────────
  function buildModal() {
    if (modalEl) return modalEl;

    var sub = isSubscriber();

    modalEl = document.createElement('div');
    modalEl.id = 'shareCardModal';
    modalEl.style.cssText =
      'position:fixed;inset:0;z-index:10000;background:rgba(10,10,18,0.92);' +
      'display:none;flex-direction:column;align-items:center;' +
      'overflow-y:auto;-webkit-overflow-scrolling:touch;' +
      'backdrop-filter:blur(12px);opacity:0;transition:opacity 0.35s ease;';

    modalEl.innerHTML =
      // Close button
      '<button id="ssModalClose" style="position:fixed;top:16px;right:16px;z-index:10001;' +
      'width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);' +
      'background:rgba(255,255,255,0.06);color:#e8e8f0;font-size:20px;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;transition:background 0.2s">' +
      '✕</button>' +

      // Header
      '<div style="text-align:center;padding:40px 20px 10px;width:100%;max-width:520px">' +
      '<div style="font-family:Cinzel,serif;font-size:20px;color:#d4a574;letter-spacing:1px">' +
      '📤 Share Your Result</div>' +
      '<div style="font-size:13px;color:#8888a0;margin-top:6px">' +
      'Choose a format and share your cosmic connection</div></div>' +

      // Size selector
      '<div style="display:flex;gap:8px;justify-content:center;padding:10px 20px">' +
      '<button class="ss-size-btn active" data-size="story" ' +
      'style="padding:10px 20px;border-radius:24px;border:1px solid rgba(139,92,246,0.4);' +
      'background:rgba(139,92,246,0.15);color:#c084fc;font:500 13px Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:all 0.2s">📱 Story</button>' +
      '<button class="ss-size-btn" data-size="square" ' +
      'style="padding:10px 20px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);' +
      'background:transparent;color:#8888a0;font:500 13px Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:all 0.2s">⬜ Square</button>' +
      '<button class="ss-size-btn" data-size="feed" ' +
      'style="padding:10px 20px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);' +
      'background:transparent;color:#8888a0;font:500 13px Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:all 0.2s">🖼 Feed</button></div>' +

      // Watermark toggle (free users only)
      (!sub ? '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 20px">' +
      '<label style="font-size:12px;color:#8888a0;display:flex;align-items:center;gap:8px;cursor:pointer">' +
      '<input type="checkbox" id="ssWatermarkToggle" checked ' +
      'style="accent-color:#8b5cf6;width:16px;height:16px">' +
      'Show watermark <span style="color:#6d28d9;font-size:11px">• Remove with subscription</span></label></div>' : '') +

      // Card preview container
      '<div id="ssCardPreview" style="padding:20px;width:100%;max-width:520px;flex:1">' +
      '</div>' +

      // Action buttons
      '<div style="padding:10px 20px 30px;width:100%;max-width:520px">' +
      // Download
      '<button id="ssDownloadBtn" style="width:100%;padding:16px;border:none;border-radius:50px;' +
      'font-size:16px;font-weight:600;cursor:pointer;' +
      'background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;' +
      'transition:transform 0.2s,box-shadow 0.3s;margin-bottom:16px;' +
      'font-family:Inter,system-ui,sans-serif">' +
      '💾 Download PNG</button>' +

      // Social share row
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
      '<button class="ss-share-platform" data-platform="tiktok" ' +
      'style="padding:10px 16px;border-radius:24px;border:1px solid #333;' +
      'background:#000;color:#fff;font:500 13px Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:transform 0.2s;white-space:nowrap">🎵 TikTok</button>' +
      '<button class="ss-share-platform" data-platform="instagram" ' +
      'style="padding:10px 16px;border-radius:24px;border:1px solid #833AB4;' +
      'background:#833AB4;color:#fff;font:500 13px Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:transform 0.2s;white-space:nowrap">📸 Instagram</button>' +
      '<button class="ss-share-platform" data-platform="whatsapp" ' +
      'style="padding:10px 16px;border-radius:24px;border:1px solid #25D366;' +
      'background:#25D366;color:#fff;font:500 13px Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:transform 0.2s;white-space:nowrap">💬 WhatsApp</button>' +
      '<button class="ss-share-platform" data-platform="copy" ' +
      'style="padding:10px 16px;border-radius:24px;border:1px solid rgba(255,255,255,0.15);' +
      'background:transparent;color:#e8e8f0;font:500 13px Inter,system-ui,sans-serif;' +
      'cursor:pointer;transition:transform 0.2s;white-space:nowrap">🔗 Copy Link</button>' +
      '</div></div>';

    document.body.appendChild(modalEl);

    // ── Event Listeners ───────────────────────────────────

    // Close
    modalEl.querySelector('#ssModalClose').addEventListener('click', closeModal);

    // Backdrop close
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeModal();
    });

    // Size buttons
    var sizeBtns = modalEl.querySelectorAll('.ss-size-btn');
    for (var i = 0; i < sizeBtns.length; i++) {
      sizeBtns[i].addEventListener('click', function () {
        var sz = this.getAttribute('data-size');
        if (sz === currentSize) return;
        currentSize = sz;

        // Update button styles
        for (var j = 0; j < sizeBtns.length; j++) {
          var isActive = sizeBtns[j].getAttribute('data-size') === sz;
          sizeBtns[j].style.background = isActive ? 'rgba(139,92,246,0.15)' : 'transparent';
          sizeBtns[j].style.borderColor = isActive ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)';
          sizeBtns[j].style.color = isActive ? '#c084fc' : '#8888a0';
          sizeBtns[j].className = isActive ? 'ss-size-btn active' : 'ss-size-btn';
        }

        // Regenerate card
        var previewContainer = modalEl.querySelector('#ssCardPreview');
        generateAndShowPreview(getResultData(), currentSize, previewContainer);
      });
    }

    // Watermark toggle
    var wmToggle = modalEl.querySelector('#ssWatermarkToggle');
    if (wmToggle) {
      wmToggle.addEventListener('change', function () {
        watermarkEnabled = this.checked;
        var previewContainer = modalEl.querySelector('#ssCardPreview');
        generateAndShowPreview(getResultData(), currentSize, previewContainer);
      });
    }

    // Download
    modalEl.querySelector('#ssDownloadBtn').addEventListener('click', function () {
      if (!currentCardResult) return;
      var a = document.createElement('a');
      a.href = currentCardResult.dataUrl;
      a.download = 'soulsketch-' + currentSize + '-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (typeof window.trackEvent === 'function') {
        trackEvent('share_card_downloaded', { size: currentSize });
      }
    });

    // Social share buttons
    var shareBtns = modalEl.querySelectorAll('.ss-share-platform');
    for (var s = 0; s < shareBtns.length; s++) {
      shareBtns[s].addEventListener('click', function () {
        var platform = this.getAttribute('data-platform');
        if (window.DeepLink) {
          switch (platform) {
            case 'tiktok':    DeepLink.shareToTikTok();    break;
            case 'instagram': DeepLink.shareToInstagram(); break;
            case 'whatsapp':  DeepLink.shareToWhatsApp();  break;
            case 'copy':      DeepLink.copyLink();         break;
          }
        }
      });
    }

    return modalEl;
  }

  // ── Open / Close ────────────────────────────────────────
  function openModal() {
    buildModal();
    modalEl.style.display = 'flex';
    // Trigger fade-in
    requestAnimationFrame(function () {
      modalEl.style.opacity = '1';
    });
    document.body.style.overflow = 'hidden';

    // Generate initial card
    var previewContainer = modalEl.querySelector('#ssCardPreview');
    generateAndShowPreview(getResultData(), currentSize, previewContainer);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.style.opacity = '0';
    setTimeout(function () {
      modalEl.style.display = 'none';
      document.body.style.overflow = '';
    }, 350);
  }

  // ── Spin animation (injected once) ─────────────────────
  var spinStyle = document.createElement('style');
  spinStyle.textContent = '@keyframes ss-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(spinStyle);

  // ── Public API ──────────────────────────────────────────
  window.ShareModal = {
    open: openModal,
    close: closeModal,
    getResultData: getResultData,
  };
})();
