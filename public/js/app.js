/* app.js — ∞ Infinity Radio Crusher main application logic */
(function () {
  'use strict';

  // ── Radio channel definitions ──────────────────────────────────────────────
  // Each channel has an icon (shown on the reel), a short name, genre description,
  // and links to real live-streaming radio pages.
  const RADIO_CHANNELS = [
    {
      icon: '🎷', name: 'Jazz',
      genre: 'Jazz · Bebop · Big Band',
      desc: 'Smooth jazz, bebop classics, and live big band sessions from around the world.',
      streamUrl: 'https://ice1.somafm.com/7soul-128-mp3',
      links: [
        { label: 'Jazz24 Live', url: 'https://jazz24.org/' },
        { label: 'TuneIn Jazz', url: 'https://tunein.com/radio/Jazz-r15923/' },
        { label: 'SomaFM Jazz', url: 'https://somafm.com/7soul/' },
      ],
    },
    {
      icon: '🎨', name: 'Masterpiece',
      genre: 'Classical · Orchestral',
      desc: 'Full orchestral works, chamber music, and opera from the world\'s great concert halls.',
      streamUrl: 'https://ice1.somafm.com/thistle-128-mp3',
      links: [
        { label: 'Classical Radio', url: 'https://www.classicalradio.com/' },
        { label: 'Radio Paradise Mellow', url: 'https://radioparadise.com/radio/mellow-mix' },
        { label: 'BBC Radio 3', url: 'https://www.bbc.co.uk/sounds/play/live:bbc_radio_three' },
      ],
    },
    {
      icon: '🍄', name: 'Police Scanner',
      genre: 'Scanner · Emergency Services',
      desc: 'Live police, fire, EMS, and aviation scanner feeds from cities worldwide.',
      links: [
        { label: 'Broadcastify Live', url: 'https://www.broadcastify.com/listen/' },
        { label: 'Scanner Radio', url: 'https://scannerradio.app/' },
        { label: 'RadioReference', url: 'https://www.radioreference.com/apps/audio/' },
      ],
    },
    {
      icon: '😎', name: 'Cool',
      genre: 'Chill · Groove · Lo-Fi',
      desc: 'Laid-back grooves, lo-fi hip-hop, and chilled electronic beats for focused minds.',
      streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
      links: [
        { label: 'SomaFM Groove Salad', url: 'https://somafm.com/groovesalad/' },
        { label: 'Lofi.cafe', url: 'https://lofi.cafe/' },
        { label: 'ChillHop Radio', url: 'https://chillhop.com/listen/' },
      ],
    },
    {
      icon: '🛸', name: 'Alien',
      genre: 'Space · Ambient · Experimental',
      desc: 'Deep space ambient, experimental electronic, and transmissions from beyond the ionosphere.',
      streamUrl: 'https://ice1.somafm.com/spacestation-128-mp3',
      links: [
        { label: 'SomaFM Space Station', url: 'https://somafm.com/spacestation/' },
        { label: 'SomaFM Drone Zone', url: 'https://somafm.com/dronezone/' },
        { label: 'TuneIn Space Music', url: 'https://tunein.com/radio/Space-Music-r16893/' },
      ],
    },
    {
      icon: '👌', name: 'Top Notch',
      genre: 'Premium · Adult Contemporary',
      desc: 'The finest curated adult contemporary and AAA music — handpicked quality.',
      streamUrl: 'https://stream.radioparadise.com/mp3-128',
      links: [
        { label: 'Radio Paradise', url: 'https://radioparadise.com/' },
        { label: 'BBC Radio 2', url: 'https://www.bbc.co.uk/sounds/play/live:bbc_radio_two' },
        { label: 'KCRW Music', url: 'https://www.kcrw.com/music' },
      ],
    },
    {
      icon: '⭐', name: 'Trendy',
      genre: 'Pop · Top 40 · Hot Hits',
      desc: 'Today\'s chart-toppers, trending tracks, and the freshest pop hits.',
      streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
      links: [
        { label: 'BBC Radio 1', url: 'https://www.bbc.co.uk/sounds/play/live:bbc_radio_one' },
        { label: 'iHeart Top 40', url: 'https://www.iheart.com/live/iheartradio-top-40-7556/' },
        { label: 'TuneIn Pop', url: 'https://tunein.com/radio/Pop-r15724/' },
      ],
    },
    {
      icon: '💃', name: 'Dance',
      genre: 'Dance · EDM · House',
      desc: 'Non-stop dance floor energy — house, techno, trance, and EDM.',
      streamUrl: 'https://ice1.somafm.com/fluid-128-mp3',
      links: [
        { label: 'SomaFM Fluid', url: 'https://somafm.com/fluid/' },
        { label: 'Ibiza Global Radio', url: 'https://www.ibizaglobalradio.com/listen-live/' },
        { label: 'BBC Radio 1Xtra', url: 'https://www.bbc.co.uk/sounds/play/live:bbc_1xtra' },
      ],
    },
    {
      icon: '♥️', name: 'Love',
      genre: 'Romantic · R&B · Soul',
      desc: 'Timeless love songs, smooth R&B, and soul classics for every mood.',
      streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
      links: [
        { label: 'Heart Radio UK', url: 'https://www.heart.co.uk/listen/' },
        { label: 'SmoothFM', url: 'https://www.smoothfm.com.au/listen/' },
        { label: 'TuneIn R&B', url: 'https://tunein.com/radio/RandB-r15734/' },
      ],
    },
    {
      icon: '🧱', name: 'Military Comms',
      genre: 'Military · SIGINT · HF',
      desc: 'Encrypted military HF comms, number stations, and strategic communications.',
      links: [
        { label: 'Broadcastify Military', url: 'https://www.broadcastify.com/listen/ctid/1' },
        { label: 'Priyom Number Stations', url: 'https://priyom.org/' },
        { label: 'WebSDR HF', url: 'http://websdr.ewi.utwente.nl:8901/' },
      ],
    },
    {
      icon: '🟨', name: 'News',
      genre: 'News · Talk · Current Affairs',
      desc: 'World news, breaking stories, and in-depth analysis 24 hours a day.',
      links: [
        { label: 'BBC World Service', url: 'https://www.bbc.co.uk/sounds/play/live:bbc_world_service' },
        { label: 'NPR Live', url: 'https://www.npr.org/radio/' },
        { label: 'DW Radio', url: 'https://www.dw.com/en/live-radio/s-35808' },
      ],
    },
    {
      icon: '🟦', name: 'Ham Radio',
      genre: 'Ham · Amateur · SDR',
      desc: 'Global amateur radio operators, web-based SDR receivers, and ham nets.',
      links: [
        { label: 'WebSDR.org', url: 'https://www.websdr.org/' },
        { label: 'KiwiSDR Network', url: 'http://kiwisdr.com/public/' },
        { label: 'ARRL Live', url: 'https://www.arrl.org/audio-news' },
      ],
    },
    {
      icon: '🟥', name: 'Shortwave',
      genre: 'Shortwave · HF · International',
      desc: 'International broadcasters and exotic shortwave stations from every continent.',
      links: [
        { label: 'Short-Wave.info', url: 'https://www.short-wave.info/' },
        { label: 'GlobalTuners SDR', url: 'https://www.globaltuners.com/' },
        { label: 'EiBi Schedule', url: 'https://www.eibispace.de/' },
      ],
    },
    {
      icon: '🟪', name: 'FM',
      genre: 'FM · Broadcast · Local',
      desc: 'Local and national FM broadcast stations streaming live from around the globe.',
      links: [
        { label: 'TuneIn FM', url: 'https://tunein.com/radio/By-Format/FM-r97916/' },
        { label: 'Radio.net FM', url: 'https://www.radio.net/' },
        { label: 'OnlineRadioBox', url: 'https://onlineradiobox.com/' },
      ],
    },
    {
      icon: '🟩', name: 'AM',
      genre: 'AM · Talk · Nostalgia',
      desc: 'Classic AM talk radio, golden oldies, sports broadcasts, and night-time skip.',
      links: [
        { label: 'TuneIn AM', url: 'https://tunein.com/radio/By-Format/AM-r97951/' },
        { label: 'Live365 AM', url: 'https://live365.com/radio-stations/am' },
        { label: 'Radio.net AM', url: 'https://www.radio.net/' },
      ],
    },
    {
      icon: '⬜', name: 'Digital Live',
      genre: 'DAB · Digital · HD Radio',
      desc: 'Crystal-clear digital broadcasts — DAB, HD Radio, and internet-only digital stations.',
      links: [
        { label: 'DAB-Live.co.uk', url: 'https://www.dab-live.co.uk/' },
        { label: 'TuneIn Digital', url: 'https://tunein.com/radio/By-Format/HD-r98003/' },
        { label: 'RadioPlayer', url: 'https://www.radioplayer.co.uk/' },
      ],
    },
  ];

  // ── Status messages ────────────────────────────────────────────────────────
  const LOCK_STATUSES = [
    'SIGNAL LOCKED — STRONG CARRIER DETECTED',
    'INFINITY RADIO ONLINE — TUNING COMPLETE ∞',
    'FREQUENCY ACQUIRED — RESEARCH TOKEN MINTED',
    'CHANNEL LOCKED — COMMIT TO REPO IN PROGRESS',
  ];
  const SCAN_STATUSES = [
    'SCANNING FREQUENCIES — NO CARRIER',
    'SQUELCH OPEN — STATIC ON THE LINE',
    'SEARCHING FOR SIGNAL — KEEP SPINNING',
    'INTERFERENCE DETECTED — TRY AGAIN',
  ];

  // ── State management ───────────────────────────────────────────────────────
  const STATE_KEY     = 'infinitySlotState';
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
    // Header / nav
    menuBtn:        $('menu-btn'),
    sidebar:        $('sidebar'),
    sidebarOverlay: $('sidebar-overlay'),
    sidebarClose:   $('sidebar-close'),
    // Crusher
    spinBtn:        $('spin-btn'),
    spinCount:      $('spin-count'),
    scoreDisplay:   $('score-display'),
    slotStatus:     $('slot-status'),
    winIndicator:   $('win-indicator'),
    reel0:          $('reel-0'),
    reel1:          $('reel-1'),
    reel2:          $('reel-2'),
    reelLabel0:     $('reel-label-0'),
    reelLabel1:     $('reel-label-1'),
    reelLabel2:     $('reel-label-2'),
    // Tuned card
    tunedCard:      $('tuned-card'),
    tunedIcon:      $('tuned-icon'),
    tunedName:      $('tuned-name'),
    tunedGenre:     $('tuned-genre'),
    tunedDesc:      $('tuned-desc'),
    tunedLinks:     $('tuned-links'),
    // Research token
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
    // Chat
    chatMessages:   $('chat-messages'),
    chatInput:      $('chat-input'),
    chatSend:       $('chat-send'),
    chatTyping:     $('chat-typing'),
    // Radio player
    radioPlayer:    $('radio-player'),
    radioAudio:     $('radio-audio'),
    radioPlayBtn:   $('radio-play-btn'),
    radioStopBtn:   $('radio-stop-btn'),
    radioStationName: $('radio-station-name'),
    radioStatus:    $('radio-status'),
  };

  // ── Hamburger menu ─────────────────────────────────────────────────────────
  function openMenu() {
    els.sidebar.classList.add('sidebar-open');
    els.sidebar.setAttribute('aria-hidden', 'false');
    els.sidebarOverlay.classList.add('sidebar-overlay-visible');
    els.sidebarOverlay.setAttribute('aria-hidden', 'false');
    els.menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    els.sidebar.classList.remove('sidebar-open');
    els.sidebar.setAttribute('aria-hidden', 'true');
    els.sidebarOverlay.classList.remove('sidebar-overlay-visible');
    els.sidebarOverlay.setAttribute('aria-hidden', 'true');
    els.menuBtn.setAttribute('aria-expanded', 'false');
  }
  els.menuBtn.addEventListener('click', openMenu);
  els.sidebarClose.addEventListener('click', closeMenu);
  els.sidebarOverlay.addEventListener('click', closeMenu);
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
  // Close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // ── Reel helpers ───────────────────────────────────────────────────────────
  function randChannel() {
    return RADIO_CHANNELS[Math.floor(Math.random() * RADIO_CHANNELS.length)];
  }

  function generateResult() {
    // ~50% chance of a matching pair (signal lock)
    if (Math.random() < 0.5) {
      const winCh  = randChannel();
      const others = [randChannel(), randChannel(), randChannel()];
      const idx    = Math.floor(Math.random() * 3);
      others[idx]              = winCh;
      others[(idx + 1) % 3]   = winCh;
      return { channels: others, won: true, primary: winCh };
    }
    // No match — all three different
    const pool = RADIO_CHANNELS.slice().sort(() => Math.random() - 0.5);
    const [a, b, c] = pool.slice(0, 3);
    return { channels: [a, b, c], won: false, primary: pool[1] };
  }

  function animateReel(reelEl, labelEl, finalCh, stopAfterMs) {
    return new Promise(resolve => {
      reelEl.classList.add('spinning');
      if (labelEl) labelEl.textContent = '';
      const iv = setInterval(() => {
        const ch = randChannel();
        reelEl.textContent = ch.icon;
      }, 80);
      setTimeout(() => {
        clearInterval(iv);
        reelEl.textContent    = finalCh.icon;
        if (labelEl) labelEl.textContent = finalCh.name;
        reelEl.classList.remove('spinning');
        resolve();
      }, stopAfterMs);
    });
  }

  // ── Show "Now Tuned To" card ───────────────────────────────────────────────
  function showTunedCard(channel, won) {
    els.tunedCard.style.display = 'block';
    els.tunedCard.className     = `tuned-card ${won ? 'tuned-card-lock' : 'tuned-card-scan'}`;
    els.tunedIcon.textContent   = channel.icon;
    els.tunedName.textContent   = channel.name;
    els.tunedGenre.textContent  = channel.genre;
    els.tunedDesc.textContent   = channel.desc;
    els.tunedLinks.innerHTML    = channel.links
      .map(l => `<a class="tuned-link" href="${l.url}" target="_blank" rel="noopener noreferrer">🔗 ${l.label} ↗</a>`)
      .join('');
    // Start radio stream if available
    if (channel.streamUrl) {
      tuneRadio(channel);
    } else {
      stopRadio();
    }
  }

  // ── Radio audio player ─────────────────────────────────────────────────────
  let currentStreamUrl = null;

  function tuneRadio(channel) {
    if (!els.radioAudio || !els.radioPlayer) return;
    if (currentStreamUrl === channel.streamUrl && !els.radioAudio.paused) return;
    currentStreamUrl = channel.streamUrl;
    els.radioAudio.pause();
    els.radioAudio.src = channel.streamUrl;
    els.radioPlayer.style.display = 'flex';
    if (els.radioStationName) els.radioStationName.textContent = `${channel.icon} ${channel.name}`;
    if (els.radioStatus) els.radioStatus.textContent = 'Connecting…';
    els.radioAudio.load();
    els.radioAudio.play().then(() => {
      if (els.radioStatus) els.radioStatus.textContent = '▶ Live';
      if (els.radioPlayBtn) els.radioPlayBtn.textContent = '⏸';
    }).catch(err => {
      console.warn('[∞ Radio] Autoplay blocked, click ▶ to start:', err.message);
      if (els.radioStatus) els.radioStatus.textContent = 'Click ▶ to stream';
      if (els.radioPlayBtn) els.radioPlayBtn.textContent = '▶';
    });
  }

  function stopRadio() {
    if (!els.radioAudio) return;
    els.radioAudio.pause();
    els.radioAudio.src = '';
    currentStreamUrl = null;
    if (els.radioStatus) els.radioStatus.textContent = 'Stopped';
    if (els.radioPlayBtn) els.radioPlayBtn.textContent = '▶';
  }

  if (els.radioPlayBtn) {
    els.radioPlayBtn.addEventListener('click', () => {
      if (!els.radioAudio) return;
      if (els.radioAudio.paused) {
        els.radioAudio.play().then(() => {
          if (els.radioStatus) els.radioStatus.textContent = '▶ Live';
          els.radioPlayBtn.textContent = '⏸';
        }).catch(err => {
          console.warn('[∞ Radio] Play failed:', err.message);
        });
      } else {
        els.radioAudio.pause();
        if (els.radioStatus) els.radioStatus.textContent = 'Paused';
        els.radioPlayBtn.textContent = '▶';
      }
    });
  }

  if (els.radioStopBtn) {
    els.radioStopBtn.addEventListener('click', stopRadio);
  }

  // ── Research token display ─────────────────────────────────────────────────
  function displayToken(tok) {
    if (!tok) return;
    els.tokenIf.textContent = `IF: ${tok.impactFactor} · ${tok.fieldTags.join(', ')}`;
    if (tok.radioChannel) {
      els.tokenIf.textContent = `📻 ${tok.radioChannel} · IF: ${tok.impactFactor}`;
    }
    els.tokenTitle.textContent   = tok.title;
    els.tokenAuthors.textContent = '👥 ' + tok.authors.join(', ');
    els.tokenJournal.textContent = `📰 ${tok.journal} (${tok.year})`;
    els.tokenDoi.textContent     = `DOI: ${tok.doi}`;

    els.tokenKeywords.innerHTML = '';
    tok.keywords.forEach(kw => {
      const span = document.createElement('span');
      span.className   = 'keyword-tag';
      span.textContent = kw;
      els.tokenKeywords.appendChild(span);
    });

    els.tokenAbstract.textContent = tok.abstract;
    els.searchBadge.style.display = tok.searchEnriched ? 'inline-block' : 'none';
    els.articleMeta.textContent   =
      `Spin #${tok.spin} · Score: ${tok.spinScore} · ${tok.authors.join(', ')}`;
    els.fullAbstract.textContent  = tok.abstract;
    els.secIntro.textContent      = tok.sections.introduction;
    els.secMethods.textContent    = tok.sections.methods;
    els.secResults.textContent    = tok.sections.results;
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

  // ── Commit token to repo ───────────────────────────────────────────────────
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
    } catch (_) { /* silent fail — server may not be configured */ }
  }

  // ── Main spin handler ──────────────────────────────────────────────────────
  let spinning = false;
  async function doSpin() {
    if (spinning) return;
    spinning = true;
    els.spinBtn.disabled = true;
    els.winIndicator.textContent = '';
    els.winIndicator.className   = 'win-indicator';

    const state    = loadState();
    state.spins   += 1;
    const result   = generateResult();
    const reelEls  = [els.reel0, els.reel1, els.reel2];
    const labelEls = [els.reelLabel0, els.reelLabel1, els.reelLabel2];

    // Animate reels (staggered stop)
    await Promise.all([
      animateReel(reelEls[0], labelEls[0], result.channels[0], 900),
      animateReel(reelEls[1], labelEls[1], result.channels[1], 1200),
      animateReel(reelEls[2], labelEls[2], result.channels[2], 1500),
    ]);

    // Highlight winning reels
    if (result.won) {
      reelEls.forEach((el, i) => {
        if (result.channels[i].icon === result.primary.icon) el.classList.add('reel-win');
      });
    }

    // Generate research token (tag with radio channel)
    const tok         = TokenGenerator.generate(state.spins);
    tok.radioChannel  = result.primary.name;
    tok.radioIcon     = result.primary.icon;
    if (!result.won) tok.spinScore = 0;
    tok.won = result.won;

    state.score += tok.spinScore;
    state.token  = tok;
    saveState(state);

    // Update counters
    els.spinCount.textContent   = state.spins;
    els.scoreDisplay.textContent = state.score;

    // Status + win indicator
    if (result.won) {
      els.slotStatus.textContent       = pick(LOCK_STATUSES);
      els.winIndicator.textContent     = `🔒 SIGNAL LOCK — ${result.primary.icon} ${result.primary.name}`;
      els.winIndicator.className       = 'win-indicator win';
      // Pulse 3D background on win
      if (typeof Bg3D !== 'undefined') Bg3D.setTheme('win');
    } else {
      els.slotStatus.textContent       = pick(SCAN_STATUSES);
      els.winIndicator.textContent     = `📡 Scanning… no lock. Spin again.`;
      els.winIndicator.className       = 'win-indicator loss';
      // Brief pulse on scan too
      if (typeof Bg3D !== 'undefined') Bg3D.pulse();
    }

    // Show tuned card + research token
    showTunedCard(result.primary, result.won);
    displayToken(tok);

    // Wallet + marketplace
    if (typeof Wallet !== 'undefined') {
      Wallet.addMintedToken(tok);
      Wallet.renderWallet();
    }
    if (typeof Marketplace !== 'undefined') {
      Marketplace.renderBalance();
    }

    // Commit to repo (fire & forget)
    commitToken(tok);

    // Auto-research: pipe token title into AI chat (non-blocking)
    autoResearch(tok, result.primary);

    spinning = false;
    els.spinBtn.disabled = false;
  }

  // ── Auto-research on spin ──────────────────────────────────────────────────
  async function autoResearch(tok, channel) {
    if (typeof InfinityChat === 'undefined') return;
    const query = `${tok.title} — ${(tok.keywords || []).slice(0, 3).join(', ')}`;
    appendChatMsg(
      `📻 Tuned to <strong>${channel.icon} ${channel.name}</strong> · researching: <em>${esc(tok.title.slice(0, 80))}</em>…`,
      'ai-msg auto-research-msg'
    );
    if (els.chatTyping) els.chatTyping.style.display = 'flex';
    const state = loadState();
    const result2 = await InfinityChat.chat(query, state.token);
    if (els.chatTyping) els.chatTyping.style.display = 'none';
    appendChatMsg(result2.html, 'ai-msg');
    // Scroll chat into view
    if (els.chatMessages) els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Article toggle ─────────────────────────────────────────────────────────
  let articleOpen = false;
  els.articleToggle.addEventListener('click', () => {
    articleOpen = !articleOpen;
    els.fullArticle.style.display  = articleOpen ? 'block' : 'none';
    els.articleToggle.textContent  = articleOpen ? '📄 Hide Article' : '📄 Full Article';
  });

  // ── AI Chat ────────────────────────────────────────────────────────────────
  function appendChatMsg(html, cls) {
    const div       = document.createElement('div');
    div.className   = `chat-msg ${cls}`;
    div.innerHTML   = html;
    els.chatMessages.appendChild(div);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  }

  async function sendChat() {
    const msg = els.chatInput.value.trim();
    if (!msg) return;
    appendChatMsg(msg, 'user-msg');
    els.chatInput.value     = '';
    els.chatSend.disabled   = true;

    // Show typing indicator while waiting
    if (els.chatTyping) {
      els.chatTyping.style.display = 'flex';
      els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    }

    if (typeof InfinityChat !== 'undefined') {
      const state = loadState();
      const result = await InfinityChat.chat(msg, state.token);
      if (els.chatTyping) els.chatTyping.style.display = 'none';
      appendChatMsg(result.html, 'ai-msg');
    } else {
      if (els.chatTyping) els.chatTyping.style.display = 'none';
      // Fallback if chat.js not loaded
      const ddg = `https://duckduckgo.com/?q=${encodeURIComponent(msg)}`;
      appendChatMsg(`😎 <a href="${ddg}" target="_blank" rel="noopener noreferrer">Search DuckDuckGo ↗</a>`, 'ai-msg');
    }
    els.chatSend.disabled = false;
  }

  els.chatSend.addEventListener('click', sendChat);
  els.chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  // ── Spin button ────────────────────────────────────────────────────────────
  els.spinBtn.addEventListener('click', doSpin);

  // ── Init ───────────────────────────────────────────────────────────────────
  (function init() {
    const state = loadState();
    els.spinCount.textContent    = state.spins;
    els.scoreDisplay.textContent = state.score;
    if (state.token) displayToken(state.token);

    if (typeof Wallet      !== 'undefined') Wallet.initWallet();
    if (typeof Marketplace !== 'undefined') Marketplace.initMarket();
    if (typeof InfinityChat !== 'undefined') InfinityChat.init();
  })();
})();
