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

// ── HTML page builder — generates a standalone research-paper page per token ──
function buildTokenPage(token) {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  const channel   = token.radioChannel || 'Radio Crusher';
  const authors   = (token.authors  || []).map(esc).join(', ');
  const keywords  = (token.keywords || []).map(k => `<span class="kw">${esc(k)}</span>`).join(' ');
  const refItems  = (token.references || []).map(r => `<li>${esc(r)}</li>`).join('\n          ');
  const sec       = token.sections || {};
  const appUrl    = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/`;
  const ts        = new Date().toUTCString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(token.title)}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Georgia,serif;background:#0a0a0f;color:#e8e8f0;min-height:100vh;
         padding:2rem 1rem;line-height:1.65}
    a{color:#7ec8ff;text-decoration:none}a:hover{text-decoration:underline}
    header{display:flex;align-items:center;justify-content:space-between;
           border-bottom:1px solid #2a2a3a;padding-bottom:1rem;margin-bottom:2rem}
    .back{font-size:.9rem;opacity:.8}.brand{font-size:1.2rem;letter-spacing:.05em}
    article{max-width:780px;margin:0 auto}
    h1{font-size:1.55rem;color:#c9f0ff;margin-bottom:1rem;line-height:1.35}
    .meta{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;font-size:.82rem;
          color:#9090b0;margin-bottom:.6rem}
    .channel{color:#f0c060;font-weight:700}
    .authors{font-size:.9rem;margin:.4rem 0;color:#b8b8d0}
    .doi{font-size:.8rem;color:#6080c0;margin:.3rem 0 .8rem}
    .keywords{display:flex;flex-wrap:wrap;gap:.3rem;margin:.6rem 0 1.4rem}
    .kw{background:#1a1a2e;border:1px solid #3a3a5a;border-radius:3px;
        padding:.15rem .5rem;font-size:.78rem;color:#a0c0e8}
    section{margin:1.5rem 0}
    h2{font-size:1.05rem;color:#80d0c0;border-bottom:1px solid #1e1e30;
       padding-bottom:.3rem;margin-bottom:.7rem;text-transform:uppercase;
       letter-spacing:.06em;font-family:monospace}
    p{margin-bottom:.8rem;text-align:justify}
    ol{padding-left:1.4rem}
    li{margin-bottom:.35rem;font-size:.82rem;color:#9090b0}
    footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #1e1e30;
           text-align:center;font-size:.78rem;color:#505070}
    .badge{display:inline-block;background:#1a2a1a;border:1px solid #2a5a2a;
           border-radius:4px;padding:.2rem .6rem;font-size:.78rem;color:#80e080;
           margin-bottom:1rem}
    @media(max-width:600px){h1{font-size:1.2rem}body{padding:1rem .6rem}}
  </style>
</head>
<body>
  <header>
    <a class="back" href="${appUrl}">← ∞ Infinity System</a>
    <span class="brand">∞ Open-Flaw Research</span>
  </header>
  <article>
    <div class="badge">📻 ${esc(token.radioIcon || '')} ${esc(channel)} · Spin #${esc(String(token.spin))}</div>
    <h1>${esc(token.title)}</h1>
    <div class="meta">
      <span class="channel">${esc(token.radioIcon || '📻')} ${esc(channel)}</span>
      <span>${esc(token.journal || '')} (${esc(String(token.year || ''))})</span>
      <span>IF: ${esc(String(token.impactFactor || ''))}</span>
      <span>${esc(token.timestamp || ts)}</span>
    </div>
    <div class="authors">👥 ${authors}</div>
    <div class="doi">DOI: <a href="https://doi.org/${esc(token.doi)}" target="_blank" rel="noopener noreferrer">${esc(token.doi)}</a></div>
    <div class="keywords">${keywords}</div>

    <section>
      <h2>Abstract</h2>
      <p>${esc(token.abstract || '')}</p>
    </section>
    <section>
      <h2>1. Introduction</h2>
      <p>${esc(sec.introduction || '')}</p>
    </section>
    <section>
      <h2>2. Materials &amp; Methods</h2>
      <p>${esc(sec.methods || '')}</p>
    </section>
    <section>
      <h2>3. Results</h2>
      <p>${esc(sec.results || '')}</p>
    </section>
    <section>
      <h2>4. Discussion</h2>
      <p>${esc(sec.discussion || '')}</p>
    </section>
    <section>
      <h2>5. Conclusion</h2>
      <p>${esc(sec.conclusion || '')}</p>
    </section>
    <section>
      <h2>References</h2>
      <ol>
          ${refItems}
      </ol>
    </section>
  </article>
  <footer>
    <p>Generated by <a href="${appUrl}">∞ Infinity System · Open-Flaw</a> · ${ts}</p>
  </footer>
</body>
</html>`;
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
    const octokit  = new Octokit({ auth: GITHUB_TOKEN });
    const stamp    = Date.now();
    const jsonPath = `tokens/spin-${token.spin}-${stamp}.json`;
    const pagePath = `tokens/pages/spin-${token.spin}-${stamp}.html`;

    // Commit the JSON token data
    const jsonContent = Buffer.from(JSON.stringify(token, null, 2)).toString('base64');
    await octokit.rest.repos.createOrUpdateFileContents({
      owner:   GITHUB_OWNER,
      repo:    GITHUB_REPO,
      path:    jsonPath,
      message: `🔬 Research token: Spin #${token.spin} — ${token.title.substring(0, 60)}`,
      content: jsonContent,
    });

    // Build and commit the HTML webpage for this token
    const htmlContent = Buffer.from(buildTokenPage(token)).toString('base64');
    await octokit.rest.repos.createOrUpdateFileContents({
      owner:   GITHUB_OWNER,
      repo:    GITHUB_REPO,
      path:    pagePath,
      message: `🌐 Token webpage: Spin #${token.spin} — ${token.title.substring(0, 60)}`,
      content: htmlContent,
    });

    const pageUrl = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/${pagePath}`;
    res.json({ committed: true, path: jsonPath, pagePath, pageUrl });
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
