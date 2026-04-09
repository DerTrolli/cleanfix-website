/* ═══════════════════════════════════════════════════════════════
   CLEANFIX V2 – MAIN SCRIPT
   ═══════════════════════════════════════════════════════════════ */

// ── Dark mode toggle ──────────────────────────────────────────────
(function () {
  const html        = document.documentElement;
  const toggleBtn   = document.getElementById('dark-toggle');
  const STORAGE_KEY = 'cleanfix-theme';

  // Apply saved preference immediately (before paint)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark') {
    html.setAttribute('data-theme', 'dark');
  }

  function updateIcon() {
    if (!toggleBtn) return;
    const isDark = html.getAttribute('data-theme') === 'dark';
    toggleBtn.textContent  = isDark ? '☀️' : '🌙';
    toggleBtn.setAttribute('aria-label', isDark ? 'Hellmodus umschalten' : 'Dunkelmodus umschalten');
    toggleBtn.title = isDark ? 'Hellmodus' : 'Dunkelmodus';
  }

  updateIcon(); // Set correct icon on load

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem(STORAGE_KEY, 'light');
      } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem(STORAGE_KEY, 'dark');
      }
      updateIcon();
    });
  }
})();

// ── Year ──────────────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Shared HTML-escape helper ─────────────────────────────────────
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Unified schedule reader ────────────────────────────────────────
// Reads cleanfix-schedule (new system) and applies active entries to the page.
// Falls back to legacy individual keys, then to Monatsangebot.txt for MA.
(function () {

  var SCHEDULE_KEY = 'cleanfix-schedule';
  var today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // MA hardcoded defaults — shown immediately so card is never empty
  var MA_DEFAULTS = {
    monat:   'Februar',
    titel:   '10 % auf unseren Hemdenservice',
    text:    'Im Februar sparen Sie 10 % auf den gesamten Hemdservice – das gilt auch für unsere Bonuskarten! Perfekt für alle, die regelmäßig auf einen frischen, perfekt gebügelten Auftritt setzen.',
    angebot: '10%',
    auf:     'Hemdenservice'
  };

  // ── helpers ──────────────────────────────────────────────────────
  function isActive(entry) {
    var s = entry.startDate || '';
    var e = entry.endDate   || '';
    if (!s && !e) return true;           // permanent
    var afterStart = !s || today >= s;
    var beforeEnd  = !e || today <= e;
    return afterStart && beforeEnd;
  }

  function lsJson(key) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  }

  // ── apply functions ───────────────────────────────────────────────
  function applyMA(d) {
    var el;
    el = document.getElementById('ma-monat');   if (el) el.textContent = d.monat   || '';
    el = document.getElementById('ma-titel');   if (el) el.textContent = d.titel   || '';
    el = document.getElementById('ma-text');    if (el) el.textContent = d.text    || '';
    el = document.getElementById('ma-angebot'); if (el) el.textContent = d.angebot ? '−' + d.angebot : '';
    el = document.getElementById('ma-auf');     if (el) el.textContent = d.auf     || '';
  }

  function applyBanner(d) {
    var iconEl = document.querySelector('.promo-icon');
    var textEl = document.getElementById('promo-text');
    if (iconEl && d.icon)  iconEl.textContent = d.icon;
    if (textEl) {
      var html = '';
      if (d.title) html += '<strong>' + escHtml(d.title) + '</strong>';
      if (d.title && d.desc) html += ' ';
      if (d.desc)  html += escHtml(d.desc);
      textEl.innerHTML = html;
    }
  }

  function applyDeals(dealDataArray) {
    var grid = document.getElementById('deals-grid');
    if (!grid) return;
    grid.innerHTML = dealDataArray.map(function (d) {
      return '<div class="deal-card' + (d.highlight ? ' deal-card--highlight' : '') + '">' +
        (d.badge ? '<div class="deal-badge">' + escHtml(d.badge) + '</div>' : '') +
        '<div class="deal-icon" aria-hidden="true">' + escHtml(d.icon) + '</div>' +
        '<div class="deal-title">' + escHtml(d.title) + '</div>' +
        '<div class="deal-price">' + escHtml(d.price) +
          (d.priceUnit ? ' <span class="deal-price-unit">' + escHtml(d.priceUnit) + '</span>' : '') +
        '</div>' +
        '<div class="deal-desc">' + escHtml(d.desc) + '</div>' +
        '</div>';
    }).join('');
  }

  // ── Show MA defaults immediately (card never empty) ───────────────
  applyMA(MA_DEFAULTS);

  // ── Load schedule ─────────────────────────────────────────────────
  var schedule = lsJson(SCHEDULE_KEY);
  var hasSchedule = Array.isArray(schedule) && schedule.length > 0;

  // ─ Monatsangebot ─────────────────────────────────────────────────
  var maApplied = false;
  if (hasSchedule) {
    // Active MA entries, prefer dated ones (more specific) over permanent ones
    var maActive = schedule.filter(function (e) { return e.type === 'monatsangebot' && isActive(e); });
    if (maActive.length) {
      // Sort: dated entries last (highest priority), permanent first
      maActive.sort(function (a, b) {
        var aHasDates = (a.startDate || a.endDate) ? 1 : 0;
        var bHasDates = (b.startDate || b.endDate) ? 1 : 0;
        return aHasDates - bHasDates;
      });
      applyMA(maActive[maActive.length - 1].data);
      maApplied = true;
    }
  }
  if (!maApplied) {
    // Fallback: legacy individual key
    var legacyMA = lsJson('cleanfix-monatsangebot');
    if (legacyMA) { applyMA(legacyMA); maApplied = true; }
  }
  if (!maApplied) {
    // Fallback: Monatsangebot.txt (HTTP only)
    fetch('Monatsangebot.txt')
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var d = {};
        text.split('\n').forEach(function (line) {
          var sep = line.indexOf(':');
          if (sep === -1) return;
          var k = line.slice(0, sep).trim().toLowerCase();
          var v = line.slice(sep + 1).trim();
          d[k] = v;
        });
        applyMA(d);
      })
      .catch(function () {});
  }

  // ─ Banner ─────────────────────────────────────────────────────────
  var bannerApplied = false;
  if (hasSchedule) {
    var bannerActive = schedule.filter(function (e) { return e.type === 'banner' && isActive(e); });
    if (bannerActive.length) {
      bannerActive.sort(function (a, b) {
        return ((a.startDate || a.endDate) ? 1 : 0) - ((b.startDate || b.endDate) ? 1 : 0);
      });
      applyBanner(bannerActive[bannerActive.length - 1].data);
      bannerApplied = true;
    }
  }
  if (!bannerApplied) {
    var legacyBanner = lsJson('cleanfix-banner');
    if (legacyBanner) {
      if (legacyBanner.title || legacyBanner.desc) {
        applyBanner(legacyBanner);
      } else if (legacyBanner.text) {
        // Very old format: raw HTML blob
        var textEl = document.getElementById('promo-text');
        if (textEl) textEl.innerHTML = legacyBanner.text;
      }
    }
  }

  // ─ Deals ─────────────────────────────────────────────────────────
  var dealsApplied = false;
  if (hasSchedule) {
    var dealsActive = schedule.filter(function (e) { return e.type === 'deal' && isActive(e); });
    if (dealsActive.length) {
      applyDeals(dealsActive.map(function (e) { return e.data; }));
      dealsApplied = true;
    }
  }
  if (!dealsApplied) {
    var legacyDeals = lsJson('cleanfix-deals');
    if (Array.isArray(legacyDeals) && legacyDeals.length) {
      applyDeals(legacyDeals);
    }
  }

})();

