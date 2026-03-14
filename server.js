'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'www-infinity';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Open-Flaw';

const SEARCH_TIMEOUT_MS = 8000;
const AI_TIMEOUT_MS = 30000;

// ── HTTPS GET helper (follows one redirect) ───────────────────────────────────
function fetchHttps(urlStr, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(urlStr, {
      headers: {
        'User-Agent': 'InfinitySystem/1.0 (https://github.com/www-infinity/Open-Flaw)',
        'Accept': 'application/json',
        ...extraHeaders,
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHttps(res.headers.location, extraHeaders).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.setTimeout(SEARCH_TIMEOUT_MS, () => { req.destroy(); reject(new Error('Search request timed out')); });
  });
}

// ── HTTPS POST helper ─────────────────────────────────────────────────────────
function postHttps(urlStr, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port:     url.port || 443,
      path:     url.pathname + url.search,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...extraHeaders,
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(AI_TIMEOUT_MS, () => { req.destroy(); reject(new Error('AI request timed out')); });
    req.write(body);
    req.end();
  });
}

// ── POST /api/commit ──────────────────────────────────────────────────────────
app.post('/api/commit', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'object') {
    return res.status(400).json({ error: 'Invalid token data' });
  }
  if (!GITHUB_TOKEN) {
    return res.json({ committed: false, reason: 'No GitHub token configured' });
  }
  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const filename = `tokens/spin-${token.spin}-${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify(token, null, 2)).toString('base64');
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filename,
      message: `🔬 Research token: Spin #${token.spin} — ${token.title.substring(0, 60)}`,
      content,
    });
    res.json({ committed: true, path: filename });
  } catch (error) {
    console.error('GitHub commit error:', error.message);
    res.json({ committed: false, reason: error.message });
  }
});

// ── GET /api/search — DuckDuckGo Instant Answer proxy ────────────────────────
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 200);
  if (!q) return res.status(400).json({ error: 'Missing query parameter' });
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&skip_disambig=1&no_html=1&t=infinity-system`;
    const body = await fetchHttps(url);
    const data = JSON.parse(body);
    res.json(data);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search unavailable', message: err.message });
  }
});

// ── GET /api/radio — Radio Browser community API proxy ───────────────────────
app.get('/api/radio', async (req, res) => {
  const tag    = String(req.query.tag    || '').trim().slice(0, 60);
  const name   = String(req.query.name   || '').trim().slice(0, 60);
  const limit  = Math.min(parseInt(req.query.limit) || 10, 20);
  if (!tag && !name) return res.status(400).json({ error: 'tag or name required' });

  try {
    // Use the community Radio Browser API (no API key required)
    const qs = tag
      ? `tag=${encodeURIComponent(tag)}&limit=${limit}&order=votes&reverse=true&hidebroken=true`
      : `name=${encodeURIComponent(name)}&limit=${limit}&order=votes&reverse=true&hidebroken=true`;
    const url = `https://de1.api.radio-browser.info/json/stations/search?${qs}`;
    const body = await fetchHttps(url, {
      'User-Agent': 'InfinitySystem/1.0 (https://github.com/www-infinity/Open-Flaw)',
    });
    const stations = JSON.parse(body);
    const safe = stations.map(s => ({
      name:     s.name,
      url_resolved: s.url_resolved,
      country:  s.country,
      tags:     s.tags,
      bitrate:  s.bitrate,
      codec:    s.codec,
      favicon:  s.favicon,
    }));
    res.json(safe);
  } catch (err) {
    console.error('Radio Browser error:', err.message);
    res.status(500).json({ error: 'Radio search unavailable', message: err.message });
  }
});

// ── POST /api/ai — LLM proxy (keeps API key hidden from client) ───────────────
// Maximum individual message length — prevents abuse while allowing detailed queries
const AI_MAX_MSG_CHARS = 4000;

app.post('/api/ai', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  // Limit to reasonable sizes to prevent abuse
  if (messages.length > 20) {
    return res.status(400).json({ error: 'Too many messages' });
  }
  for (const m of messages) {
    if (!m || typeof m.role !== 'string' || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    if (m.content.length > AI_MAX_MSG_CHARS) {
      return res.status(400).json({ error: 'Message too long' });
    }
  }

  const AI_API_KEY = process.env.AI_API_KEY;
  const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const AI_MODEL   = process.env.AI_MODEL   || 'gpt-3.5-turbo';

  if (!AI_API_KEY) {
    return res.status(503).json({ error: 'AI not configured', hint: 'Set AI_API_KEY in .env' });
  }

  try {
    const payload = JSON.stringify({
      model: AI_MODEL,
      messages,
      max_tokens: 600,
      temperature: 0.75,
    });
    const data = await postHttps(AI_API_URL, payload, {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'User-Agent': 'InfinitySystem/1.0',
    });
    const result = JSON.parse(data);
    if (result.error) {
      console.error('AI API error:', result.error.message);
      return res.status(502).json({ error: result.error.message || 'AI API error' });
    }
    const reply = result.choices?.[0]?.message?.content || '';
    res.json({ reply, model: result.model || AI_MODEL });
  } catch (err) {
    console.error('AI proxy error:', err.message);
    res.status(500).json({ error: 'AI request failed', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`∞ Infinity System running on http://localhost:${PORT}`);
});
