/**
 * SoulSketch — Unified Server
 * Merges: static serving, AI reading API, portrait generation, Stripe checkout/webhook
 *
 * Usage:
 *   cp .env.example .env  # fill in your keys
 *   npm install
 *   npm start
 */

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const engine = require('./ai-engine');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const STATIC_DIR = __dirname;

// ── Stripe setup (graceful fallback) ───────────────────────────────
let stripe = null;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (STRIPE_KEY) {
  try { stripe = require('stripe')(STRIPE_KEY); } catch { console.warn('stripe package missing'); }
}
const DEMO = !stripe;

const PRICE_MAP = {
  weekly:  process.env.STRIPE_WEEKLY_PRICE_ID  || 'price_demo_weekly',
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_demo_monthly',
  yearly:  process.env.STRIPE_YEARLY_PRICE_ID  || 'price_demo_yearly',
};

const demoSessions = new Map();
function demoSessionId() { return 'cs_demo_' + crypto.randomBytes(16).toString('hex'); }
function demoToken() { return 'sk_live_' + crypto.randomBytes(24).toString('hex'); }

// ── Portrait cache + rate limiter ───────────────────────────────────
const portraitCache = new Map();
const PORTRAIT_CACHE_MAX = 24;
const portraitTimestamps = [];
const PORTRAIT_RATE_LIMIT = 10;
const PORTRAIT_RATE_WINDOW = 60000;

function isPortraitRateLimited() {
  const now = Date.now();
  while (portraitTimestamps.length > 0 && portraitTimestamps[0] < now - PORTRAIT_RATE_WINDOW) portraitTimestamps.shift();
  if (portraitTimestamps.length >= PORTRAIT_RATE_LIMIT) return true;
  portraitTimestamps.push(now);
  return false;
}

// ── Portrait prompt builder ─────────────────────────────────────────
const ZODIAC_EXPRESSIONS = {
  Aries:'strong determined gaze, fiery confident energy', Taurus:'warm gentle smile, grounded serene presence',
  Gemini:'playful curious eyes, lively mischievous spark', Cancer:'soft nurturing expression, tender emotional depth',
  Leo:'confident radiant smile, regal magnetic charm', Virgo:'composed elegant look, thoughtful refined poise',
  Libra:'graceful balanced expression, harmonious beauty', Scorpio:'intense mysterious gaze, deep penetrating eyes',
  Sagittarius:'adventurous bright eyes, optimistic free spirit', Capricorn:'focused ambitious look, determined steady presence',
  Aquarius:'unique visionary stare, unconventional brilliance', Pisces:'dreamy compassionate eyes, ethereal gentle soul',
};
const ZODIAC_DETAILS = {
  Aries:'small ram constellation freckle near the temple', Taurus:'delicate flower tucked behind the ear',
  Gemini:'subtle dual-toned hair highlights', Cancer:'tiny crescent moon earring',
  Leo:'faint crown-shaped hair accessory', Virgo:'small wheat stalk tucked in the hair',
  Libra:'elegant dangling scale-shaped earring', Scorpio:'mysterious shadow falling across one eye',
  Sagittarius:'small arrow-shaped hair pin', Capricorn:'subtle horn-shaped hair clips',
  Aquarius:'flowing water-stream hair detail with tiny waves', Pisces:'small dual fish hair clips with bubble details',
};

function buildPortraitPrompt(zodiac, gender) {
  const expression = ZODIAC_EXPRESSIONS[zodiac] || ZODIAC_EXPRESSIONS.Aries;
  const detail = ZODIAC_DETAILS[zodiac] || '';
  let personDesc;
  if (gender === 'female') personDesc = 'a young woman, slightly wavy hair, delicate features, wearing a thin chain necklace';
  else if (gender === 'male') personDesc = 'a young man, short styled hair, strong jawline, wearing a casual collar';
  else personDesc = 'a young person, androgynous features, flowing textured hair, minimalist jewelry';
  return [
    `A romantic pencil sketch portrait of ${personDesc},`, 'soft charcoal drawing style,',
    `${expression},`, detail ? `${detail},` : '', 'drawn on cream textured paper,',
    'artistic portrait illustration,', 'warm golden lighting,', 'monochrome with subtle gold accents,',
    'face centered, shoulders visible,', 'high detail, museum quality sketch',
  ].filter(Boolean).join(' ');
}

