/**
 * SoulSketch — Unified Server
 * Handles: static files, AI reading, portrait generation, LemonSqueezy payment webhooks
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

// ── Payment config (Gumroad) ───────────────────────────────────────
const GUMROAD_WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET || null;
const DEMO = !GUMROAD_WEBHOOK_SECRET;

// In-memory stores
const paidOrders = new Map();     // orderId → { plan, email, ts }
const demoSessions = new Map();
function demoSessionId() { return 'ls_demo_' + crypto.randomBytes(16).toString('hex'); }
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

// ── Gumroad webhook signature verification ──────────────────────────
function verifyGumroadSignature(payload, secret) {
  if (!secret) return false;
  // Gumroad sends a 'signing_secret' field in the body for verification
  // Or you can verify the source IP (Gumroad sends from specific IPs)
  // For simplicity, we check if the provided secret matches
  return payload.resource?.signing_secret === secret || payload.signing_secret === secret;
}

// ── Express middleware ──────────────────────────────────────────────
// Webhook needs raw body BEFORE json parser
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  let body;
  try {
    body = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Gumroad ping verification (they send a test ping first)
  if (body.ping) {
    console.log('[webhook] Gumroad ping received ✓');
    return res.json({ received: true });
  }

  // Gumroad sale event
  const sale = body;
  const productName = (sale.product_name || '').toLowerCase();
  const email = sale.email || '';
  const saleId = sale.sale_id || sale.id || 'unknown';
  const plan = ['weekly', 'monthly', 'yearly'].find(p => productName.includes(p)) || 'monthly';

  paidOrders.set(saleId, { plan, email, ts: Date.now() });
  console.log(`✅ Sale received — ${saleId}, plan: ${plan}, email: ${email}`);

  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(STATIC_DIR, { extensions: ['html'] }));

// CORS
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

// ── API: Verify Order (LemonSqueezy) ────────────────────────────────
app.get('/api/verify-order/:id', (req, res) => {
  const { id } = req.params;

  // Demo order
  if (id.startsWith('ls_demo_')) {
    const s = demoSessions.get(id);
    if (s?.paid) return res.json({ access: true, demo: true, plan: s.plan, token: demoToken() });
    return res.status(404).json({ access: false });
  }

  // Real order from webhook store
  const order = paidOrders.get(id);
  if (order) {
    return res.json({ access: true, plan: order.plan, token: demoToken() });
  }

  // Unknown order — if payment is configured, be strict; otherwise grant access
  if (GUMROAD_WEBHOOK_SECRET) {
    return res.status(404).json({ access: false, error: 'Order not found' });
  }
  res.json({ access: true, demo: true, plan: 'monthly', token: demoToken() });
});

// ── API: Demo Checkout (for testing without real LemonSqueezy) ──────
app.post('/api/demo-checkout', (req, res) => {
  const { plan = 'monthly' } = req.body;
  const id = demoSessionId();
  demoSessions.set(id, { plan, paid: true });
  res.json({ demo: true, orderId: id });
});

// ── Health Check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    demo: DEMO,
    openai: !!OPENAI_API_KEY,
    payment: GUMROAD_WEBHOOK_SECRET ? 'gumroad' : 'demo',
    uptime: process.uptime(),
  });
});

// ── Catch-all: serve index.html ─────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✨ SoulSketch running at http://localhost:${PORT}`);
  console.log(`  📡 OpenAI: ${OPENAI_API_KEY ? 'configured ✓' : 'not set (local engine)'}`);
  console.log(`  💳 Payment: ${DEMO ? 'demo mode' : 'Gumroad ✓'}`);
  console.log(`  📁 Static: ${STATIC_DIR}\n`);
});

module.exports = app;