// Price tables
(function () {
  var tabs = [
    { key: 'cleanfix-preise-reinigung', tbodyId: 'tbody-reinigung', cols: 1 },
    { key: 'cleanfix-preise-buegeln',   tbodyId: 'tbody-buegeln',   cols: 1 },
    { key: 'cleanfix-preise-waesche',   tbodyId: 'tbody-waesche',   cols: 2 },
  ];
  tabs.forEach(function (tab) {
    try {
      var raw = localStorage.getItem(tab.key);
      if (!raw) return;
      var d = JSON.parse(raw);
      var tbody = document.getElementById(tab.tbodyId);
      if (!tbody || !d.groups) return;
      var html = '';
      var colSpan = tab.cols + 1;
      d.groups.forEach(function (g) {
        if (g.label) {
          html += '<tr class="price-group-header"><td colspan="' + colSpan + '">' + escHtml(g.label) + '</td></tr>';
        }
        (g.rows || []).forEach(function (r) {
          html += '<tr><td>' + escHtml(r.artikel) + '</td>' +
                  '<td class="price-val">' + escHtml(r.preis) + '</td>';
          if (tab.cols === 2) {
            html += '<td class="price-val">' + escHtml(r.preis2 || '—') + '</td>';
          }
          html += '</tr>';
        });
      });
      tbody.innerHTML = html;
    } catch (e) {}
  });
})();