function callOpenAIImage(prompt) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY) return reject(new Error('No OPENAI_API_KEY'));
    const body = JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', style: 'natural', response_format: 'url' });
    const req = https.request({
      hostname: 'api.openai.com', path: '/v1/images/generations', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.data?.[0]?.url) resolve({ imageUrl: parsed.data[0].url, revisedPrompt: parsed.data[0].revised_prompt });
          else reject(new Error('Unexpected: ' + JSON.stringify(parsed).slice(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Express middleware ──────────────────────────────────────────────
// Webhook needs raw body BEFORE json parser
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (DEMO) return res.json({ received: true, demo: true });
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, secret); }
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  switch (event.type) {
    case 'checkout.session.completed':
      console.log(`✅ Payment complete — session ${event.data.object.id}, plan: ${event.data.object.metadata?.plan}`);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled');
      break;
  }
  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(STATIC_DIR, { extensions: ['html'] }));

// CORS — restrict in production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// ── API: AI Reading ─────────────────────────────────────────────────
app.post('/api/reading', async (req, res) => {
  try {
    const body = req.body;
    if (!body.userName) return res.status(400).json({ error: 'userName required' });
    const result = await engine.generate({
      userName: body.userName || 'Seeker',
      userZodiac: body.userZodiac || 'Aries',
      soulmateName: body.soulmateName || '',
      soulmateZodiac: body.soulmateZodiac || 'Libra',
      priority: body.priority || 'passion',
      apiKey: OPENAI_API_KEY,
    });
    res.json(result);
  } catch (err) {
    console.error('[reading] Error:', err);
    const fallback = engine.templateGenerate(req.body || {});
    res.json(fallback);
  }
});

// ── API: Portrait Generation ────────────────────────────────────────
app.post('/api/generate-portrait', async (req, res) => {
  try {
    const { zodiac = 'Aries', gender = 'other' } = req.body;
    const cacheKey = `${zodiac}:${gender}`;
    const cached = portraitCache.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });
    if (isPortraitRateLimited()) return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });

    const prompt = buildPortraitPrompt(zodiac, gender);
    if (!OPENAI_API_KEY) return res.json({ imageUrl: null, prompt, cached: false, fallback: true });

    const result = await callOpenAIImage(prompt);
    const data = { imageUrl: result.imageUrl, prompt: result.revisedPrompt || prompt };
    if (portraitCache.size >= PORTRAIT_CACHE_MAX) portraitCache.delete(portraitCache.keys().next().value);
    portraitCache.set(cacheKey, data);
    res.json({ ...data, cached: false });
  } catch (err) {
    console.error('[portrait] Error:', err.message);
    res.json({ imageUrl: null, prompt: '', cached: false, fallback: true, error: err.message });
  }
});

// ── API: Stripe Checkout Session ────────────────────────────────────
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
      cancel_url: cancelUrl || `${BASE_URL}`,
      metadata: { plan },
    });
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('[checkout] Error:', err.message);
    const id = demoSessionId();
    demoSessions.set(id, { plan: req.body.plan || 'monthly', paid: true });
    res.json({ demo: true, sessionId: id, url: null });
  }
});

// ── API: Verify Session ─────────────────────────────────────────────
app.get('/api/verify-session/:id', async (req, res) => {
  const { id } = req.params;
  if (id.startsWith('cs_demo_')) {
    const s = demoSessions.get(id);
    if (s?.paid) return res.json({ access: true, demo: true, plan: s.plan, token: demoToken() });
    return res.status(404).json({ access: false });
  }
  if (!DEMO) {
    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      if (session.payment_status === 'paid' || session.status === 'complete')
        return res.json({ access: true, plan: session.metadata?.plan || 'monthly', token: demoToken() });
      return res.json({ access: false, status: session.payment_status });
    } catch (err) { console.error('[verify] Error:', err.message); }
  }
  res.json({ access: true, demo: true, plan: 'monthly', token: demoToken() });
});

// ── Health Check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', demo: DEMO, openai: !!OPENAI_API_KEY, uptime: process.uptime() });
});

// ── Catch-all: serve index.html for SPA-style routes ────────────────
app.get('*', (req, res) => {
  // Don't hijack API routes
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✨ SoulSketch running at http://localhost:${PORT}`);
  console.log(`  📡 OpenAI: ${OPENAI_API_KEY ? 'configured ✓' : 'not set (local engine)'}`);
  console.log(`  💳 Stripe: ${DEMO ? 'demo mode' : 'live ✓'}`);
  console.log(`  📁 Static: ${STATIC_DIR}\n`);
});

module.exports = app;
