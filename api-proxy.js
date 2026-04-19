/**
 * SoulSketch API Proxy
 * Zero-dependency Node.js server — serves static files + POST /api/reading + POST /api/generate-portrait
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node api-proxy.js
 *   # or without key (uses local template fallback):
 *   node api-proxy.js
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const engine = require('./ai-engine');

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const STATIC_DIR = __dirname;

// ============================================================
// PORTRAIT PROMPT ENGINE (mirrors ai-portrait.js for Node)
// ============================================================
const ZODIAC_EXPRESSIONS = {
  Aries:      'strong determined gaze, fiery confident energy',
  Taurus:     'warm gentle smile, grounded serene presence',
  Gemini:     'playful curious eyes, lively mischievous spark',
  Cancer:     'soft nurturing expression, tender emotional depth',
  Leo:        'confident radiant smile, regal magnetic charm',
  Virgo:      'composed elegant look, thoughtful refined poise',
  Libra:      'graceful balanced expression, harmonious beauty',
  Scorpio:    'intense mysterious gaze, deep penetrating eyes',
  Sagittarius:'adventurous bright eyes, optimistic free spirit',
  Capricorn:  'focused ambitious look, determined steady presence',
  Aquarius:   'unique visionary stare, unconventional brilliance',
  Pisces:     'dreamy compassionate eyes, ethereal gentle soul',
};

const ZODIAC_DETAILS = {
  Aries:      'small ram constellation freckle near the temple',
  Taurus:     'delicate flower tucked behind the ear',
  Gemini:     'subtle dual-toned hair highlights',
  Cancer:     'tiny crescent moon earring',
  Leo:        'faint crown-shaped hair accessory',
  Virgo:      'small wheat stalk tucked in the hair',
  Libra:      'elegant dangling scale-shaped earring',
  Scorpio:    'mysterious shadow falling across one eye',
  Sagittarius:'small arrow-shaped hair pin',
  Capricorn:  'subtle horn-shaped hair clips',
  Aquarius:   'flowing water-stream hair detail with tiny waves',
  Pisces:     'small dual fish hair clips with bubble details',
};

function buildPortraitPrompt(zodiac, gender) {
  const expression = ZODIAC_EXPRESSIONS[zodiac] || ZODIAC_EXPRESSIONS.Aries;
  const detail = ZODIAC_DETAILS[zodiac] || '';

  let personDesc;
  if (gender === 'female') {
    personDesc = 'a young woman, slightly wavy hair, delicate features, wearing a thin chain necklace';
  } else if (gender === 'male') {
    personDesc = 'a young man, short styled hair, strong jawline, wearing a casual collar';
  } else {
    personDesc = 'a young person, androgynous features, flowing textured hair, minimalist jewelry';
  }

  return [
    `A romantic pencil sketch portrait of ${personDesc},`,
    'soft charcoal drawing style,',
    `${expression},`,
    detail ? `${detail},` : '',
    'drawn on cream textured paper,',
    'artistic portrait illustration,',
    'warm golden lighting,',
    'monochrome with subtle gold accents,',
    'face centered, shoulders visible,',
    'high detail, museum quality sketch',
  ].filter(Boolean).join(' ');
}

// ============================================================
// LRU CACHE (max 24 entries for portrait generations)
// ============================================================
const portraitCache = new Map();
const PORTRAIT_CACHE_MAX = 24;

function portraitCacheKey(zodiac, gender) {
  return `${zodiac}:${gender}`;
}

function getPortraitFromCache(zodiac, gender) {
  const key = portraitCacheKey(zodiac, gender);
  if (portraitCache.has(key)) {
    // Move to end (most recently used)
    const val = portraitCache.get(key);
    portraitCache.delete(key);
    portraitCache.set(key, val);
    return val;
  }
  return null;
}

function setPortraitCache(zodiac, gender, data) {
  const key = portraitCacheKey(zodiac, gender);
  if (portraitCache.size >= PORTRAIT_CACHE_MAX) {
    // Delete oldest (first) entry
    const firstKey = portraitCache.keys().next().value;
    portraitCache.delete(firstKey);
  }
  portraitCache.set(key, data);
}

// ============================================================
// RATE LIMITER (max 10 portrait generations per minute)
// ============================================================
const portraitTimestamps = [];
const PORTRAIT_RATE_LIMIT = 10;
const PORTRAIT_RATE_WINDOW = 60 * 1000; // 1 minute

function isPortraitRateLimited() {
  const now = Date.now();
  // Clean old entries
  while (portraitTimestamps.length > 0 && portraitTimestamps[0] < now - PORTRAIT_RATE_WINDOW) {
    portraitTimestamps.shift();
  }
  if (portraitTimestamps.length >= PORTRAIT_RATE_LIMIT) {
    return true;
  }
  portraitTimestamps.push(now);
  return false;
}

// ============================================================
// DALL-E 3 API CALLER
// ============================================================
function callOpenAIImage(prompt) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY) {
      return reject(new Error('No OPENAI_API_KEY configured'));
    }

    const body = JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      style: 'natural',
      response_format: 'url',
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.data && parsed.data[0] && parsed.data[0].url) {
            resolve({ imageUrl: parsed.data[0].url, revisedPrompt: parsed.data[0].revised_prompt });
          } else {
            reject(new Error('Unexpected OpenAI response: ' + JSON.stringify(parsed).slice(0, 200)));
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenAI response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('OpenAI request timeout')); });
    req.write(body);
    req.end();
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function serveStatic(req, res) {
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  // Security: prevent directory traversal
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  // Try file, then file + .html
  const candidates = [filePath];
  if (!path.extname(filePath)) candidates.push(filePath + '.html');

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate);
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': mime,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      });
      fs.createReadStream(candidate).pipe(res);
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // API routes
  if (req.method === 'POST' && req.url === '/api/reading') {
    try {
      const body = await readBody(req);
      if (!body.userName) return sendJSON(res, 400, { error: 'userName is required' });

      const params = {
        userName:       body.userName       || 'Seeker',
        userZodiac:     body.userZodiac     || 'Aries',
        soulmateName:   body.soulmateName   || '',
        soulmateZodiac: body.soulmateZodiac || 'Libra',
        priority:       body.priority       || 'passion',
        apiKey:         OPENAI_API_KEY,
      };

      const result = await engine.generate(params);
      return sendJSON(res, 200, result);
    } catch (err) {
      console.error('[api-proxy] Error:', err);
      try {
        const fallback = engine.templateGenerate(await readBody(req).catch(() => ({})));
        return sendJSON(res, 200, fallback);
      } catch {
        return sendJSON(res, 500, { error: 'Failed to generate reading' });
      }
    }
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJSON(res, 200, {
      status: 'ok',
      openai: OPENAI_API_KEY ? 'configured' : 'not configured (using local engine)',
      portrait_cache: portraitCache.size,
      uptime: process.uptime(),
    });
  }

  // Portrait generation endpoint
  if (req.method === 'POST' && req.url === '/api/generate-portrait') {
    try {
      const body = await readBody(req);
      const zodiac = body.zodiac || 'Aries';
      const gender = body.gender || 'other';

      // Check cache first
      const cached = getPortraitFromCache(zodiac, gender);
      if (cached) {
        return sendJSON(res, 200, { ...cached, cached: true });
      }

      // Rate limit check
      if (isPortraitRateLimited()) {
        return sendJSON(res, 429, {
          error: 'Rate limited — max 10 portrait generations per minute',
          retryAfter: 60,
        });
      }

      const prompt = buildPortraitPrompt(zodiac, gender);

      // If no API key, return fallback (no image, frontend will use SVG)
      if (!OPENAI_API_KEY) {
        console.log(`[portrait] No API key — returning fallback for ${zodiac}/${gender}`);
        return sendJSON(res, 200, {
          imageUrl: null,
          prompt: prompt,
          cached: false,
          fallback: true,
        });
      }

      // Call DALL-E 3
      console.log(`[portrait] Generating for ${zodiac}/${gender}...`);
      const result = await callOpenAIImage(prompt);

      const responseData = {
        imageUrl: result.imageUrl,
        prompt: result.revisedPrompt || prompt,
      };

      // Cache the result
      setPortraitCache(zodiac, gender, responseData);

      return sendJSON(res, 200, { ...responseData, cached: false });
    } catch (err) {
      console.error('[portrait] Error:', err.message);
      return sendJSON(res, 200, {
        imageUrl: null,
        prompt: '',
        cached: false,
        fallback: true,
        error: err.message,
      });
    }
  }

  // Static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  ✨ SoulSketch API running on http://localhost:${PORT}`);
  console.log(`  📡 OpenAI: ${OPENAI_API_KEY ? 'configured ✓' : 'not set — using local template engine'}`);
  console.log(`  📁 Static: ${STATIC_DIR}\n`);
});
