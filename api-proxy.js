/**
 * SoulSketch API Proxy
 * Zero-dependency Node.js server — serves static files + POST /api/reading
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node api-proxy.js
 *   # or without key (uses local template fallback):
 *   node api-proxy.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const engine = require('./ai-engine');

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const STATIC_DIR = __dirname;

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
      uptime: process.uptime(),
    });
  }

  // Static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  ✨ SoulSketch API running on http://localhost:${PORT}`);
  console.log(`  📡 OpenAI: ${OPENAI_API_KEY ? 'configured ✓' : 'not set — using local template engine'}`);
  console.log(`  📁 Static: ${STATIC_DIR}\n`);
});
