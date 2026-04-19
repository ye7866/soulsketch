/**
 * SoulSketch A/B Test Configuration
 * -----------------------------------
 * Add/remove tests by editing the AB_TESTS array.
 * Each test: { id, name, description, active, variants[] }
 * Variant:  { id, label, weight, overrides: { selector: { prop, value }[] }[] }
 *
 * overrides map CSS selectors to DOM mutations:
 *   - { prop: 'textContent', value: '...' }  → set text
 *   - { prop: 'innerHTML',   value: '...' }  → set HTML
 *   - { prop: 'style',       value: { ... } } → set inline styles
 *   - { prop: 'attr',        value: { name, val } } → set attribute
 *   - { prop: 'dataset',     value: { key, val } }  → set data-*
 *   - { prop: 'visibility',  value: 'hidden'|'visible' } → show/hide element
 */

const AB_TESTS = [
  // ── Test 1: CTA Button Text ──────────────────────────────────────
  {
    id: 'cta_text',
    name: 'CTA Button Text',
    description: 'Test different call-to-action button copy',
    active: true,
    variants: [
      {
        id: 'A',
        label: 'Reveal My Soulmate',
        weight: 25,
        overrides: [
          {
            selector: '#submitBtn',
            prop: 'innerHTML',
            value: '<span class="shimmer"></span>✨ Reveal My Soulmate ✨'
          }
        ]
      },
      {
        id: 'B',
        label: 'Who Is Your Soulmate?',
        weight: 25,
        overrides: [
          {
            selector: '#submitBtn',
            prop: 'innerHTML',
            value: '<span class="shimmer"></span>🔮 Who Is Your Soulmate?'
          }
        ]
      },
      {
        id: 'C',
        label: 'Find Your Cosmic Match',
        weight: 25,
        overrides: [
          {
            selector: '#submitBtn',
            prop: 'innerHTML',
            value: '<span class="shimmer"></span>💜 Find Your Cosmic Match'
          }
        ]
      },
      {
        id: 'D',
        label: 'Discover Your Destiny',
        weight: 25,
        overrides: [
          {
            selector: '#submitBtn',
            prop: 'innerHTML',
            value: '<span class="shimmer"></span>❤️ Discover Your Destiny'
          }
        ]
      }
    ]
  },

  // ── Test 2: Pricing ──────────────────────────────────────────────
  {
    id: 'pricing',
    name: 'Pricing Strategy',
    description: 'Test different price points and plan structures',
    active: true,
    variants: [
      {
        id: 'A',
        label: 'Control ($6.99/$9.99/$39.99)',
        weight: 25,
        overrides: [
          {
            selector: '[data-plan="weekly"] .amount',
            prop: 'innerHTML',
            value: '$6.99<span>/wk</span>'
          },
          {
            selector: '[data-plan="monthly"] .amount',
            prop: 'innerHTML',
            value: '$9.99<span>/mo</span>'
          },
          {
            selector: '[data-plan="yearly"] .amount',
            prop: 'innerHTML',
            value: '$39.99<span>/yr</span>'
          },
          {
            selector: '[data-plan="weekly"]',
            prop: 'visibility',
            value: 'visible'
          },
          {
            selector: '[data-plan="weekly"] .equivalent',
            prop: 'textContent',
            value: 'Try it out'
          },
          {
            selector: '[data-plan="monthly"] .equivalent',
            prop: 'textContent',
            value: '$0.33/day'
          },
          {
            selector: '[data-plan="yearly"] .equivalent',
            prop: 'textContent',
            value: '$3.33/mo — Save 67%'
          }
        ]
      },
      {
        id: 'B',
        label: 'Lower ($4.99/$7.99/$29.99)',
        weight: 25,
        overrides: [
          {
            selector: '[data-plan="weekly"] .amount',
            prop: 'innerHTML',
            value: '$4.99<span>/wk</span>'
          },
          {
            selector: '[data-plan="monthly"] .amount',
            prop: 'innerHTML',
            value: '$7.99<span>/mo</span>'
          },
          {
            selector: '[data-plan="yearly"] .amount',
            prop: 'innerHTML',
            value: '$29.99<span>/yr</span>'
          },
          {
            selector: '[data-plan="weekly"]',
            prop: 'visibility',
            value: 'visible'
          },
          {
            selector: '[data-plan="weekly"] .equivalent',
            prop: 'textContent',
            value: 'Great value'
          },
          {
            selector: '[data-plan="monthly"] .equivalent',
            prop: 'textContent',
            value: '$0.27/day'
          },
          {
            selector: '[data-plan="yearly"] .equivalent',
            prop: 'textContent',
            value: '$2.50/mo — Save 67%'
          }
        ]
      },
      {
        id: 'C',
        label: 'Higher, no weekly ($12.99/$49.99)',
        weight: 25,
        overrides: [
          {
            selector: '[data-plan="weekly"]',
            prop: 'visibility',
            value: 'hidden'
          },
          {
            selector: '[data-plan="monthly"] .amount',
            prop: 'innerHTML',
            value: '$12.99<span>/mo</span>'
          },
          {
            selector: '[data-plan="yearly"] .amount',
            prop: 'innerHTML',
            value: '$49.99<span>/yr</span>'
          },
          {
            selector: '[data-plan="monthly"] .equivalent',
            prop: 'textContent',
            value: '$0.43/day'
          },
          {
            selector: '[data-plan="yearly"] .equivalent',
            prop: 'textContent',
            value: '$4.17/mo — Save 68%'
          }
        ]
      },
      {
        id: 'D',
        label: 'Free trial (3 days / $9.99 / $39.99)',
        weight: 25,
        overrides: [
          {
            selector: '[data-plan="weekly"] .period',
            prop: 'textContent',
            value: 'Free Trial'
          },
          {
            selector: '[data-plan="weekly"] .amount',
            prop: 'innerHTML',
            value: 'FREE<span>/3 days</span>'
          },
          {
            selector: '[data-plan="weekly"] .equivalent',
            prop: 'textContent',
            value: 'Then $9.99/mo'
          },
          {
            selector: '[data-plan="monthly"] .amount',
            prop: 'innerHTML',
            value: '$9.99<span>/mo</span>'
          },
          {
            selector: '[data-plan="yearly"] .amount',
            prop: 'innerHTML',
            value: '$39.99<span>/yr</span>'
          },
          {
            selector: '[data-plan="weekly"]',
            prop: 'visibility',
            value: 'visible'
          }
        ]
      }
    ]
  },

  // ── Test 3: Social Proof ─────────────────────────────────────────
  {
    id: 'social_proof',
    name: 'Social Proof Copy',
    description: 'Test different social proof messaging',
    active: true,
    variants: [
      {
        id: 'A',
        label: '2.4M+ soulmates',
        weight: 25,
        overrides: [
          {
            selector: '#socialProofText',
            prop: 'innerHTML',
            value: '<strong>2.4M+</strong> soulmates discovered'
          }
        ]
      },
      {
        id: 'B',
        label: 'Rating + downloads',
        weight: 25,
        overrides: [
          {
            selector: '#socialProofText',
            prop: 'innerHTML',
            value: '4.8⭐ rating · 2.4M downloads'
          }
        ]
      },
      {
        id: 'C',
        label: 'Join 2.4M+ people',
        weight: 25,
        overrides: [
          {
            selector: '#socialProofText',
            prop: 'innerHTML',
            value: 'Join <strong>2.4M+</strong> people who found their match'
          }
        ]
      },
      {
        id: 'D',
        label: 'Trending #1',
        weight: 25,
        overrides: [
          {
            selector: '#socialProofText',
            prop: 'innerHTML',
            value: '🔥 Trending #1 in Spirituality'
          }
        ]
      }
    ]
  },

  // ── Test 4: Paywall Headline ─────────────────────────────────────
  {
    id: 'paywall_headline',
    name: 'Paywall Headline',
    description: 'Test different paywall title copy',
    active: true,
    variants: [
      {
        id: 'A',
        label: 'Unlock Your Full Reading',
        weight: 25,
        overrides: [
          {
            selector: '.paywall-title',
            prop: 'textContent',
            value: '🔓 Unlock Your Full Reading'
          }
        ]
      },
      {
        id: 'B',
        label: 'Soulmate Is Waiting',
        weight: 25,
        overrides: [
          {
            selector: '.paywall-title',
            prop: 'textContent',
            value: '💜 Your Soulmate Is Waiting...'
          }
        ]
      },
      {
        id: 'C',
        label: 'Stars Have Spoken',
        weight: 25,
        overrides: [
          {
            selector: '.paywall-title',
            prop: 'textContent',
            value: '✨ The Stars Have Spoken — See The Full Story'
          }
        ]
      },
      {
        id: 'D',
        label: 'Complete Cosmic Profile',
        weight: 25,
        overrides: [
          {
            selector: '.paywall-title',
            prop: 'textContent',
            value: '🔮 Complete Your Cosmic Profile'
          }
        ]
      }
    ]
  }
];

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AB_TESTS };
}