// ── Sticky nav: shrink on scroll-down, grow on scroll-up ──────────
// Hysteresis: only commit a state change after 12px of consistent
// movement, so micro-oscillations on trackpads never trigger the toggle.
// Cooldown lock: after a toggle the header height transitions for 350ms;
// during that window we ignore scroll events so layout-induced scroll
// changes (browser scroll-anchoring, mobile URL bar collapse mid-transition)
// can't flip the state back and create an expand/contract loop.
const header = document.getElementById('site-header');
let anchorY = window.scrollY;
let lockedUntil = 0;
const LOCK_MS = 400;

window.addEventListener('scroll', () => {
  if (performance.now() < lockedUntil) {
    // Re-anchor so the next user scroll is measured from the post-transition position.
    anchorY = window.scrollY;
    return;
  }

  const currentY = window.scrollY;
  const delta = currentY - anchorY;

  if (delta > 12 && currentY > 80 && !header.classList.contains('scrolled')) {
    // Down 12px+ past the top zone → shrink header (desktop only, mobile header scrolls away)
    header.classList.add('scrolled');
    anchorY = currentY;
    lockedUntil = performance.now() + LOCK_MS;
  } else if (delta < -12 && header.classList.contains('scrolled')) {
    // Up 12px+ from anywhere → restore header
    header.classList.remove('scrolled');
    anchorY = currentY;
    lockedUntil = performance.now() + LOCK_MS;
  }
  // Within ±12px: ignore, no state change
}, { passive: true });

// ── Mobile nav burger ─────────────────────────────────────────────
const burger  = document.getElementById('nav-burger');
const navList = document.getElementById('nav-list');

burger.addEventListener('click', () => {
  const open = navList.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
});

// Close nav when a link is clicked
navList.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navList.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menü öffnen');
  });
});

// Close nav on outside click
document.addEventListener('click', (e) => {
  if (!header.contains(e.target)) {
    navList.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

// ── Price Tabs ────────────────────────────────────────────────────
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('aria-controls');

    tabBtns.forEach(b => {
      b.classList.remove('tab-btn--active');
      b.setAttribute('aria-selected', 'false');
    });
    tabPanels.forEach(p => {
      p.classList.remove('tab-panel--active');
      p.hidden = true;
    });

    btn.classList.add('tab-btn--active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(target);
    panel.classList.add('tab-panel--active');
    panel.hidden = false;
  });

  // Keyboard nav: left/right arrows between tabs
  btn.addEventListener('keydown', (e) => {
    const btns  = [...tabBtns];
    const index = btns.indexOf(btn);
    if (e.key === 'ArrowRight') { btns[(index + 1) % btns.length].focus(); btns[(index + 1) % btns.length].click(); }
    if (e.key === 'ArrowLeft')  { btns[(index - 1 + btns.length) % btns.length].focus(); btns[(index - 1 + btns.length) % btns.length].click(); }
  });
});

