/* marketplace.js — ∞ Infinity Token Marketplace
   Users list items and buy them exclusively with earned tokens.
   Tokens cannot be purchased — only earned (1/hour) or minted by spinning. */

const Marketplace = (() => {
  'use strict';

  const KEY  = 'infinityMarket';
  // NOTE: USER is hardcoded for this client-side prototype. Move to server-side
  // session auth before exposing a shared multi-user backend.
  const USER = 'Kris';

  // ── Demo seed listings ─────────────────────────────────────────────────────
  const SEED = [
    {
      id: 'seed-1', seller: 'CoinVault',
      title: '1921 Morgan Silver Dollar',
      description: 'Original mint luster, MS-63 grade. One of the most iconic US silver dollars — 90% silver, Peace design reverse.',
      category: 'coin', icon: '🪙', price: 15,
      ts: Date.now() - 172_800_000, sold: false, buyer: null,
    },
    {
      id: 'seed-2', seller: 'AncientTreasures',
      title: 'Roman Denarius — Emperor Hadrian',
      description: 'Silver denarius circa 117–138 AD. Well-preserved portrait of Emperor Hadrian obverse, Felicitas reverse.',
      category: 'coin', icon: '🏛️', price: 50,
      ts: Date.now() - 432_000_000, sold: false, buyer: null,
    },
    {
      id: 'seed-3', seller: 'RadioRarities',
      title: 'First Edition Radio Token #001',
      description: 'Commemorative digital collectible from the very first Radio Crusher spin. Provably rare — only 1 exists.',
      category: 'digital', icon: '📻', price: 30,
      ts: Date.now() - 86_400_000, sold: false, buyer: null,
    },
    {
      id: 'seed-4', seller: 'GoldRush',
      title: '2023 1oz Gold Buffalo Coin',
      description: 'BU condition, 24-karat gold. James Earle Fraser\'s iconic Native American / Buffalo design. Mint sealed.',
      category: 'coin', icon: '🥇', price: 100,
      ts: Date.now() - 259_200_000, sold: false, buyer: null,
    },
    {
      id: 'seed-5', seller: 'WaveHunter',
      title: 'Vintage Grundig Satellite 700 Radio',
      description: 'Classic SW/AM/FM portable radio receiver, excellent cosmetic condition. Picks up shortwave from 150 kHz–30 MHz.',
      category: 'collectible', icon: '📡', price: 25,
      ts: Date.now() - 345_600_000, sold: false, buyer: null,
    },
    {
      id: 'seed-6', seller: 'CryptoRarities',
      title: 'Signed Jazz Channel NFT — Session #7',
      description: 'Unique digital token minted during a 🎷 Jazz channel spin. Includes DOI-linked research token metadata.',
      category: 'digital', icon: '🎷', price: 20,
      ts: Date.now() - 518_400_000, sold: false, buyer: null,
    },
  ];

  // ── State helpers ──────────────────────────────────────────────────────────
  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (!stored.seeded) {
        stored.listings  = SEED.slice();
        stored.purchases = [];
        stored.seeded    = true;
        localStorage.setItem(KEY, JSON.stringify(stored));
      }
      return Object.assign({ listings: [], purchases: [], seeded: true }, stored);
    } catch {
      return { listings: SEED.slice(), purchases: [], seeded: true };
    }
  }

  function save(m) {
    try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (_) {}
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  function addListing(data) {
    const m       = load();
    const listing = {
      id          : `lst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      seller      : USER,
      title       : data.title.trim().slice(0, 100),
      description : data.description.trim().slice(0, 300),
      category    : data.category || 'other',
      icon        : data.icon || '📦',
      price       : Math.max(1, Math.floor(Number(data.price))),
      ts          : Date.now(),
      sold        : false,
      buyer       : null,
    };
    m.listings.unshift(listing);
    save(m);
    return listing;
  }

  function buyListing(id) {
    const m       = load();
    const listing = m.listings.find(l => l.id === id);
    if (!listing)          return { ok: false, reason: 'Listing not found.' };
    if (listing.sold)      return { ok: false, reason: 'This item has already been sold.' };
    if (listing.seller === USER) return { ok: false, reason: 'You cannot buy your own listing.' };

    const ok = Wallet.spend(listing.price);
    if (!ok) return { ok: false, reason: `You need ${listing.price} tokens but don't have enough. Earn more by spinning!` };

    listing.sold  = true;
    listing.buyer = USER;
    m.purchases.push({ listingId: id, ts: Date.now(), price: listing.price, title: listing.title });
    save(m);
    return { ok: true, listing };
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const CAT_ICONS  = { coin: '🪙', collectible: '🏺', digital: '💾', other: '📦' };
  const CAT_LABELS = { coin: 'Coin', collectible: 'Collectible', digital: 'Digital', other: 'Other' };

  function currentFilter() {
    const el = document.querySelector('.market-filter-btn.active');
    return el ? el.dataset.filter : 'all';
  }

  function renderBalance() {
    const w  = Wallet.load();
    const el = $('market-balance');
    if (el) el.textContent = w.spendable;
  }

  function renderListings(filter) {
    filter = filter || currentFilter();
    const m       = load();
    const listEl  = $('market-listings');
    if (!listEl) return;

    let items = m.listings;
    if (filter === 'mine')      items = items.filter(l => l.seller === USER);
    else if (filter === 'available') items = items.filter(l => !l.sold);
    else if (filter === 'sold') items = items.filter(l => l.sold);

    if (items.length === 0) {
      listEl.innerHTML = '<div class="market-empty">No listings found. Be the first to list an item!</div>';
      return;
    }

    const w = Wallet.load();
    listEl.innerHTML = items.map(l => {
      const isMine    = l.seller === USER;
      const canAfford = w.spendable >= l.price;
      const date      = new Date(l.ts).toLocaleDateString();
      let actionHtml;
      if (l.sold) {
        actionHtml = `<div class="market-sold-badge">SOLD</div>`;
      } else if (isMine) {
        actionHtml = `<div class="market-own-badge">Your listing</div>`;
      } else if (canAfford) {
        actionHtml = `<button class="market-buy-btn" data-id="${esc(l.id)}">⚡ Buy</button>`;
      } else {
        actionHtml = `<button class="market-buy-btn market-buy-disabled" disabled title="Need ${l.price} tokens">🔒 ${l.price}⬛</button>`;
      }
      return `
        <div class="market-card${l.sold ? ' market-card-sold' : ''}">
          <div class="market-card-icon">${l.icon}</div>
          <div class="market-card-body">
            <div class="market-card-title">${esc(l.title)}</div>
            <div class="market-card-desc">${esc(l.description)}</div>
            <div class="market-card-meta">
              <span class="market-tag market-tag-${esc(l.category)}">${CAT_LABELS[l.category] || 'Other'}</span>
              <span class="market-seller">by <strong>${esc(l.seller)}</strong></span>
              <span class="market-date">${date}</span>
            </div>
          </div>
          <div class="market-card-side">
            <div class="market-price">
              <span class="market-price-val">${l.price}</span>
              <span class="market-price-unit">tokens</span>
            </div>
            ${actionHtml}
          </div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.market-buy-btn:not(.market-buy-disabled)').forEach(btn => {
      btn.addEventListener('click', () => handleBuy(btn.dataset.id));
    });
  }

  function handleBuy(id) {
    const result = buyListing(id);
    const msgEl  = $('market-msg');
    if (!msgEl) return;
    if (result.ok) {
      msgEl.textContent = `✅ Purchased "${result.listing.title}" for ${result.listing.price} tokens!`;
      msgEl.className   = 'market-msg market-msg-ok';
      Wallet.renderWallet();
      renderBalance();
      renderListings();
    } else {
      msgEl.textContent = `❌ ${result.reason}`;
      msgEl.className   = 'market-msg market-msg-fail';
    }
    setTimeout(() => { msgEl.textContent = ''; msgEl.className = 'market-msg'; }, 5000);
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function initMarket() {
    renderBalance();
    renderListings('all');

    // Filter buttons
    document.querySelectorAll('.market-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.market-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderListings(btn.dataset.filter);
      });
    });

    // Icon preview updates with category
    const catSel  = $('list-category');
    const iconPrv = $('list-icon-preview');
    if (catSel && iconPrv) {
      catSel.addEventListener('change', () => {
        iconPrv.textContent = CAT_ICONS[catSel.value] || '📦';
      });
    }

    // Listing form
    const form = $('list-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const title = ($('list-title')?.value || '').trim();
        const desc  = ($('list-desc')?.value  || '').trim();
        const price = parseInt($('list-price')?.value || '0', 10);
        const cat   = $('list-category')?.value || 'other';
        const msgEl = $('market-msg');

        if (!title || price < 1) {
          if (msgEl) { msgEl.textContent = '❌ Title and a valid token price (≥1) are required.'; msgEl.className = 'market-msg market-msg-fail'; }
          setTimeout(() => { if (msgEl) { msgEl.textContent = ''; msgEl.className = 'market-msg'; } }, 3000);
          return;
        }
        addListing({ title, description: desc, price, category: cat, icon: CAT_ICONS[cat] || '📦' });
        form.reset();
        if (iconPrv) iconPrv.textContent = '🪙';
        if (msgEl) { msgEl.textContent = `✅ "${title}" listed for ${price} tokens!`; msgEl.className = 'market-msg market-msg-ok'; }
        setTimeout(() => { if (msgEl) { msgEl.textContent = ''; msgEl.className = 'market-msg'; } }, 3000);
        renderListings(currentFilter());

        // Collapse form
        const wrap   = $('list-form-wrap');
        const toggle = $('market-list-toggle');
        if (wrap)   wrap.style.display   = 'none';
        if (toggle) toggle.textContent   = '➕ List an Item';
      });
    }

    // Toggle listing form
    const toggleBtn = $('market-list-toggle');
    const formWrap  = $('list-form-wrap');
    if (toggleBtn && formWrap) {
      toggleBtn.addEventListener('click', () => {
        const open = formWrap.style.display !== 'none';
        formWrap.style.display = open ? 'none' : 'block';
        toggleBtn.textContent  = open ? '➕ List an Item' : '✕ Cancel';
      });
    }
  }

  return { load, save, addListing, buyListing, renderListings, renderBalance, initMarket };
})();
