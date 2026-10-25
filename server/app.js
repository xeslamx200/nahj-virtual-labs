/**
 * The Express app (API + optional static front-end), without a listening socket, so the same code
 * runs as a long-lived server (server/index.js) and as a serverless function (api/index.js).
 */
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { askAssistant, assistantAvailable, errorCategory, assistantModel, assistantProvider, parseAssistantRequest } from './assistant.js';
import { hasTextbookIndex, textbookStats } from './textbook.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const app = express();
app.disable('x-powered-by');
// Behind a hosting proxy (Vercel, Render, ...) the client IP is in X-Forwarded-For; without this every visitor shares one rate-limit bucket.
app.set('trust proxy', true);
app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' });
  next();
});
app.use(express.json({ limit: '64kb' }));

// Simple in-memory rate limit for the assistant (per IP, per minute). On serverless hosting each instance keeps its own counter.
const RATE_LIMIT = Number(process.env.ASSISTANT_RATE_LIMIT) || 20;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > 60_000) hits.delete(k);
  return list.length > RATE_LIMIT;
}

app.get('/api/health', (_req, res) => res.set('Cache-Control', 'no-store').json({ ok: true }));

app.get('/api/assistant/status', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({
    available: assistantAvailable(),
    provider: assistantProvider(),
    model: assistantModel(),
    // whether curriculum retrieval is possible on this server (never any textbook content)
    textbook: { available: hasTextbookIndex(), passages: hasTextbookIndex() ? textbookStats().passages : 0 },
  });
});

app.post('/api/assistant', async (req, res) => {
  if (!assistantAvailable()) return res.status(503).json({ error: 'not_configured' });
  if (rateLimited(req.ip ?? 'unknown')) return res.status(429).json({ error: 'rate_limited' });
  const parsed = parseAssistantRequest(req.body);
  if (!parsed) return res.status(400).json({ error: 'invalid_request' });
  try {
    const started = Date.now();
    const result = await askAssistant(parsed);
    // Metadata only: no prompt, question or answer text is logged.
    console.log(`[assistant] ok provider=${result.provider} model=${result.model} lang=${parsed.lang} lab=${parsed.lab} passages=${result.passages ?? 0} textbook_cited=${result.sources?.textbook.length ?? 0} ms=${Date.now() - started}`);
    res.json(result);
  } catch (err) {
    // Log only the HTTP status and an error category: no key, prompt or response body.
    const category = errorCategory(err);
    console.error(`[assistant] request failed: provider=${assistantProvider()} lang=${parsed.lang} status=${err?.status ?? 'none'} category=${category}`);
    res.status(502).json({ error: 'upstream_error', status: err?.status ?? null, category });
  }
});

const dist = join(__dirname, '..', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(dist, 'index.html')));
}

// Unknown API paths and malformed requests get a short JSON error, never a stack trace.
app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err, _req, res, _next) => {
  const status = err?.status >= 400 && err?.status < 500 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'server_error' : 'invalid_request' });
});

export default app;