// ── Price Search ──────────────────────────────────────────────────
(function () {
  // Alias map: typed word → canonical search terms that should also match.
  // Keys are lowercase. Values are extra strings injected into the search index.
  const ALIASES = {
    'jeans':        ['hose'],
    'hose':         ['jeans', 'hosen', 'faltenrock'],
    'hosen':        ['hose'],
    'trousers':     ['hose'],
    'pants':        ['hose'],
    'hemd':         ['hemden', 'shirt', 'hemdbluse'],
    'hemden':       ['hemd'],
    'shirt':        ['hemd', 'hemdbluse', 't-shirt', 'polo'],
    'bluse':        ['hemdbluse', 'bluse'],
    'jacke':        ['jacken', 'mantel', 'blazer', 'arbeitsjacke', 'outdoor', 'daunen', 'klimatex', 'wellensteyn'],
    'jacken':       ['jacke'],
    'mantel':       ['jacke', 'mäntel', 'mantel'],
    'mäntel':       ['mantel'],
    'coat':         ['mantel', 'jacke'],
    'kleid':        ['brautkleid', 'kleid', 'abendkleid', 'dress'],
    'brautkleid':   ['kleid', 'hochzeitskleid'],
    'hochzeitskleid': ['brautkleid', 'kleid'],
    'anzug':        ['kostüm', 'sakko', 'blazer', 'weste'],
    'kostüm':       ['anzug'],
    'sakko':        ['blazer', 'anzug', 'jacke'],
    'blazer':       ['sakko', 'jacke'],
    'decke':        ['bettdecke', 'wolldecke', 'tagesdecke', 'daunen'],
    'bett':         ['bettbezug', 'bettdecke', 'bettwäsche'],
    'bettwäsche':   ['bett', 'bettbezug', 'kopfkissen'],
    'kissen':       ['kopfkissen', 'daunenkissen'],
    'tischdecke':   ['tafeltuch', 'mitteldecke'],
    'teppich':      ['deko'],
    'imprägnierung':['lotus'],
    'lotus':        ['imprägnierung'],
    'leder':        [],
    'pelz':         [],
    'bügeln':       ['finish', 'nur bügeln'],
    'finish':       ['bügeln', 'nur bügeln'],
    'rock':         ['faltenrock', 'rock'],
    'faltenrock':   ['rock'],
    'skirt':        ['rock', 'faltenrock'],
    'krawatte':     ['tie', 'schlips'],
    'tie':          ['krawatte'],
    'schlips':      ['krawatte'],
    'daunen':       ['klimatex', 'wellensteyn', 'daunenjacke', 'daunenweste', 'daunenmantel', 'daunenbett', 'daunenkissen'],
    'weste':        ['outdoor', 'anzug'],
    'pullover':     ['sweater', 'pulli'],
    'sweater':      ['pullover'],
    'overall':      ['arbeit'],
    'arbeit':       ['arbeitsjacke', 'overall', 'kittel'],
    'kittel':       ['arbeit', 'schürze'],
    'schürze':      ['kittel'],
    'bademantel':   ['bad'],
    'reinigung':    ['reinigen', 'cleaning'],
    'wäsche':       ['mangeln', 'waschen'],
    'mangeln':      ['wäsche', 'waschen'],
    'waschen':      ['wäsche', 'mangeln'],
    'hemdservice':  ['hemd', 'hemden', 'hemdenservice'],
    'hemdenservice':['hemd', 'hemden'],
  };

  // Build the search index from all price table rows
  function buildIndex() {
    const index = [];

    // Regular price tables (2-column and 3-column)
    document.querySelectorAll('.price-table').forEach(table => {
      const tabPanel = table.closest('.tab-panel');
      const tabId    = tabPanel ? tabPanel.id : '';
      const tabLabel = tabPanel ? (document.getElementById(tabId.replace('tab-', 'btn-')) || {}).textContent || '' : '';

      let currentGroup = '';

      table.querySelectorAll('tbody tr').forEach(row => {
        // Group header rows
        if (row.classList.contains('price-group-header')) {
          currentGroup = row.textContent.trim();
          return;
        }

        const cells = row.querySelectorAll('td');
        if (!cells.length) return;
        const artikel = cells[0].textContent.trim();
        if (!artikel) return;

        const prices = [];
        for (let i = 1; i < cells.length; i++) {
          const th = table.querySelectorAll('thead th')[i];
          const label = th ? th.textContent.trim() : '';
          const val   = cells[i].textContent.trim();
          if (val && val !== '—') prices.push({ label, val });
        }

        index.push({ artikel, prices, group: currentGroup, tab: tabLabel.replace('🔍 ', ''), tabId });
      });
    });

    // Bonus cards
    document.querySelectorAll('.bonus-card').forEach(card => {
      const label   = (card.querySelector('.bonus-label') || {}).textContent || '';
      const price   = (card.querySelector('.bonus-price') || {}).textContent || '';
      const perShirt= (card.querySelector('.bonus-per-shirt') || {}).textContent || '';
      const count   = (card.querySelector('.bonus-shirt-count') || {}).textContent || '';
      if (!label) return;
      index.push({
        artikel: label,
        prices: [{ label: count.trim(), val: price.trim() }, { label: 'pro Hemd', val: perShirt.trim() }],
        group: 'Bonuskarten',
        tab: 'Bonuskarten',
        tabId: 'tab-bonuskarten'
      });
    });

    return index;
  }

  // Expand a query string using the alias map
  function expandQuery(q) {
    const words = q.toLowerCase().trim().split(/\s+/);
    const terms = new Set(words);
    words.forEach(w => {
      if (ALIASES[w]) ALIASES[w].forEach(a => terms.add(a));
    });
    return [...terms];
  }

  // Score a single index entry against expanded terms
  function score(entry, terms) {
    const haystack = (entry.artikel + ' ' + entry.group + ' ' + entry.tab).toLowerCase();
    let s = 0;
    terms.forEach(t => {
      if (haystack.includes(t)) s += t.length; // longer matches score higher
    });
    return s;
  }

  // Highlight matched terms inside a string
  function highlight(text, terms) {
    let result = text;
    // sort by length desc so longer matches take precedence
    const sorted = [...terms].sort((a, b) => b.length - a.length);
    sorted.forEach(t => {
      if (!t) return;
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      result = result.replace(re, '<mark>$1</mark>');
    });
    return result;
  }

  function render(results, terms) {
    const container = document.getElementById('price-search-results');
    const hint      = document.getElementById('price-search-hint');
    if (!results.length) {
      container.innerHTML = '';
      hint.textContent = 'Kein passender Artikel gefunden. Versuchen Sie einen anderen Begriff.';
      return;
    }
    hint.textContent = results.length === 1
      ? '1 Ergebnis gefunden.'
      : results.length + ' Ergebnisse gefunden.';

    const rows = results.map(r => {
      const pricesCells = r.prices.map(p =>
        '<td class="price-val">' +
          (p.label ? '<span class="search-price-label">' + p.label + '</span>' : '') +
          p.val +
        '</td>'
      ).join('');
      const groupBadge = r.group
        ? '<span class="search-group-badge">' + r.group + '</span>'
        : '';
      const tabBadge = '<span class="search-tab-badge">' + r.tab + '</span>';
      return '<tr>' +
        '<td>' + highlight(r.artikel, terms) + '<br/><span class="search-badges">' + groupBadge + tabBadge + '</span></td>' +
        pricesCells +
        '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="price-table-wrapper">' +
        '<table class="price-table" aria-label="Suchergebnisse">' +
          '<thead><tr><th scope="col">Artikel</th><th scope="col">Preis</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  // Wire up input — index is built lazily on first search
  let index = null;
  const input = document.getElementById('price-search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    if (!index) index = buildIndex();
    const q = input.value.trim();
    if (q.length < 2) {
      document.getElementById('price-search-results').innerHTML = '';
      document.getElementById('price-search-hint').textContent =
        'Geben Sie einen Artikel ein, um alle passenden Preise zu finden.';
      return;
    }
    const terms   = expandQuery(q);
    const results = index
      .map(entry => ({ entry, s: score(entry, terms) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.entry);
    render(results, terms);
  });

  // When the search tab is opened, focus the input
  const searchTabBtn = document.getElementById('btn-suche');
  if (searchTabBtn) {
    searchTabBtn.addEventListener('click', () => {
      setTimeout(() => { if (input) input.focus(); }, 50);
    });
  }
})();

// ── Contact form (client-side validation demo) ────────────────────
const form        = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;

    const fields = [
      { id: 'name',    errorId: 'name-error',    msg: 'Bitte geben Sie Ihren Namen ein.' },
      { id: 'email',   errorId: 'email-error',   msg: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
      { id: 'message', errorId: 'message-error', msg: 'Bitte schreiben Sie eine Nachricht.' },
    ];

    fields.forEach(({ id, errorId, msg }) => {
      const input = document.getElementById(id);
      const error = document.getElementById(errorId);
      let fieldValid = true;

      if (!input.value.trim()) {
        fieldValid = false;
      } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        fieldValid = false;
      }

      if (!fieldValid) {
        input.classList.add('invalid');
        error.textContent = msg;
        valid = false;
      } else {
        input.classList.remove('invalid');
        error.textContent = '';
      }
    });

    if (valid) {
      // In production: replace this with a real fetch() POST to your backend / mailto service
      form.style.opacity = '0.5';
      form.style.pointerEvents = 'none';
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Live validation on blur
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
      if (input.classList.contains('invalid') && input.value.trim()) {
        input.classList.remove('invalid');
        const errorEl = document.getElementById(input.id + '-error');
        if (errorEl) errorEl.textContent = '';
      }
    });
  });
}

