/**
 * SoulSketch — Paywall Hook System
 * Staged reveal experience that builds anticipation, not frustration.
 *
 * Stages:
 *   1. FREE immediate  → zodiac, score, 1 trait, first name
 *   2. FREE teaser     → 2 more traits, teaser text w/ gradient fade
 *   3. PROGRESS HOOK   → 99% ring animation + shimmer
 *   4. PAYWALL         → full locked UI + countdown timer
 */

;(function () {
  'use strict';

  /* ───── constants ───── */
  const COUNTDOWN_SECONDS = 600; // 10 minutes (cosmetic)
  const STAGE_DELAY_1 = 1500;   // score count-up
  const STAGE_DELAY_2 = 3000;   // traits + teaser
  const STAGE_DELAY_3 = 5000;   // progress ring to 99%
  const STAGE_DELAY_4 = 7000;   // paywall reveal

  /* ───── public API ───── */
  window.PaywallHook = {
    run: runStagedReveal,
    startCountdown: startCountdown,
    typewriterReveal: typewriterReveal,
    lockedShake: null, // set after DOM ready
  };

  /* ────────────────────────────────────────────
     STAGED REVEAL
     Called from showResult() with result data
  ──────────────────────────────────────────── */
  function runStagedReveal(data) {
    const { score, reading, traits, soulName, soulZodiac, userName, gender } = data;

    // Split reading into 3 parts for staged display
    const paragraphs = reading
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    const teaserParagraph = paragraphs[0] || '';
    const lockedParagraphs = paragraphs.slice(1);

    // Split traits: 1 free + 2 teaser + 2 locked
    const trait1 = traits[0] || 'Mysterious';
    const traitTeaser = traits.slice(1, 3);
    const traitLocked = traits.slice(3);

    // ── STAGE 1: Immediate ──
    // Score ring + name + zodiac + 1 trait are already shown by showResult()
    // We enhance the score animation here
    setTimeout(() => {
      animateNumber('scoreNum', 0, score, 1500);
      const ring = document.getElementById('scoreRing');
      if (ring) {
        const offset = 314 - (314 * score / 100);
        ring.style.strokeDashoffset = offset;
      }
    }, 300);

    // ── STAGE 2: Teaser (after delay) ──
    setTimeout(() => {
      showTeaserTraits(traitTeaser);
      showTeaserText(teaserParagraph);
    }, STAGE_DELAY_2);

    // ── STAGE 3: Progress ring to 99% ──
    setTimeout(() => {
      showProgressHook();
    }, STAGE_DELAY_3);

    // ── STAGE 4: Full paywall ──
    setTimeout(() => {
      showHookPaywall(score, traitLocked, lockedParagraphs);
      if (typeof trackEvent === 'function') trackEvent('paywall_hook_shown');
    }, STAGE_DELAY_4);
  }

  /* ────────────────────────────────────────────
     STAGE 2 — TEASER TRAITS
  ──────────────────────────────────────────── */
  function showTeaserTraits(newTraits) {
    const traitsEl = document.getElementById('traits');
    if (!traitsEl) return;

    newTraits.forEach((t, i) => {
      setTimeout(() => {
        const span = document.createElement('span');
        span.className = 'trait hook-trait-reveal';
        span.textContent = t;
        span.style.opacity = '0';
        span.style.transform = 'translateY(10px) scale(0.9)';
        span.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        traitsEl.appendChild(span);
        requestAnimationFrame(() => {
          span.style.opacity = '1';
          span.style.transform = 'translateY(0) scale(1)';
        });
      }, i * 400);
    });
  }

  /* ────────────────────────────────────────────
     STAGE 2 — TEASER TEXT (gradient fade)
  ──────────────────────────────────────────── */
  function showTeaserText(text) {
    const readingContent = document.getElementById('readingContent');
    if (!readingContent) return;

    // Remove blur from existing reading
    const readingEl = document.getElementById('readingText');
    if (readingEl) {
      readingEl.style.filter = 'none';
      readingEl.style.userSelect = 'auto';
    }

    // Build teaser container
    const teaser = document.createElement('div');
    teaser.id = 'teaserText';
    teaser.className = 'hook-teaser';
    teaser.innerHTML = `
      <div class="hook-teaser-inner">
        <p style="margin-bottom:12px">${text}</p>
      </div>
      <div class="hook-teaser-fade"></div>
      <div class="hook-teaser-cta">✨ Tap to reveal the rest...</div>
    `;

    // Replace the blurred reading with teaser
    readingContent.innerHTML = '';
    readingContent.appendChild(teaser);

    // Animate in
    teaser.style.opacity = '0';
    teaser.style.transform = 'translateY(15px)';
    teaser.style.transition = 'all 0.6s ease-out';
    requestAnimationFrame(() => {
      teaser.style.opacity = '1';
      teaser.style.transform = 'translateY(0)';
    });

    // Tap to read → triggers paywall scroll
    teaser.querySelector('.hook-teaser-cta').addEventListener('click', () => {
      const paywall = document.getElementById('hookPaywall');
      if (paywall) {
        paywall.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pulse the unlock button
        const btn = paywall.querySelector('.cta');
        if (btn) {
          btn.style.transform = 'scale(1.05)';
          setTimeout(() => { btn.style.transform = ''; }, 300);
        }
      }
    });
  }

  /* ────────────────────────────────────────────
     STAGE 3 — PROGRESS RING TO 99%
  ──────────────────────────────────────────── */
  function showProgressHook() {
    // Create a progress section below the teaser
    const resultPage = document.getElementById('resultPage');
    if (!resultPage) return;

    // Remove any existing hook-progress
    const existing = document.getElementById('hookProgress');
    if (existing) existing.remove();

    const section = document.createElement('div');
    section.id = 'hookProgress';
    section.className = 'hook-progress-section';
    section.innerHTML = `
      <div class="hook-progress-ring">
        <svg viewBox="0 0 130 130">
          <defs>
            <linearGradient id="hookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#8b5cf6"/>
              <stop offset="100%" stop-color="#d4a574"/>
            </linearGradient>
          </defs>
          <circle class="hook-ring-bg" cx="65" cy="65" r="55"/>
          <circle class="hook-ring-fg" id="hookRing" cx="65" cy="65" r="55"/>
        </svg>
        <div class="hook-progress-text">
          <span class="hook-progress-pct" id="hookPct">0%</span>
          <span class="hook-progress-label">decoded</span>
        </div>
      </div>
      <div class="hook-progress-message" id="hookMsg">The universe is decoding your connection...</div>
    `;

    // Insert before paywall area
    const paywall = resultPage.querySelector('.paywall');
    if (paywall) {
      resultPage.insertBefore(section, paywall);
    } else {
      resultPage.appendChild(section);
    }

    // Animate ring
    animateProgressRing();
  }

  function animateProgressRing() {
    const ring = document.getElementById('hookRing');
    const pct = document.getElementById('hookPct');
    const msg = document.getElementById('hookMsg');
    if (!ring || !pct) return;

    const circumference = 2 * Math.PI * 55; // ~345.58
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;
    ring.style.transition = 'none';

    const messages = {
      0: 'The universe is decoding your connection...',
      30: 'Your cosmic frequencies are aligning...',
      60: 'Almost there — your souls are resonating...',
      85: 'The final pieces of your destiny...',
      95: 'Just a little more...',
      99: '💜 So close... unlock to see it all'
    };

    let current = 0;
    const target = 99;
    const duration = 2500; // 2.5s to reach 99%
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * target);

      const offset = circumference - (circumference * current / 100);
      ring.style.strokeDashoffset = offset;
      pct.textContent = current + '%';

      // Update message
      for (const [threshold, text] of Object.entries(messages)) {
        if (current >= parseInt(threshold)) {
          msg.textContent = text;
        }
      }

      if (current < target) {
        requestAnimationFrame(step);
      } else {
        // Arrived at 99% — add shimmer + pulse
        ring.classList.add('hook-ring-pulse');
        pct.classList.add('hook-shimmer-text');

        // Add the "?" easter egg
        addEasterEgg(pct);
      }
    }

    requestAnimationFrame(step);
  }

  function addEasterEgg(pctEl) {
    const q = document.createElement('sup');
    q.textContent = '?';
    q.className = 'hook-last-one';
    q.title = "What's the last 1%? 👀";
    q.addEventListener('click', (e) => {
      e.stopPropagation();
      showTooltip(q, "What's the last 1%? 👀\nThe universe keeps its secrets... for now. 💫");
    });
    pctEl.appendChild(q);
  }

  function showTooltip(anchor, text) {
    // Remove existing tooltips
    document.querySelectorAll('.hook-tooltip').forEach(t => t.remove());

    const tip = document.createElement('div');
    tip.className = 'hook-tooltip';
    tip.textContent = text;
    anchor.parentElement.appendChild(tip);

    setTimeout(() => tip.remove(), 3000);
  }

  /* ────────────────────────────────────────────
     STAGE 4 — HOOK PAYWALL
  ──────────────────────────────────────────── */
  function showHookPaywall(score, lockedTraits, lockedParagraphs) {
    const resultPage = document.getElementById('resultPage');
    if (!resultPage) return;

    // Hide old paywall if present
    const oldPaywall = resultPage.querySelector('.paywall');
    if (oldPaywall) oldPaywall.style.display = 'none';

    // Remove existing hook paywall
    const existing = document.getElementById('hookPaywall');
    if (existing) existing.remove();

    const lockedFeatures = [
      { icon: '📖', label: 'Full AI Reading', hint: '3 detailed paragraphs...' },
      { icon: '🎨', label: 'AI Portrait', hint: 'A unique portrait of your match' },
      { icon: '💎', label: 'All 5 Traits', hint: lockedTraits.map(t => `✦ ${t}`).join('  ') },
      { icon: '💕', label: 'Relationship Advice', hint: 'Personalized guidance...' },
      { icon: '🔮', label: 'Compatibility Deep-Dive', hint: 'Beyond the score...' },
      { icon: '📅', label: 'When Will You Meet?', hint: 'The cosmos has a date...' },
    ];

    const section = document.createElement('div');
    section.id = 'hookPaywall';
    section.className = 'hook-paywall fade-in';

    section.innerHTML = `
      <div class="hook-paywall-header">
        <div class="hook-paywall-title">💜 Unlock the remaining ${100 - 28}% of your reading</div>
        <div class="hook-paywall-sub">You've seen 28%. There's so much more waiting.</div>
      </div>

      <div class="hook-countdown" id="hookCountdown">
        <div class="hook-countdown-clock">
          <span class="hook-countdown-icon">⏰</span>
          <span class="hook-countdown-time" id="countdownTime">10:00</span>
        </div>
        <div class="hook-countdown-msg">Your cosmic window closes soon</div>
      </div>

      <div class="hook-features">
        ${lockedFeatures.map(f => `
          <div class="hook-feature locked" onclick="PaywallHook.lockedShake(this)">
            <div class="hook-feature-icon">🔒</div>
            <div class="hook-feature-info">
              <div class="hook-feature-label">${f.label}</div>
              <div class="hook-feature-hint">${f.hint}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="hook-price-options">
        <div class="price-opt" onclick="selectPlan(this,'weekly')" data-plan="weekly">
          <div class="period">Weekly</div>
          <div class="amount">$6.99<span>/wk</span></div>
          <div class="equivalent">Try it out</div>
        </div>
        <div class="price-opt popular active" onclick="selectPlan(this,'monthly')" data-plan="monthly">
          <div class="period">Monthly</div>
          <div class="amount">$9.99<span>/mo</span></div>
          <div class="equivalent">$0.33/day</div>
        </div>
        <div class="price-opt" onclick="selectPlan(this,'yearly')" data-plan="yearly">
          <div class="period">Yearly</div>
          <div class="amount">$39.99<span>/yr</span></div>
          <div class="equivalent">$3.33/mo — Save 67%</div>
        </div>
      </div>

      <button class="cta hook-subscribe-btn" onclick="handleSubscribe()">
        <span class="shimmer"></span>
        🔓 Unlock Everything Now
      </button>

      <div class="hook-guarantee">
        🔒 Secured by Gumroad · Cancel anytime · 7-day money-back guarantee
      </div>

      <div class="hook-social-proof">
        <div class="avatars"><span>👩</span><span>🧑</span><span>👩‍🦱</span><span>👨</span></div>
        <span><strong>2.4M+</strong> soulmates discovered</span>
      </div>
    `;

    // Insert before footer
    const footer = resultPage.querySelector('.footer');
    if (footer) {
      resultPage.insertBefore(section, footer);
    } else {
      resultPage.appendChild(section);
    }

    // Start countdown
    startCountdown();

    if (typeof trackEvent === 'function') trackEvent('paywall_countdown_started');
  }

  /* ────────────────────────────────────────────
     COUNTDOWN TIMER
  ──────────────────────────────────────────── */
  let countdownInterval = null;

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    let remaining = COUNTDOWN_SECONDS;
    const timeEl = document.getElementById('countdownTime');

    function tick() {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      if (timeEl) {
        timeEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

      if (remaining <= 0) {
        clearInterval(countdownInterval);
        // Change CTA to less urgent
        const btn = document.querySelector('#hookPaywall .cta');
        if (btn) {
          btn.innerHTML = '<span class="shimmer"></span> ✨ Extend Your Reading';
          btn.classList.add('hook-subscribe-lapsed');
        }
        const msg = document.querySelector('.hook-countdown-msg');
        if (msg) msg.textContent = 'Your window has closed — but we saved your reading';
        return;
      }
      remaining--;
    }

    tick(); // immediate first tick
    countdownInterval = setInterval(tick, 1000);
  }

  /* ────────────────────────────────────────────
     LOCKED ITEM SHAKE
  ──────────────────────────────────────────── */
  window.PaywallHook.lockedShake = function (el) {
    el.style.animation = 'hookShake 0.5s ease';
    const icon = el.querySelector('.hook-feature-icon');
    if (icon) {
      icon.style.animation = 'hookLockBounce 0.5s ease';
      setTimeout(() => { icon.style.animation = ''; }, 500);
    }
    setTimeout(() => { el.style.animation = ''; }, 500);
  };

  /* ────────────────────────────────────────────
     TYPEWRITER REVEAL (post-subscribe)
  ──────────────────────────────────────────── */
  function typewriterReveal(text, containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.style.filter = 'none';
    container.style.userSelect = 'auto';

    const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    let pIdx = 0;

    function revealParagraph() {
      if (pIdx >= paragraphs.length) {
        if (callback) callback();
        return;
      }

      const p = document.createElement('p');
      p.style.marginBottom = '14px';
      container.appendChild(p);

      const chars = paragraphs[pIdx].split('');
      let cIdx = 0;

      function typeChar() {
        if (cIdx < chars.length) {
          p.textContent += chars[cIdx];
          cIdx++;
          // Variable speed for natural feel
          const delay = chars[cIdx - 1] === '.' ? 80 :
                        chars[cIdx - 1] === ',' ? 40 :
                        chars[cIdx - 1] === ' ' ? 15 : 22;
          setTimeout(typeChar, delay);
        } else {
          pIdx++;
          setTimeout(revealParagraph, 300);
        }
      }

      typeChar();
    }

    revealParagraph();
  }

  /* ────────────────────────────────────────────
     NUMBER ANIMATION
  ──────────────────────────────────────────── */
  function animateNumber(id, from, to, dur) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
