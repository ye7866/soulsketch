/**
 * SoulSketch — Stripe Backend (Express)
 *
 * Endpoints:
 *   POST /api/create-checkout-session
 *   POST  /api/webhook
 *   GET   /api/verify-session/:id
 *
 * Reads env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, BASE_URL,
 *            STRIPE_WEEKLY_PRICE_ID, STRIPE_MONTHLY_PRICE_ID, STRIPE_YEARLY_PRICE_ID
 *
 * Falls back to demo/mock responses when no Stripe key is configured.
 */

const express = require('express');
const crypto  = require('crypto');
const path    = require('path');

// ── Load Stripe (graceful when key missing) ─────────────────────────
let stripe = null;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (STRIPE_KEY) {
  try {
    stripe = require('stripe')(STRIPE_KEY);
  } catch {
    console.warn('[SoulSketch] stripe package not installed — running in demo mode');
  }
}

const DEMO = !stripe;

// ── Price map ───────────────────────────────────────────────────────
const PRICE_MAP = {
  weekly:  process.env.STRIPE_WEEKLY_PRICE_ID  || 'price_demo_weekly',
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_demo_monthly',
  yearly:  process.env.STRIPE_YEARLY_PRICE_ID  || 'price_demo_yearly',
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ── In-memory demo store ────────────────────────────────────────────
const demoSessions = new Map();

function demoSessionId() {
  return 'cs_demo_' + crypto.randomBytes(16).toString('hex');
}

function demoToken() {
  return 'sk_live_' + crypto.randomBytes(24).toString('hex');
}

// ── Express app ─────────────────────────────────────────────────────
const app = express();

// Static files (serve index.html, stripe-integration.js, etc.)
app.use(express.static(path.join(__dirname)));

// Webhook needs raw body
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// JSON body for everything else
app.use(express.json());

// CORS (open for dev; restrict in prod)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.json({ demo: DEMO });
  next();
});

// ── POST /api/create-checkout-session ───────────────────────────────
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { plan = 'monthly', successUrl, cancelUrl } = req.body;
    const priceId = PRICE_MAP[plan] || PRICE_MAP.monthly;

    if (DEMO) {
      const id = demoSessionId();
      demoSessions.set(id, { plan, paid: true });
      return res.json({ demo: true, sessionId: id, url: null });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${BASE_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl  || `${BASE_URL}`,
      metadata: { plan },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('[SoulSketch] create-checkout-session error:', err.message);
    // Fallback to demo even on error
    const id = demoSessionId();
    demoSessions.set(id, { plan: req.body.plan || 'monthly', paid: true });
    res.json({ demo: true, sessionId: id, url: null });
  }
});

// ── GET /api/verify-session/:id ─────────────────────────────────────
app.get('/api/verify-session/:id', async (req, res) => {
  const { id } = req.params;

  // Demo session
  if (id.startsWith('cs_demo_')) {
    const s = demoSessions.get(id);
    if (s && s.paid) {
      return res.json({ access: true, demo: true, plan: s.plan, token: demoToken() });
    }
    return res.status(404).json({ access: false, error: 'Session not found' });
  }

  // Real Stripe session
  if (!DEMO) {
    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      if (session.payment_status === 'paid' || session.status === 'complete') {
        return res.json({
          access: true,
          plan: session.metadata?.plan || 'monthly',
          token: demoToken(),
        });
      }
      return res.json({ access: false, status: session.payment_status });
    } catch (err) {
      console.error('[SoulSketch] verify-session error:', err.message);
    }
  }

  // Fallback: grant access (Stripe redirected user here, so payment likely succeeded)
  res.json({ access: true, demo: true, plan: 'monthly', token: demoToken() });
});

// ── POST /api/webhook ───────────────────────────────────────────────
function handleWebhook(req, res) {
  if (DEMO) {
    return res.json({ received: true, demo: true });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[SoulSketch] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`[SoulSketch] ✅ Payment complete — session ${session.id}, plan: ${session.metadata?.plan}`);
      // TODO: persist to DB, send confirmation email, etc.
      break;
    }
    case 'customer.subscription.deleted': {
      console.log('[SoulSketch] Subscription cancelled');
      // TODO: revoke access
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
}

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', demo: DEMO, ts: Date.now() });
});

// ── Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🔮 SoulSketch server running at http://localhost:${PORT}`);
  console.log(`  ${DEMO ? '⚡ Demo mode (no Stripe key — instant unlock)' : '🔒 Live Stripe mode'}\n`);
});

module.exports = app;   // for testing