// ── Newsletter form ───────────────────────────────────────────────
const nlForm    = document.getElementById('newsletter-form');
const nlSuccess = document.getElementById('nl-success');

if (nlForm) {
  nlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('nl-email');
    const emailError = document.getElementById('nl-email-error');
    const val = emailInput.value.trim();
    const valid = val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    if (!valid) {
      emailInput.classList.add('invalid');
      emailError.textContent = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      return;
    }
    emailInput.classList.remove('invalid');
    emailError.textContent = '';
    // In production: POST to your mailing list provider here
    nlForm.style.opacity = '0.5';
    nlForm.style.pointerEvents = 'none';
    nlSuccess.hidden = false;
  });

  document.getElementById('nl-email').addEventListener('blur', function () {
    if (this.classList.contains('invalid') && this.value.trim()) {
      this.classList.remove('invalid');
      document.getElementById('nl-email-error').textContent = '';
    }
  });
}

// ── Intersection Observer: fade-in cards ─────────────────────────
const fadeTargets = document.querySelectorAll(
  '.service-card, .branch-card, .trust-item, .bonus-card'
);

if ('IntersectionObserver' in window) {
  fadeTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  fadeTargets.forEach(el => observer.observe(el));
}

// ── Next Gen Motion Mode ──────────────────────────────────────────
(function () {
  const MOTION_KEY  = 'cleanfix-motion';
  const html        = document.documentElement;
  const motionBtn   = document.getElementById('motion-toggle');
  const prefersLess = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Track active observers so we can disconnect them on toggle-off
  let activeObservers  = [];
  // Track cleanup functions (mouse/scroll listeners) for toggle-off
  let cleanupFunctions = [];

  // Apply saved state immediately (before paint)
  if (!prefersLess && localStorage.getItem(MOTION_KEY) === 'on') {
    html.setAttribute('data-motion', 'on');
  }

  function updateMotionBtn() {
    if (!motionBtn) return;
    const isOn = html.getAttribute('data-motion') === 'on';
    motionBtn.title = isOn ? 'Next-Gen aus' : 'Next-Gen-Animationen';
    motionBtn.setAttribute('aria-label', isOn
      ? 'Next-Gen-Modus deaktivieren'
      : 'Next-Gen-Modus aktivieren');
  }

  if (motionBtn) {
    updateMotionBtn();
    motionBtn.addEventListener('click', () => {
      if (prefersLess) return;
      const isOn = html.getAttribute('data-motion') === 'on';
      if (isOn) {
        // ── Turn OFF ─────────────────────────────────────────────
        html.removeAttribute('data-motion');
        localStorage.setItem(MOTION_KEY, 'off');

        // Disconnect all observers
        activeObservers.forEach(obs => obs.disconnect());
        activeObservers = [];

        // Run cleanup functions (remove event listeners)
        cleanupFunctions.forEach(fn => fn());
        cleanupFunctions = [];

        // Reset hero shapes to default position
        ['shape-1', 'shape-2', 'shape-3'].forEach(cls => {
          const el = document.querySelector('.' + cls);
          if (el) el.style.transform = '';
        });

        // Restore basic fade-in inline styles for cards
        fadeTargets.forEach(el => {
          el.classList.remove('ng-reveal-target', 'ng-visible');
          el.style.opacity       = '';
          el.style.transform     = '';
          el.style.transition    = 'opacity 0.5s ease, transform 0.5s ease';
          el.style.filter        = '';
          el.style.transitionDelay = '';
        });

        // Restore section headers
        document.querySelectorAll('.ng-title-target').forEach(el => {
          el.classList.remove('ng-title-target', 'ng-visible');
        });

        // Restore stat nums
        document.querySelectorAll('.stat-num').forEach(el => {
          el.classList.remove('ng-stat-pop');
          el.style.opacity = '';
        });

      } else {
        // ── Turn ON ──────────────────────────────────────────────
        localStorage.setItem(MOTION_KEY, 'on');
        html.setAttribute('data-motion', 'on');
        // Scroll to top so hero entrance animations are visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Small delay to let scroll settle before firing animations
        setTimeout(activateMotionMode, 320);
      }
      updateMotionBtn();
    });
  }

  // Boot motion mode if already active on page load
  if (html.getAttribute('data-motion') === 'on') {
    requestAnimationFrame(() => activateMotionMode());
  }

  // ── activateMotionMode ────────────────────────────────────────
  function activateMotionMode() {
    if (prefersLess) return;

    // 1. Clear inline styles so CSS classes take full control
    fadeTargets.forEach(el => {
      el.style.opacity    = '';
      el.style.transform  = '';
      el.style.transition = '';
      el.style.filter     = '';
    });

    // 2. Section headers: slide in from left (replay on re-entry)
    setupScrollReveal(
      document.querySelectorAll('.section-header'),
      'ng-title-target',
      false
    );

    // 3. Cards: staggered blur+slide reveal per grid (replay on re-entry)
    [
      document.querySelectorAll('.services-grid .service-card'),
      document.querySelectorAll('.bonus-grid .bonus-card'),
      document.querySelectorAll('.branches-grid .branch-card'),
      document.querySelectorAll('.trust-grid .trust-item'),
    ].forEach(group => setupScrollReveal(group, 'ng-reveal-target', true));

    // 4. Stat numbers: pop in with spring bounce
    setupStatCounters();

    // 5. Hero shapes: scroll parallax + mouse tracking
    setupParallax();
  }

  // ── setupScrollReveal ─────────────────────────────────────────
  // Keeps watching – removes .ng-visible when out of view so the
  // animation replays the next time the element scrolls back in.
  function setupScrollReveal(els, className, stagger) {
    if (!els.length || !('IntersectionObserver' in window)) return;
    els.forEach((el, i) => {
      el.classList.add(className);
      if (stagger) el.style.transitionDelay = (i * 0.08) + 's';
    });
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ng-visible');
        } else {
          // Reset so it replays on next scroll-in
          entry.target.classList.remove('ng-visible');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    els.forEach(el => obs.observe(el));
    activeObservers.push(obs);
  }

  // ── setupStatCounters ─────────────────────────────────────────
  function setupStatCounters() {
    document.querySelectorAll('.stat-num').forEach((el, i) => {
      el.classList.remove('ng-stat-pop');
      el.style.opacity = '0';
      setTimeout(() => el.classList.add('ng-stat-pop'), 650 + i * 130);
    });
  }

  // ── setupParallax ─────────────────────────────────────────────
  // Combines scroll-depth parallax with mouse-tracking so the blobs
  // gently drift toward the cursor while also moving on scroll.
  function setupParallax() {
    const s1   = document.querySelector('.shape-1');
    const s2   = document.querySelector('.shape-2');
    const s3   = document.querySelector('.shape-3');
    const hero = document.querySelector('.hero');
    if (!s1 || !hero) return;

    // Current mouse offset (as fraction of viewport, −0.5 … 0.5)
    let mx = 0, my = 0;
    // Current scroll Y
    let sy = window.scrollY;
    let ticking = false;

    function applyTransforms() {
      // Scroll component
      const scrollY1 =  sy * 0.18;
      const scrollY2 = -sy * 0.12;
      const scrollY3 =  sy * 0.09;

      // Mouse component (max ±28px, ±18px, ±12px)
      const mouseX1 =  mx * 28;  const mouseY1 =  my * 28;
      const mouseX2 = -mx * 18;  const mouseY2 = -my * 18;
      const mouseX3 =  mx * 12;  const mouseY3 =  my * 12;

      if (s1) s1.style.transform = `translate(${mouseX1}px, ${scrollY1 + mouseY1}px)`;
      if (s2) s2.style.transform = `translate(${mouseX2}px, ${scrollY2 + mouseY2}px)`;
      if (s3) s3.style.transform = `translate(${mouseX3}px, ${scrollY3 + mouseY3}px)`;
      ticking = false;
    }

    // Scroll handler
    const onScroll = () => {
      sy = window.scrollY;
      if (!ticking) { requestAnimationFrame(applyTransforms); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanupFunctions.push(() => window.removeEventListener('scroll', onScroll));

    // Mouse handler – only active while hero is visible
    const onMouse = (e) => {
      mx = (e.clientX / window.innerWidth)  - 0.5;
      my = (e.clientY / window.innerHeight) - 0.5;
      if (!ticking) { requestAnimationFrame(applyTransforms); ticking = true; }
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    cleanupFunctions.push(() => window.removeEventListener('mousemove', onMouse));
  }

})();
