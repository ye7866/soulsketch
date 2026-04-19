/**
 * SoulSketch Share Card Generator
 * Canvas API-based branded share cards for social media.
 * Generates premium-quality images in Story (1080x1920), Square (1080x1080), and Feed (1200x628) formats.
 */
(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  var SIZES = {
    story:  { w: 1080, h: 1920 },
    square: { w: 1080, h: 1080 },
    feed:   { w: 1200, h: 628  },
  };

  var COLORS = {
    bgTop:       '#0a0a12',
    bgBot:       '#1a1025',
    gold:        '#d4a574',
    goldLight:   '#e8c9a0',
    purple:      '#8b5cf6',
    purpleDark:  '#6d28d9',
    accent:      '#c084fc',
    white:       '#e8e8f0',
    dim:         '#8888a0',
  };

  // Pre-generate star positions (deterministic)
  var STAR_SEED = [];
  for (var si = 0; si < 50; si++) {
    STAR_SEED.push({
      x: (Math.sin(si * 127.1 + 311.7) * 0.5 + 0.5),
      y: (Math.sin(si * 269.5 + 183.3) * 0.5 + 0.5),
      r: 0.5 + (Math.sin(si * 419.2) * 0.5 + 0.5) * 1.8,
      o: 0.15 + (Math.sin(si * 113.5) * 0.5 + 0.5) * 0.55,
    });
  }

  // ── Zodiac symbols map ──────────────────────────────────
  var ZODIAC_SYMBOLS = {
    'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
    'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
    'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓',
  };

  // ── Drawing Helpers ─────────────────────────────────────

  function drawGradientBg(ctx, w, h) {
    var grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
    grad.addColorStop(0, COLORS.bgTop);
    grad.addColorStop(1, COLORS.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Nebula glow
    var r1 = ctx.createRadialGradient(w * 0.2, h * 0.35, 0, w * 0.2, h * 0.35, w * 0.6);
    r1.addColorStop(0, 'rgba(139,92,246,0.07)');
    r1.addColorStop(1, 'transparent');
    ctx.fillStyle = r1;
    ctx.fillRect(0, 0, w, h);

    var r2 = ctx.createRadialGradient(w * 0.8, h * 0.15, 0, w * 0.8, h * 0.15, w * 0.5);
    r2.addColorStop(0, 'rgba(212,165,116,0.05)');
    r2.addColorStop(1, 'transparent');
    ctx.fillStyle = r2;
    ctx.fillRect(0, 0, w, h);
  }

  function drawStars(ctx, w, h) {
    for (var i = 0; i < STAR_SEED.length; i++) {
      var s = STAR_SEED[i];
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + s.o + ')';
      ctx.fill();
    }
  }

  function drawText(ctx, text, x, y, font, color, align, baseline) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = baseline || 'middle';
    ctx.fillText(text, x, y);
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var words = text.split(' ');
    var line = '';
    var lines = [];
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxWidth && line !== '') {
        lines.push(line.trim());
        line = words[i] + ' ';
      } else {
        line = test;
      }
    }
    lines.push(line.trim());
    var startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (var j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], x, startY + j * lineHeight);
    }
  }

  function drawCircularImage(ctx, img, cx, cy, radius) {
    // Glow
    ctx.save();
    ctx.shadowColor = 'rgba(212,165,116,0.4)';
    ctx.shadowBlur = radius * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Clip circle and draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (img) {
      // Cover-fit the image into the circle
      var size = radius * 2;
      var iw = img.naturalWidth || img.width;
      var ih = img.naturalHeight || img.height;
      var scale = Math.max(size / iw, size / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    } else {
      // Placeholder gradient
      var pg = ctx.createRadialGradient(cx, cy - radius * 0.3, 0, cx, cy, radius);
      pg.addColorStop(0, COLORS.purple);
      pg.addColorStop(1, COLORS.purpleDark);
      ctx.fillStyle = pg;
      ctx.fill();
      drawText(ctx, '✨', cx, cy, radius * 0.6 + 'px serif', 'rgba(255,255,255,0.8)');
    }
    ctx.restore();
  }

  function drawScoreRing(ctx, cx, cy, radius, score, fontSize) {
    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Score arc
    var startAngle = -Math.PI / 2;
    var endAngle = startAngle + (Math.PI * 2 * score / 100);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    var grad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    grad.addColorStop(0, COLORS.purple);
    grad.addColorStop(1, COLORS.gold);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score text
    drawText(ctx, score + '%', cx, cy - fontSize * 0.15, 'bold ' + fontSize + 'px Inter, system-ui, sans-serif', COLORS.gold);
    drawText(ctx, 'COMPATIBLE', cx, cy + fontSize * 0.55, '500 ' + (fontSize * 0.28) + 'px Inter, system-ui, sans-serif', COLORS.dim);
  }

  function drawTraits(ctx, traits, x, y, maxWidth, fontSize) {
    var padding = fontSize * 0.8;
    var gap = fontSize * 0.5;
    ctx.font = '500 ' + fontSize + 'px Inter, system-ui, sans-serif';

    // Measure all traits, wrap to rows
    var rows = [[]];
    var currentRow = 0;
    var currentWidth = 0;
    for (var i = 0; i < traits.length; i++) {
      var tw = ctx.measureText(traits[i]).width + padding * 2 + gap;
      if (currentWidth + tw - gap > maxWidth && rows[currentRow].length > 0) {
        currentRow++;
        rows[currentRow] = [];
        currentWidth = 0;
      }
      rows[currentRow].push(traits[i]);
      currentWidth += tw;
    }

    var lineHeight = fontSize * 2.2;
    var startY = y;

    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      // Measure row width to center
      var rowWidth = 0;
      var measuredWidths = [];
      for (var j = 0; j < row.length; j++) {
        var w = ctx.measureText(row[j]).width + padding * 2;
        measuredWidths.push(w);
        rowWidth += w + gap;
      }
      rowWidth -= gap;
      var startX = x - rowWidth / 2;

      for (var k = 0; k < row.length; k++) {
        var tw2 = measuredWidths[k];
        var th = fontSize * 2;
        var tx = startX + tw2 / 2;
        var ty = startY + r * lineHeight;

        // Pill background
        ctx.beginPath();
        var pillR = th / 2;
        ctx.roundRect(tx - tw2 / 2, ty - th / 2, tw2, th, pillR);
        ctx.fillStyle = 'rgba(139,92,246,0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(139,92,246,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        drawText(ctx, row[k], tx, ty, '500 ' + fontSize + 'px Inter, system-ui, sans-serif', COLORS.accent);
        startX += tw2 + gap - (gap - (measuredWidths.length > 1 ? 0 : 0));
      }
    }
  }

  function drawWatermark(ctx, w, h) {
    drawText(
      ctx, 'soulsketch.app',
      w / 2, h - 30,
      '400 13px Inter, system-ui, sans-serif',
      'rgba(255,255,255,0.2)'
    );
  }

  function drawSeparator(ctx, x, y, width) {
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y);
    ctx.lineTo(x + width / 2, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Layout Renderers ────────────────────────────────────

  function renderStory(ctx, data, img, showWatermark) {
    var w = 1080, h = 1920;
    var cx = w / 2;

    drawGradientBg(ctx, w, h);
    drawStars(ctx, w, h);

    // Brand
    var brandY = 80;
    drawText(ctx, '⭐  SOULSKETCH  ⭐', cx, brandY, '600 24px Inter, system-ui, sans-serif', COLORS.gold);

    // Portrait
    var portraitR = 150;
    var portraitY = 340;
    drawCircularImage(ctx, img, cx, portraitY, portraitR);

    // Soulmate found label
    var foundY = portraitY + portraitR + 60;
    drawText(ctx, '✨ SOULMATE FOUND ✨', cx, foundY, '600 22px Inter, system-ui, sans-serif', COLORS.dim);

    // Names
    var namesY = foundY + 60;
    var nameStr = data.userName + ' 💜 ' + data.soulmateName;
    drawText(ctx, nameStr, cx, namesY, '700 38px Cinzel, serif', COLORS.white);

    // Score ring
    var scoreY = namesY + 130;
    drawScoreRing(ctx, cx, scoreY, 80, data.score, 48);

    // Zodiac
    var zodiacY = scoreY + 120;
    var uSym = ZODIAC_SYMBOLS[data.userZodiac] || '✦';
    var sSym = ZODIAC_SYMBOLS[data.soulmateZodiac] || '✦';
    drawText(ctx, uSym + ' ' + data.userZodiac + '  ×  ' + sSym + ' ' + data.soulmateZodiac, cx, zodiacY, '500 22px Inter, system-ui, sans-serif', COLORS.goldLight);

    // Traits
    var traitsY = zodiacY + 70;
    drawTraits(ctx, data.traits || [], cx, traitsY, w * 0.7, 16);

    // Separator
    var sepY = traitsY + (data.traits ? Math.ceil(data.traits.length / 3) * 40 + 50 : 90);
    drawSeparator(ctx, cx, sepY, 280);

    // CTA
    drawText(ctx, 'Find yours at', cx, sepY + 35, '400 16px Inter, system-ui, sans-serif', COLORS.dim);
    drawText(ctx, 'soulsketch.app', cx, sepY + 60, '600 20px Inter, system-ui, sans-serif', COLORS.gold);

    if (showWatermark) drawWatermark(ctx, w, h);
  }

  function renderSquare(ctx, data, img, showWatermark) {
    var w = 1080, h = 1080;
    var cx = w / 2;

    drawGradientBg(ctx, w, h);
    drawStars(ctx, w, h);

    // Brand
    drawText(ctx, '⭐  SOULSKETCH  ⭐', cx, 50, '600 20px Inter, system-ui, sans-serif', COLORS.gold);

    // Portrait — smaller
    var portraitR = 100;
    var portraitY = 210;
    drawCircularImage(ctx, img, cx, portraitY, portraitR);

    // Soulmate found
    drawText(ctx, '✨ SOULMATE FOUND ✨', cx, portraitY + portraitR + 40, '600 18px Inter, system-ui, sans-serif', COLORS.dim);

    // Names
    var namesY = portraitY + portraitR + 80;
    drawText(ctx, data.userName + ' 💜 ' + data.soulmateName, cx, namesY, '700 32px Cinzel, serif', COLORS.white);

    // Score + Zodiac side by side
    var midY = namesY + 90;
    // Score left
    drawScoreRing(ctx, cx - 130, midY, 55, data.score, 32);
    // Zodiac right
    var uSym = ZODIAC_SYMBOLS[data.userZodiac] || '✦';
    var sSym = ZODIAC_SYMBOLS[data.soulmateZodiac] || '✦';
    drawText(ctx, uSym + ' ' + data.userZodiac, cx + 130, midY - 15, '500 18px Inter, system-ui, sans-serif', COLORS.goldLight);
    drawText(ctx, '×', cx + 130, midY + 12, '500 16px Inter, system-ui, sans-serif', COLORS.dim);
    drawText(ctx, sSym + ' ' + data.soulmateZodiac, cx + 130, midY + 38, '500 18px Inter, system-ui, sans-serif', COLORS.goldLight);

    // Traits
    drawTraits(ctx, data.traits || [], cx, midY + 100, w * 0.7, 14);

    // Separator + CTA
    var sepY = h - 100;
    drawSeparator(ctx, cx, sepY, 240);
    drawText(ctx, 'Find yours at soulsketch.app', cx, sepY + 35, '500 16px Inter, system-ui, sans-serif', COLORS.dim);

    if (showWatermark) drawWatermark(ctx, w, h);
  }

  function renderFeed(ctx, data, img, showWatermark) {
    var w = 1200, h = 628;
    var cy = h / 2;

    drawGradientBg(ctx, w, h);
    drawStars(ctx, w, h);

    // Layout: left = portrait + names, right = score + traits
    var leftCx = w * 0.28;
    var rightCx = w * 0.7;

    // Portrait
    var portraitR = 90;
    drawCircularImage(ctx, img, leftCx, cy - 40, portraitR);

    // Names under portrait
    drawText(ctx, data.userName + ' 💜', leftCx, cy + portraitR + 25, '700 22px Cinzel, serif', COLORS.white);
    drawText(ctx, data.soulmateName, leftCx, cy + portraitR + 55, '700 22px Cinzel, serif', COLORS.gold);

    // Soulmate found label
    drawText(ctx, '✨ SOULMATE FOUND ✨', leftCx, cy - portraitR - 35, '600 14px Inter, system-ui, sans-serif', COLORS.dim);

    // Score ring right side
    drawScoreRing(ctx, rightCx, cy - 40, 60, data.score, 34);

    // Zodiac
    var uSym = ZODIAC_SYMBOLS[data.userZodiac] || '✦';
    var sSym = ZODIAC_SYMBOLS[data.soulmateZodiac] || '✦';
    drawText(ctx, uSym + ' ' + data.userZodiac + ' × ' + sSym + ' ' + data.soulmateZodiac, rightCx, cy + 50, '500 15px Inter, system-ui, sans-serif', COLORS.goldLight);

    // Traits
    drawTraits(ctx, (data.traits || []).slice(0, 3), rightCx, cy + 90, 350, 12);

    // Brand bottom-right
    drawText(ctx, '⭐ SOULSKETCH', w / 2, h - 30, '600 14px Inter, system-ui, sans-serif', 'rgba(212,165,116,0.4)');

    if (showWatermark) drawWatermark(ctx, w, h);
  }

  // ── Load Image ──────────────────────────────────────────

  function loadImage(url) {
    return new Promise(function (resolve) {
      if (!url) { resolve(null); return; }
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  // ── Main API ────────────────────────────────────────────

  /**
   * Generate a branded share card.
   * @param {Object} data
   * @param {string} data.userName
   * @param {string} data.soulmateName
   * @param {string} data.userZodiac
   * @param {string} data.soulmateZodiac
   * @param {number} data.score
   * @param {string[]} data.traits
   * @param {string} [data.portraitUrl] - URL to portrait image (AI-generated or SVG)
   * @param {string} [size='story'] - 'story' | 'square' | 'feed'
   * @param {boolean} [showWatermark=true]
   * @returns {Promise<{blob: Blob, dataUrl: string, blobUrl: string}>}
   */
  function generateShareCard(data, size, showWatermark) {
    size = size || 'story';
    showWatermark = showWatermark !== false;

    var dims = SIZES[size] || SIZES.story;

    return loadImage(data.portraitUrl).then(function (img) {
      // Use OffscreenCanvas when available for performance
      var canvas, ctx;
      if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(dims.w, dims.h);
        ctx = canvas.getContext('2d');
      } else {
        canvas = document.createElement('canvas');
        canvas.width = dims.w;
        canvas.height = dims.h;
        ctx = canvas.getContext('2d');
      }

      // Render based on size
      switch (size) {
        case 'square': renderSquare(ctx, data, img, showWatermark); break;
        case 'feed':   renderFeed(ctx, data, img, showWatermark);   break;
        default:       renderStory(ctx, data, img, showWatermark);  break;
      }

      // Convert to outputs
      var blobPromise, dataUrl;

      if (canvas.convertToBlob) {
        // OffscreenCanvas
        blobPromise = canvas.convertToBlob({ type: 'image/png', quality: 0.92 });
        // Can't get dataUrl directly from OffscreenCanvas, so we'll build it from blob
        dataUrl = null;
      } else {
        dataUrl = canvas.toDataURL('image/png', 0.92);
        blobPromise = new Promise(function (resolve) {
          canvas.toBlob(function (b) { resolve(b); }, 'image/png', 0.92);
        });
      }

      return blobPromise.then(function (blob) {
        var blobUrl = URL.createObjectURL(blob);

        // If we didn't get dataUrl (OffscreenCanvas path), read from blob
        if (!dataUrl) {
          return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onloadend = function () {
              resolve({
                blob: blob,
                dataUrl: reader.result,
                blobUrl: blobUrl,
              });
            };
            reader.readAsDataURL(blob);
          });
        }

        return { blob: blob, dataUrl: dataUrl, blobUrl: blobUrl };
      });
    });
  }

  /**
   * Create a preview image element for the share card.
   */
  function createPreviewElement(cardResult, maxHeight) {
    maxHeight = maxHeight || 400;
    var img = document.createElement('img');
    img.src = cardResult.dataUrl;
    img.style.cssText =
      'max-height:' + maxHeight + 'px;width:auto;border-radius:12px;' +
      'box-shadow:0 8px 40px rgba(0,0,0,0.5);display:block;margin:0 auto;';
    return img;
  }

  // ── Public API ──────────────────────────────────────────
  window.ShareCard = {
    generate: generateShareCard,
    createPreview: createPreviewElement,
    sizes: SIZES,
  };
})();
