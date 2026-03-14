'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'www-infinity';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Open-Flaw';

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

app.listen(PORT, () => {
  console.log(`∞ Infinity System running on http://localhost:${PORT}`);
});
