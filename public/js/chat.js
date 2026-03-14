/* chat.js — ∞ Infinity Smart AI Chat
   Flow: User query → DuckDuckGo search (server proxy) → LLM synthesis via /api/ai
   Falls back to Chrome built-in AI (Gemma Nano) if available, then to a structured
   reasoning chain when neither LLM source is reachable. */

const InfinityChat = (() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let aiSession = null;  // Chrome built-in AI session (Gemma Nano) — optional tier 2

  // ── System prompt for the LLM ─────────────────────────────────────────────
  const SYSTEM_PROMPT =
    'You are the Infinity AI — a sharp, cool, deeply knowledgeable companion inside the ∞ Infinity System, ' +
    'a live radio-research platform built by www-infinity. ' +
    'Talk like a brilliant, real human — not a robot. Be direct, confident, and occasionally drop something ' +
    'unexpected or witty. No filler phrases like "Certainly!" or "Great question!". Just dive straight in. ' +
    'When you get DuckDuckGo search results, weave them naturally into your answer and cite sources inline. ' +
    'Keep answers tight but meaty — no waffle, no bullet-point walls. ' +
    'You know everything about: live radio (shortwave, FM, AM, ham, scanner, worldwide streams), ' +
    'scientific research, Bitcoin & blockchain, quantum computing, cryptography, the Token Marketplace, ' +
    'the ∞ Infinity System itself, music genres, and whatever the user throws at you. ' +
    'You are always researching, always curious, always real.';

  // ── Tier 1 — Server-side LLM via /api/ai (API key kept server-side) ─────────
  async function callServerLLM(userMsg, facts, tokenContext) {
    try {
      const searchCtx = facts.length
        ? '\n\nDuckDuckGo search results:\n' +
          facts.map(f => `- [${f.src}] ${f.text.slice(0, 250)}`).join('\n')
        : '';
      const tokCtx = tokenContext
        ? `\n\nCurrent radio research token: "${tokenContext.title}" | ` +
          `keywords: ${(tokenContext.keywords || tokenContext.fieldTags || []).join(', ')}`
        : '';
      const userContent = userMsg + searchCtx + tokCtx;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: userContent   },
          ],
        }),
      });
      if (res.status === 503) return null;  // AI not configured — silently fall through
      if (!res.ok) return null;
      const data = await res.json();
      return data.reply || null;
    } catch {
      return null;
    }
  }

  // ── Tier 2 — Chrome built-in AI (Gemma Nano / window.ai) ─────────────────
  async function tryBuiltInAI() {
    try {
      if (!window.ai?.languageModel) return null;
      const caps = await window.ai.languageModel.capabilities();
      if (caps.available === 'no') return null;
      const session = await window.ai.languageModel.create({ systemPrompt: SYSTEM_PROMPT });
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
    if (data.Answer)       facts.push({ src: 'Instant Answer', text: data.Answer, url: null });
    if (data.AbstractText) facts.push({ src: data.AbstractSource || 'Wikipedia', text: data.AbstractText, url: data.AbstractURL });
    if (data.Definition)   facts.push({ src: data.DefinitionSource || 'Dictionary', text: data.Definition, url: data.DefinitionURL });
    (data.RelatedTopics || []).slice(0, 3).forEach(t => {
      if (t.Text) facts.push({ src: 'Related', text: t.Text, url: t.FirstURL });
    });
    return facts;
  }

  // ── Tier 3 — Domain-aware fallback ────────────────────────────────────────
  function domainFallback(query, ctx) {
    const q = query.toLowerCase();
    if (/bitcoin|btc|blockchain/.test(q))
      return '😎 Bitcoin uses SHA-256 proof-of-work secured by a Merkle tree blockchain. Each block contains a cryptographic hash of the previous block, making the ledger tamper-evident. The Lightning Network adds fast off-chain payments.';
    if (/quantum/.test(q))
      return '😎 Quantum computing exploits superposition and entanglement for computation. Key metrics are qubit coherence time, gate fidelity, and quantum volume. Surface codes provide error correction for fault-tolerant gates.';
    if (/jazz|radio|shortwave|fm|am|ham/.test(q))
      return '😎 Radio channels range from AM (530–1700 kHz) through FM (87.5–108 MHz) to shortwave (1.7–30 MHz) and digital DAB. Ham operators use licensed bands across HF, VHF, and UHF for long-distance communication.';
    if (/token|wallet|marketplace|spend/.test(q))
      return '😎 Infinity tokens are earned at 1 per hour just by having the app open. They accumulate in your Wallet and can be spent in the Marketplace to buy rare coins, collectibles, and digital items. Tokens have no monetary value — they\'re earned, not bought.';
    if (ctx)
      return `😎 Based on the current research token "<em>${ctx.title.substring(0, 55)}…</em>", key topics include ${(ctx.keywords || ctx.fieldTags || []).slice(0, 2).join(' and ')}. Spin the Radio Crusher to generate more tokens!`;
    return '😎 I didn\'t find a direct answer. Try rephrasing or check DuckDuckGo directly.';
  }

  // ── Reasoning chain builder (tier 3) ─────────────────────────────────────
  const MAX_PRIMARY_TEXT = 320;
  const MAX_RELATED_TEXT = 160;

  function buildResponse(query, facts, ctx) {
    let html = '';
    if (facts.length > 0) {
      const primary = facts[0];
      html += `😎 ${esc(primary.text.slice(0, MAX_PRIMARY_TEXT))}${primary.text.length > MAX_PRIMARY_TEXT ? '…' : ''}`;
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
    stepsEl.innerHTML = steps.map((s, i) =>
      `<div class="reasoning-step" style="animation-delay:${i * 0.12}s">${s}</div>`).join('');
  }

  function hideReasoning() {
    const panel = $('chat-reasoning');
    if (panel) panel.style.display = 'none';
  }

  function updateBadge(source) {
    const badge = $('chat-ai-badge');
    if (!badge) return;
    if (source === 'llm') {
      badge.textContent = '🧠 Full LLM · Live AI';
      badge.className   = 'chat-ai-badge badge-llm';
    } else if (source === 'gemma') {
      badge.textContent = '🧠 Gemma Nano · On-Device';
      badge.className   = 'chat-ai-badge badge-gemma';
    } else {
      badge.textContent = '⚡ DDG + Reasoning';
      badge.className   = 'chat-ai-badge';
    }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Main chat entry point ─────────────────────────────────────────────────
  async function chat(userMsg, tokenContext) {
    const steps = [];

    // Notify background of AI activity
    if (typeof Bg3D !== 'undefined') Bg3D.setTheme('ai');

    steps.push(`🔍 Parsing: "<em>${esc(userMsg.slice(0, 55))}</em>"`);
    showReasoning(steps);

    // DDG search runs in parallel with LLM warm-up
    steps.push('📡 Searching DuckDuckGo…');
    showReasoning(steps);

    const ddgData = await ddgSearch(userMsg);
    const facts   = extractFacts(ddgData);

    steps.push(facts.length > 0
      ? `✅ Found ${facts.length} result(s) from DuckDuckGo`
      : '⚠️ No direct DDG results — using AI knowledge');
    if (tokenContext) {
      steps.push(`🎙️ Context: "<em>${esc(tokenContext.title.slice(0, 45))}…</em>"`);
    }
    showReasoning(steps);

    // ── Tier 1: server LLM ─────────────────────────────────────────────────
    steps.push('🧠 Asking AI…');
    showReasoning(steps);

    let html, source;
    const llmReply = await callServerLLM(userMsg, facts, tokenContext);

    if (llmReply) {
      const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(userMsg)}`;
      html   = '😎 ' + esc(llmReply)
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
      html  += `<br><br><a href="${ddgUrl}" target="_blank" rel="noopener noreferrer">🦆 More on DuckDuckGo ↗</a>`;
      source = 'llm';
      steps.push('✅ Full AI response ready');
    } else {
      // ── Tier 2: Chrome built-in AI ─────────────────────────────────────
      if (!aiSession) aiSession = await tryBuiltInAI();

      if (aiSession) {
        steps.push('🧠 Gemma AI synthesising…');
        showReasoning(steps);
        try {
          const searchCtx = facts.length
            ? `\n\nDuckDuckGo results:\n${facts.map(f => `- [${f.src}] ${f.text.slice(0, 200)}`).join('\n')}`
            : '';
          const tokCtx = tokenContext
            ? `\n\nCurrent token: "${tokenContext.title}" | keywords: ${(tokenContext.keywords || tokenContext.fieldTags || []).join(', ')}`
            : '';
          const prompt = `User: ${userMsg}${searchCtx}${tokCtx}\n\nAnswer naturally, cite sources.`;
          const raw    = await aiSession.prompt(prompt);
          const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(userMsg)}`;
          html   = `😎 ${esc(raw)}\n\n<a href="${ddgUrl}" target="_blank" rel="noopener noreferrer">🦆 More on DuckDuckGo ↗</a>`;
          source = 'gemma';
          steps.push('✅ Gemma response ready');
        } catch (e) {
          console.warn('[∞ Chat] Gemma error, falling back:', e.message);
          aiSession = null;
          html      = buildResponse(userMsg, facts, tokenContext);
          source    = 'reasoning';
          steps.push('✅ Response ready');
        }
      } else {
        // ── Tier 3: DDG + reasoning chain ─────────────────────────────────
        steps.push('⚙️ Building reasoned response…');
        showReasoning(steps);
        html   = buildResponse(userMsg, facts, tokenContext);
        source = 'reasoning';
        steps.push('✅ Response ready');
      }
    }

    showReasoning(steps);
    setTimeout(hideReasoning, 2500);

    // Reset background theme
    if (typeof Bg3D !== 'undefined') Bg3D.setTheme('default');

    updateBadge(source);
    return { html, steps, source };
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    // Warm up Chrome built-in AI in background (non-blocking)
    if (window.ai?.languageModel) {
      tryBuiltInAI().then(s => { if (s) aiSession = s; });
    }
  }

  return { chat, init };
})();
