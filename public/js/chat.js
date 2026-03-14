/* chat.js — ∞ Infinity Smart AI Chat
   Flow: User query → DuckDuckGo search (server proxy) → reasoning chain → response
   If Chrome's built-in AI (Gemma Nano / window.ai) is available, it synthesises
   the search results into a natural language answer.  Falls back to a structured
   reasoning chain when the model is unavailable. */

const InfinityChat = (() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let aiSession = null;  // Chrome built-in AI session (Gemma Nano)

  // ── Chrome built-in AI (Gemma Nano / Prompt API) ──────────────────────────
  async function tryBuiltInAI() {
    try {
      if (!window.ai?.languageModel) return null;
      const caps = await window.ai.languageModel.capabilities();
      if (caps.available === 'no') return null;
      const session = await window.ai.languageModel.create({
        systemPrompt:
          'You are the Infinity Research AI for the ∞ Infinity System — a radio-themed ' +
          'research platform. Answer questions naturally and concisely. When given DuckDuckGo ' +
          'search results, use them to ground your answer and cite sources. Topics include ' +
          'radio channels, science, Bitcoin, cryptography, quantum computing, and the Token Marketplace.',
      });
      console.log('[∞ Chat] Chrome built-in AI (Gemma Nano) ready');
      return session;
    } catch (e) {
      console.log('[∞ Chat] Built-in AI unavailable:', e.message);
      return null;
    }
  }

  // ── DuckDuckGo search via /api/search proxy ────────────────────────────────
  async function ddgSearch(query) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ── Extract usable facts from DDG response ────────────────────────────────
  function extractFacts(data) {
    if (!data) return [];
    const facts = [];
    if (data.Answer)       facts.push({ src: 'Instant Answer', text: data.Answer,       url: null });
    if (data.AbstractText) facts.push({ src: data.AbstractSource || 'Wikipedia', text: data.AbstractText, url: data.AbstractURL });
    if (data.Definition)   facts.push({ src: data.DefinitionSource || 'Dictionary', text: data.Definition, url: data.DefinitionURL });
    (data.RelatedTopics || []).slice(0, 3).forEach(t => {
      if (t.Text) facts.push({ src: 'Related', text: t.Text, url: t.FirstURL });
    });
    return facts;
  }

  // ── Domain-aware fallback (no search results or AI) ───────────────────────
  function domainFallback(query, ctx) {
    const q = query.toLowerCase();
    if (/bitcoin|btc|blockchain/.test(q))
      return '🤖 Bitcoin uses SHA-256 proof-of-work secured by a Merkle tree blockchain. Each block contains a cryptographic hash of the previous block, making the ledger tamper-evident. The Lightning Network adds fast off-chain payments.';
    if (/quantum/.test(q))
      return '🤖 Quantum computing exploits superposition and entanglement for computation. Key metrics are qubit coherence time, gate fidelity, and quantum volume. Surface codes provide error correction for fault-tolerant gates.';
    if (/jazz|radio|shortwave|fm|am|ham/.test(q))
      return '🤖 Radio channels range from AM (530–1700 kHz) through FM (87.5–108 MHz) to shortwave (1.7–30 MHz) and digital DAB. Ham operators use licensed bands across HF, VHF, and UHF for long-distance communication.';
    if (/token|wallet|marketplace|spend/.test(q))
      return '🤖 Infinity tokens are earned at 1 per hour just by having the app open. They accumulate in your Wallet and can be spent in the Marketplace to buy rare coins, collectibles, and digital items. Tokens have no monetary value — they\'re earned, not bought.';
    if (ctx)
      return `🤖 Based on the current research token "<em>${ctx.title.substring(0, 55)}…</em>", key topics include ${(ctx.keywords || ctx.fieldTags || []).slice(0, 2).join(' and ')}. Spin the Radio Crusher to generate more tokens!`;
    return '🤖 I didn\'t find a direct answer. Try rephrasing or check DuckDuckGo directly.';
  }

  // ── Reasoning chain builder ───────────────────────────────────────────────
  const MAX_PRIMARY_TEXT = 320; // chars shown from the top DDG result
  const MAX_RELATED_TEXT = 160; // chars shown from secondary result

  function buildResponse(query, facts, ctx) {
    let html = '';
    if (facts.length > 0) {
      const primary = facts[0];
      html += `🤖 ${esc(primary.text.slice(0, MAX_PRIMARY_TEXT))}${primary.text.length > MAX_PRIMARY_TEXT ? '…' : ''}`;
      if (facts[1]) html += `\n\n📚 <em>${esc(facts[1].text.slice(0, MAX_RELATED_TEXT))}</em>`;
      const links = facts.filter(f => f.url).slice(0, 2);
      if (links.length)
        html += '\n\n🔗 ' + links.map(f => `<a href="${f.url}" target="_blank" rel="noopener noreferrer">${esc(f.src)} ↗</a>`).join(' · ');
    } else {
      html += domainFallback(query, ctx);
    }
    const ddg = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    html += `\n\n<a href="${ddg}" target="_blank" rel="noopener noreferrer">🦆 Search more on DuckDuckGo ↗</a>`;
    return html;
  }

  // ── Reasoning steps UI ────────────────────────────────────────────────────
  function showReasoning(steps) {
    const panel = $('chat-reasoning');
    const stepsEl = $('chat-reasoning-steps');
    if (!panel || !stepsEl) return;
    panel.style.display = 'block';
    stepsEl.innerHTML = steps.map((s, i) => `<div class="reasoning-step" style="animation-delay:${i * 0.12}s">${s}</div>`).join('');
  }

  function hideReasoning() {
    const panel = $('chat-reasoning');
    if (panel) panel.style.display = 'none';
  }

  function updateBadge(source) {
    const badge = $('chat-ai-badge');
    if (!badge) return;
    if (source === 'gemma') {
      badge.textContent = '🧠 Gemma AI';
      badge.className   = 'chat-ai-badge badge-gemma';
    } else {
      badge.textContent = '⚡ DDG + Reasoning';
      badge.className   = 'chat-ai-badge';
    }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Main chat entry point ─────────────────────────────────────────────────
  async function chat(userMsg, tokenContext) {
    const steps = [];

    // Step 1 — parse query
    steps.push(`🔍 Parsing: "<em>${esc(userMsg.slice(0, 55))}</em>"`);
    showReasoning(steps);

    // Step 2 — search DDG
    steps.push('📡 Searching DuckDuckGo…');
    showReasoning(steps);

    const [ddgData] = await Promise.all([ddgSearch(userMsg)]);
    const facts = extractFacts(ddgData);

    if (facts.length > 0) {
      steps.push(`✅ Found ${facts.length} result(s) from DuckDuckGo`);
    } else {
      steps.push('⚠️ No direct results — using domain knowledge');
    }

    // Step 3 — cross-reference token context
    if (tokenContext) {
      steps.push(`🎙️ Cross-referencing radio token: "<em>${esc(tokenContext.title.slice(0, 45))}…</em>"`);
    }
    showReasoning(steps);

    // Step 4 — try Chrome built-in AI
    if (!aiSession) aiSession = await tryBuiltInAI();

    let html, source;
    if (aiSession) {
      steps.push('🧠 Gemma AI synthesising response…');
      showReasoning(steps);
      try {
        const searchCtx = facts.length
          ? `\n\nDuckDuckGo results:\n${facts.map(f => `- [${f.src}] ${f.text.slice(0, 200)}`).join('\n')}`
          : '';
        const tokCtx = tokenContext
          ? `\n\nCurrent radio research token: "${tokenContext.title}" | keywords: ${(tokenContext.keywords || tokenContext.fieldTags || []).join(', ')}`
          : '';
        const prompt = `User: ${userMsg}${searchCtx}${tokCtx}\n\nAnswer naturally, cite sources where available.`;
        const raw    = await aiSession.prompt(prompt);
        const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(userMsg)}`;
        html   = `🤖 ${raw}\n\n<a href="${ddgUrl}" target="_blank" rel="noopener noreferrer">🦆 More on DuckDuckGo ↗</a>`;
        source = 'gemma';
      } catch (e) {
        console.warn('[∞ Chat] Gemma error, falling back:', e.message);
        aiSession = null;
        html   = buildResponse(userMsg, facts, tokenContext);
        source = 'reasoning';
      }
    } else {
      steps.push('⚙️ Building reasoned response…');
      showReasoning(steps);
      html   = buildResponse(userMsg, facts, tokenContext);
      source = 'reasoning';
    }

    steps.push('✅ Response ready');
    showReasoning(steps);
    setTimeout(hideReasoning, 2500);

    updateBadge(source);
    return { html, steps, source };
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    // Warm up AI session in background — non-blocking
    if (window.ai?.languageModel) {
      tryBuiltInAI().then(s => { if (s) aiSession = s; });
    }
  }

  return { chat, init };
})();
