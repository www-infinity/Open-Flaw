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

// ── HTTP helper (follows one redirect) ───────────────────────────────────────
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

app.listen(PORT, () => {
  console.log(`∞ Infinity System running on http://localhost:${PORT}`);
});
