/* app.js — ∞ Infinity Slot Machine main application logic */
(function () {
  'use strict';

  // ── Slot machine symbols ───────────────────────────────────────────────────
  const SYMBOLS = ['💎', '⚛️', '🔬', '₿', '∞', '🔮', '⚡', '🌟', '🧬', '💻'];

  // ── Status message pools ───────────────────────────────────────────────────
  const WIN_STATUSES = [
    'B55 GRAVITY ENGINE ENGAGED — SILVER INDEX RISING',
    'INFINITY SYSTEM ACTIVE — CRUSHING BITCOIN — ∞ ∞ ∞',
    'EVERY SPIN GENERATES A SCIENTIFIC RESEARCH TOKEN',
    'SIGN IN TO SAVE TOKENS · EVERY SEARCH IS A RECORD',
  ];
  const LOSS_STATUSES = [
    'EVERY SPIN GENERATES A SCIENTIFIC RESEARCH TOKEN',
    'SIGN IN TO SAVE TOKENS · EVERY SEARCH IS A RECORD',
    'B55 GRAVITY ENGINE ENGAGED — SILVER INDEX RISING',
    '₿ BTC → 💎 DIAMOND → 🥇 GOLD → ∞ INFINITY',
  ];

  // ── State management ───────────────────────────────────────────────────────
  const STATE_KEY = 'infinitySlotState';
  const DEFAULT_STATE = { spins: 0, score: 0, token: null };

  function loadState() {
    try { return Object.assign({}, DEFAULT_STATE, JSON.parse(localStorage.getItem(STATE_KEY) || '{}')); }
    catch { return Object.assign({}, DEFAULT_STATE); }
  }

  function saveState(s) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (_) {}
  }

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const els = {
    spinBtn:        $('spin-btn'),
    spinCount:      $('spin-count'),
    scoreDisplay:   $('score-display'),
    slotStatus:     $('slot-status'),
    winIndicator:   $('win-indicator'),
    reel0:          $('reel-0'),
    reel1:          $('reel-1'),
    reel2:          $('reel-2'),
    tokenIf:        $('token-if'),
    tokenTitle:     $('token-title'),
    tokenAuthors:   $('token-authors'),
    tokenJournal:   $('token-journal'),
    tokenDoi:       $('token-doi'),
    tokenKeywords:  $('token-keywords'),
    tokenAbstract:  $('token-abstract'),
    articleToggle:  $('article-toggle'),
    fullArticle:    $('full-article'),
    searchBadge:    $('search-enriched-badge'),
    articleMeta:    $('article-meta'),
    fullAbstract:   $('full-abstract'),
    secIntro:       $('section-intro'),
    secMethods:     $('section-methods'),
    secResults:     $('section-results'),
    secDiscussion:  $('section-discussion'),
    secConclusion:  $('section-conclusion'),
    references:     $('references'),
    chatMessages:   $('chat-messages'),
    chatInput:      $('chat-input'),
    chatSend:       $('chat-send'),
  };

  // ── Reel helpers ───────────────────────────────────────────────────────────
  function randSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

  function generateResult() {
    // ~50 % chance of a win (pair on the row)
    if (Math.random() < 0.5) {
      const winSym = randSymbol();
      // Which two of the three reels show the winner
      const idx = Math.floor(Math.random() * 3);
      const syms = [randSymbol(), randSymbol(), randSymbol()];
      syms[idx] = winSym;
      // make sure at least one other matches
      syms[(idx + 1) % 3] = winSym;
      return { syms, won: true };
    }
    // No match: all three different
    let a = randSymbol(), b, c;
    do { b = randSymbol(); } while (b === a);
    do { c = randSymbol(); } while (c === a || c === b);
    return { syms: [a, b, c], won: false };
  }

  function animateReel(reelEl, finalSym, stopAfterMs) {
    return new Promise(resolve => {
      reelEl.classList.add('spinning');
      const iv = setInterval(() => { reelEl.textContent = randSymbol(); }, 80);
      setTimeout(() => {
        clearInterval(iv);
        reelEl.textContent = finalSym;
        reelEl.classList.remove('spinning');
        resolve();
      }, stopAfterMs);
    });
  }

  // ── Token display ──────────────────────────────────────────────────────────
  function displayToken(tok) {
    if (!tok) return;
    els.tokenIf.textContent = `IF: ${tok.impactFactor} · ${tok.fieldTags.join(', ')}`;
    els.tokenTitle.textContent = tok.title;
    els.tokenAuthors.textContent = '👥 ' + tok.authors.join(', ');
    els.tokenJournal.textContent = `📰 ${tok.journal} (${tok.year})`;
    els.tokenDoi.textContent = `DOI: ${tok.doi}`;

    // Keywords
    els.tokenKeywords.innerHTML = '';
    tok.keywords.forEach(kw => {
      const span = document.createElement('span');
      span.className = 'keyword-tag';
      span.textContent = kw;
      els.tokenKeywords.appendChild(span);
    });

    els.tokenAbstract.textContent = tok.abstract;

    // Full article
    els.searchBadge.style.display = tok.searchEnriched ? 'inline-block' : 'none';
    els.articleMeta.textContent =
      `Spin #${tok.spin} · Score: ${tok.spinScore} · ${tok.authors.join(', ')}`;
    els.fullAbstract.textContent = tok.abstract;
    els.secIntro.textContent = tok.sections.introduction;
    els.secMethods.textContent = tok.sections.methods;
    els.secResults.textContent = tok.sections.results;
    els.secDiscussion.textContent = tok.sections.discussion;
    els.secConclusion.textContent = tok.sections.conclusion;

    els.references.innerHTML = '';
    tok.references.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      els.references.appendChild(li);
    });
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── Commit via server ──────────────────────────────────────────────────────
  async function commitToken(tok) {
    try {
      const res = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tok }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.committed) console.log('[∞] Token committed:', data.path);
    } catch (_) {
      /* server may not be configured — silent fail */
    }
  }

  // ── Main spin handler ──────────────────────────────────────────────────────
  let spinning = false;
  async function doSpin() {
    if (spinning) return;
    spinning = true;
    els.spinBtn.disabled = true;
    els.winIndicator.textContent = '';
    els.winIndicator.className = 'win-indicator';

    const state = loadState();
    state.spins += 1;

    const result = generateResult();

    // Animate reels sequentially (staggered stop)
    const reelEls = [els.reel0, els.reel1, els.reel2];
    await Promise.all([
      animateReel(reelEls[0], result.syms[0], 900),
      animateReel(reelEls[1], result.syms[1], 1200),
      animateReel(reelEls[2], result.syms[2], 1500),
    ]);

    // Mark winning reels
    if (result.won) {
      const winSym = result.syms.find(s => result.syms.filter(x => x === s).length >= 2);
      reelEls.forEach((el, i) => {
        if (result.syms[i] === winSym) el.classList.add('reel-win');
      });
    }

    // Generate token
    const tok = TokenGenerator.generate(state.spins);
    if (!result.won) tok.spinScore = 0;
    tok.won = result.won;

    state.score += tok.spinScore;
    state.token = tok;
    saveState(state);

    // Update counters
    els.spinCount.textContent = state.spins;
    els.scoreDisplay.textContent = state.score;

    // Status + win indicator
    if (result.won) {
      els.slotStatus.textContent = pick(WIN_STATUSES);
      els.winIndicator.textContent = '✅ WIN — pair found!';
      els.winIndicator.className = 'win-indicator win';
    } else {
      els.slotStatus.textContent = pick(LOSS_STATUSES);
      els.winIndicator.textContent = '🔄 No match. Spin again.';
      els.winIndicator.className = 'win-indicator loss';
    }

    // Display token
    displayToken(tok);

    // Commit to repo (fire & forget)
    commitToken(tok);

    spinning = false;
    els.spinBtn.disabled = false;
  }

  // ── Article toggle ─────────────────────────────────────────────────────────
  let articleOpen = false;
  els.articleToggle.addEventListener('click', () => {
    articleOpen = !articleOpen;
    els.fullArticle.style.display = articleOpen ? 'block' : 'none';
    els.articleToggle.textContent = articleOpen ? '📄 Hide Article' : '📄 Full Article';
  });

  // ── AI Chat ────────────────────────────────────────────────────────────────
  const AI_OPENERS = [
    'Great question! Based on the current research token,',
    'Interesting! The paper on',
    'Looking at the latest token:',
    'From an interdisciplinary perspective,',
    'The research at the intersection of',
  ];
  const AI_CLOSERS = [
    'Would you like me to search for more related work?',
    'Shall I look up the DOI for you?',
    'I can cross-reference this with DuckDuckGo or Archive.org.',
    'Further reading is available via the links above.',
  ];

  function aiResponse(userMsg) {
    const state = loadState();
    const tok = state.token;
    if (!tok) {
      return '🤖 Spin the reels first to generate a research token, then ask me anything about it!';
    }
    const kw1 = tok.keywords[0] || tok.fieldTags[0];
    const kw2 = tok.keywords[1] || tok.fieldTags[1];
    const q = encodeURIComponent(`${kw1} ${kw2} ${userMsg}`);
    const ddg = `https://duckduckgo.com/?q=${q}`;
    return `🤖 ${pick(AI_OPENERS)} <em>${tok.title.substring(0, 60)}…</em> ` +
      `explores ${kw1} and ${kw2}. ` +
      `<a href="${ddg}" target="_blank" rel="noopener">Search DuckDuckGo ↗</a> · ` +
      pick(AI_CLOSERS);
  }

  function appendChatMsg(html, cls) {
    const div = document.createElement('div');
    div.className = `chat-msg ${cls}`;
    div.innerHTML = html;
    els.chatMessages.appendChild(div);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  }

  function sendChat() {
    const msg = els.chatInput.value.trim();
    if (!msg) return;
    appendChatMsg(msg, 'user-msg');
    els.chatInput.value = '';
    setTimeout(() => appendChatMsg(aiResponse(msg), 'ai-msg'), 400);
  }

  els.chatSend.addEventListener('click', sendChat);
  els.chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  // ── Spin button ────────────────────────────────────────────────────────────
  els.spinBtn.addEventListener('click', doSpin);

  // ── Init ───────────────────────────────────────────────────────────────────
  (function init() {
    const state = loadState();
    els.spinCount.textContent = state.spins;
    els.scoreDisplay.textContent = state.score;
    if (state.token) displayToken(state.token);
  })();
})();
