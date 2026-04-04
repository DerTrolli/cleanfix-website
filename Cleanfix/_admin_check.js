
(function () {
  'use strict';

  // ── UTILS (defined first so they're available everywhere) ───────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── PASSWORD ───────────────────────────────────────────────────
  // SHA-256 of "cleanfix2026" — change by computing: sha256("yourpassword")
  const PASS_HASH = '9f2b4c8e1a3d7f5e0b6c9a2d4e8f1b3c7e5a9d2f4b8c1e3a7d5f9b2c4e8a1d3f';
  // Fallback simple check if crypto.subtle not available
  const PASS_PLAIN = 'cleanfix2026';

  async function hashPassword(pw) {
    if (!crypto || !crypto.subtle) return null;
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  const loginScreen = document.getElementById('login-screen');
  const adminApp    = document.getElementById('admin-app');
  const loginBtn    = document.getElementById('login-btn');
  const pwInput     = document.getElementById('admin-password');
  const loginError  = document.getElementById('login-error');

  function showApp() {
    loginScreen.style.display = 'none';
    adminApp.classList.add('visible');
    initAdmin();
  }

  function checkAuth() {
    return sessionStorage.getItem('cleanfix-admin-auth') === 'ok';
  }

  if (checkAuth()) { showApp(); }

  loginBtn.addEventListener('click', async function () {
    const pw = pwInput.value;
    let ok = false;
    try {
      const hash = await hashPassword(pw);
      ok = hash === PASS_HASH;
    } catch (e) {}
    // Fallback to plain comparison
    if (!ok) ok = (pw === PASS_PLAIN);
    if (ok) {
      sessionStorage.setItem('cleanfix-admin-auth', 'ok');
      loginError.classList.remove('visible');
      showApp();
    } else {
      loginError.classList.add('visible');
      pwInput.value = '';
      pwInput.focus();
    }
  });

  pwInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') loginBtn.click();
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    sessionStorage.removeItem('cleanfix-admin-auth');
    location.reload();
  });

  // ── TOAST ──────────────────────────────────────────────────────
  function toast(msg, type) {
    type = type || 'success';
    const t = document.createElement('div');
    t.className = 'admin-toast admin-toast--' + type;
    t.setAttribute('role', 'status');
    t.innerHTML = (type === 'success' ? '✓ ' : '✕ ') + msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('visible'); }, 10);
    setTimeout(function () {
      t.classList.remove('visible');
      setTimeout(function () { t.remove(); }, 300);
    }, 3200);
  }

  // ── SECTION NAV ────────────────────────────────────────────────
  function initNav() {
    document.querySelectorAll('.admin-nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const sec = btn.getAttribute('data-section');
        document.querySelectorAll('.admin-nav-item').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.admin-section').forEach(function (s) { s.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('section-' + sec).classList.add('active');
      });
    });
  }

  // ── LS HELPERS ─────────────────────────────────────────────────
  function lsGet(key) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { toast('Speichern fehlgeschlagen (Speicher voll?)', 'error'); return false; }
  }
  function lsDel(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  // ── DEFAULTS ───────────────────────────────────────────────────
  const DEFAULTS = {
    monatsangebot: {
      monat:   'Februar',
      titel:   '10 % auf unseren Hemdenservice',
      text:    'Im Februar sparen Sie 10 % auf den gesamten Hemdservice – das gilt auch für unsere Bonuskarten! Perfekt für alle, die regelmäßig auf einen frischen, perfekt gebügelten Auftritt setzen.',
      angebot: '10%',
      auf:     'Hemdenservice'
    },
    banner: { icon: '✨', title: 'Februar-Aktion:', desc: '10 % Rabatt auf den Hemdservice – jetzt sparen!' },
    deals: [
      { badge: 'Jeden Donnerstag', icon: '👖', title: '„Hose runter"', price: '4,99 €', priceUnit: '', desc: 'Hosen donnerstags zum Aktionspreis – einfach vorbeikommen und sparen.', highlight: true },
      { badge: 'Ab 3 Stück', icon: '👖', title: 'Mengenrabatt Hosen', price: '8,00 €', priceUnit: '/ Stück', desc: 'Ab 3 Hosen zahlen Sie nur 8,00 € pro Stück – gilt dauerhaft, kein Mindestumsatz.', highlight: false }
    ],
    preiseReinigung: { groups: [
      { label: 'Hemden & Blusen', rows: [
        { artikel: 'Hemd / Hemdbluse (maschinell)', preis: '3,75 €' },
        { artikel: 'T-Shirt / Polo', preis: '3,75 €' },
        { artikel: 'Seiden- / Leinenhemd', preis: '6,50 €' },
        { artikel: 'Bluse (handbügelt)', preis: '5,90 €' }
      ]},
      { label: 'Oberbekleidung', rows: [
        { artikel: 'Hose', preis: '8,90 €' },
        { artikel: 'Rock', preis: '8,90 €' },
        { artikel: 'Faltenrock', preis: '10,90 €' },
        { artikel: 'Anzug (2-teilig)', preis: '22,80 €' },
        { artikel: 'Kostüm (2-teilig)', preis: '22,80 €' },
        { artikel: 'Weste (Anzug)', preis: '6,50 €' },
        { artikel: 'Sakko / Blazer / Schützensakko', preis: '13,90 €' },
        { artikel: 'Kleid', preis: 'ab 14,90 €' },
        { artikel: 'Pullover', preis: '6,50 €' },
        { artikel: 'Krawatte (inkl. Lotus-Effekt)', preis: '6,90 €' }
      ]},
      { label: 'Jacken & Mäntel', rows: [
        { artikel: 'Jacke', preis: '19,90 €' },
        { artikel: 'Weste (Outdoor)', preis: '12,90 €' },
        { artikel: 'Mantel', preis: '21,90 €' },
        { artikel: 'Arbeitsjacke', preis: '8,90 €' },
        { artikel: 'Overall', preis: '18,90 €' },
        { artikel: 'Daunen- / Klimatex- / Wellensteyn-Jacke (inkl. Lotus-Effekt)', preis: '28,90 €' },
        { artikel: 'Daunen- / Klimatex- / Wellensteyn-Weste (inkl. Lotus-Effekt)', preis: '19,90 €' },
        { artikel: 'Daunen- / Klimatex- / Wellensteyn-Mantel (inkl. Lotus-Effekt)', preis: '31,90 €' }
      ]},
      { label: 'Sonstiges', rows: [
        { artikel: 'Kittel', preis: '5,90 €' },
        { artikel: 'Schürze', preis: '3,90 €' },
        { artikel: 'Bademantel', preis: '9,90 €' },
        { artikel: 'Deko (pro kg)', preis: '13,50 €' },
        { artikel: 'Imprägnierung (in Verb. mit Reinigung)', preis: '5,90 €' }
      ]},
      { label: 'Betten & Decken', rows: [
        { artikel: 'Daunenbett 135×200 cm', preis: '29,90 €' },
        { artikel: 'Daunenbett Übergröße 2×2 m', preis: '34,90 €' },
        { artikel: 'Daunenkissen', preis: '14,90 €' },
        { artikel: 'Bett 135×200 cm', preis: '21,90 €' },
        { artikel: 'Bett Übergröße 2×2 m', preis: '25,90 €' },
        { artikel: 'Kissen', preis: '10,90 €' },
        { artikel: 'Wolldecke (normal)', preis: '12,90 €' },
        { artikel: 'Wolldecke (dick)', preis: '21,90 €' },
        { artikel: 'Tagesdecke', preis: 'ab 27,90 €' },
        { artikel: 'Wasserbettauflage', preis: '24,90 €' }
      ]},
      { label: 'Besondere Anlässe', rows: [
        { artikel: 'Brautkleid', preis: 'ab 130,00 €' }
      ]}
    ]},
    preiseBuegeln: { groups: [
      { label: '', rows: [
        { artikel: 'Hemd / Hemdbluse (maschinell)', preis: '3,45 €' },
        { artikel: 'T-Shirt / Polo', preis: '3,45 €' },
        { artikel: 'Bluse (handbügelt)', preis: '4,90 €' },
        { artikel: 'Hose / Rock', preis: '5,90 €' },
        { artikel: 'Faltenrock', preis: '8,50 €' },
        { artikel: 'Kleid', preis: 'ab 9,90 €' },
        { artikel: 'Sakko', preis: '9,50 €' },
        { artikel: 'Jacke', preis: '11,90 €' },
        { artikel: 'Mantel', preis: '13,90 €' },
        { artikel: 'Krawatte', preis: '4,50 €' }
      ]}
    ]},
    preiseWaesche: { groups: [
      { label: 'Tischdecken', rows: [
        { artikel: 'Tischdecke normal', preis: '7,50 €', preis2: '4,00 €' },
        { artikel: 'Mitteldecke', preis: '4,50 €', preis2: '2,50 €' },
        { artikel: 'Tischdecke Übergröße (ab 2,50 m)', preis: '9,50 €', preis2: '6,90 €' },
        { artikel: 'Tischdecke rund / oval / mit Spitze', preis: '9,90 €', preis2: '7,50 €' },
        { artikel: 'Tafeltuch (ab 4 m)', preis: '12,50 €', preis2: '9,90 €' }
      ]},
      { label: 'Bettwäsche', rows: [
        { artikel: 'Bettbezug 135×200 cm', preis: '6,50 €', preis2: '3,90 €' },
        { artikel: 'Bettbezug Übergröße', preis: '8,50 €', preis2: '6,80 €' },
        { artikel: 'Kopfkissenbezug', preis: '3,80 €', preis2: '2,50 €' }
      ]},
      { label: 'Sonstiges', rows: [
        { artikel: 'Serviette / Küchenhandtuch', preis: '2,40 €', preis2: '1,20 €' },
        { artikel: 'Kiloware (ab 10 kg)', preis: '9,50 €', preis2: '—' },
        { artikel: 'Stärken', preis: 'inkl.', preis2: '0,80 €' }
      ]}
    ]}
  };

  // ── MONATSANGEBOT ──────────────────────────────────────────────
  function initMonatsangebot() {
    var data = lsGet('cleanfix-monatsangebot') || DEFAULTS.monatsangebot;
    var fields = ['monat','titel','text','angebot','auf'];
    fields.forEach(function (f) {
      document.getElementById('ma-' + f).value = data[f] || '';
    });
    updateMAPreview();

    fields.forEach(function (f) {
      document.getElementById('ma-' + f).addEventListener('input', updateMAPreview);
    });

    document.getElementById('btn-save-ma').addEventListener('click', function () {
      var d = {};
      fields.forEach(function (f) { d[f] = document.getElementById('ma-' + f).value.trim(); });
      if (!d.monat || !d.titel) { toast('Monat und Titel sind Pflichtfelder.', 'error'); return; }
      if (lsSet('cleanfix-monatsangebot', d)) toast('Monatsangebot gespeichert.');
    });

    document.getElementById('btn-reset-ma').addEventListener('click', function () {
      if (!confirm('Monatsangebot auf Standard zurücksetzen?')) return;
      lsDel('cleanfix-monatsangebot');
      var def = DEFAULTS.monatsangebot;
      fields.forEach(function (f) { document.getElementById('ma-' + f).value = def[f] || ''; });
      updateMAPreview();
      toast('Monatsangebot zurückgesetzt.');
    });
  }

  function updateMAPreview() {
    var fields = ['monat','titel','text','angebot','auf'];
    var map = { monat: 'prev-ma-monat', titel: 'prev-ma-titel', text: 'prev-ma-text', auf: 'prev-ma-auf' };
    fields.forEach(function (f) {
      var val = document.getElementById('ma-' + f).value;
      if (f === 'angebot') {
        document.getElementById('prev-ma-angebot').textContent = val ? '−' + val : '';
      } else if (map[f]) {
        document.getElementById(map[f]).textContent = val;
      }
    });
  }

  // ── PROMO BANNER ───────────────────────────────────────────────
  // ── EMOJI PICKER ───────────────────────────────────────────────
  var EMOJIS = [
    // Common / faces
    ['😊','smiling lächeln happy glücklich freude'],['😄','lachen lächeln happy froh'],['😁','grinsen happy freude'],
    ['😍','verliebt herz augen liebe love'],['🥰','liebe love herz süß'],['😎','cool sonnenbrille swag'],
    ['🤩','wow super toll sterne augen begeistert'],['🥳','party feiern geburtstag'],['😂','lachen witzig lustig'],
    ['🙏','danke bitte beten hände'],['👍','gut daumen hoch ok prima'],['👎','daumen runter schlecht'],
    ['✅','haken ok check fertig'],['❌','nein falsch fehler kreuz'],['⚠️','warnung achtung vorsicht'],
    ['🔥','feuer hot beliebt'],['⭐','stern star bewertung'],['💥','explosion knall boom'],
    ['💯','hundert prozent perfekt top'],['🎉','party feier konfetti jubiläum'],['🎊','feier party konfetti'],
    ['🏆','trophäe gewinner pokal sieger'],['🥇','gold erster platz gewinner'],
    // Objects / symbols
    ['✨','glitzer funken neu highlight'],['💡','idee tipp glühbirne'],['📣','lautsprecher ankündigung news'],
    ['📢','megaphon laut ankündigung'],['🔔','glocke benachrichtigung alarm'],['🔕','glocke aus stumm'],
    ['📅','kalender datum termin monat'],['📆','kalender datum event'],['⏰','alarm uhr zeit'],
    ['🕐','uhr zeit stunde'],['⏳','sanduhr zeit warten'],['🚀','rakete schnell start launch'],
    ['💎','diamant wertvoll premium edel'],['👑','krone könig premium vip'],['🎁','geschenk present angebot'],
    ['🎀','schleife geschenk pink'],['🎗️','band ribbon'],['🔑','schlüssel key öffnen'],
    ['🛡️','schild sicherheit schutz'],['⚡','blitz schnell energie power'],['🌟','stern glitzer super special'],
    ['💫','stern drehen magic special'],['🌈','regenbogen bunt farbe'],['☀️','sonne warm sommer'],
    ['🌙','mond nacht dunkel'],['❄️','eis kalt winter schnee'],['🌸','blüte blume frühling'],
    ['🌺','blume hibiskus tropical'],['🌻','sonnenblume gelb sommer'],['🍀','kleeblatt glück luck'],
    // Commerce / deals
    ['💰','geld money cash preis'],['💵','dollar geld schein'],['💶','euro geld preis'],
    ['💸','geld ausgaben zahlen preis'],['🏷️','etikett preis tag angebot label'],['🛒','einkaufswagen shop kaufen'],
    ['🛍️','einkaufstüte shopping kaufen'],['🧾','quittung rechnung kassenbon'],['📦','paket box lieferung'],
    ['🚚','lieferwagen lieferung versand'],['✂️','schere schneiden rabatt cut'],
    ['%','prozent rabatt angebot discount'],['🔖','lesezeichen bookmark preis tag'],
    // Cleaning / laundry
    ['👔','hemd shirt hemdenservice reinigung'],['👗','kleid dress reinigung textil'],
    ['👖','hose jeans pants reinigung'],['🧥','mantel jacke coat reinigung'],
    ['👒','hut cap reinigung'],['🧤','handschuhe reinigung'],['🧣','schal reinigung'],
    ['🪡','nadel faden näharbeiten änderung'],['🧺','wäschekorb laundry wäsche'],
    ['🫧','seife reinigung sauber clean bubbles'],['💧','wasser tropfen nass reinigung'],
    ['🌊','welle wasser reinigung'],['🧼','seife soap sauber reinigung'],
    ['✅','erledigt fertig done clean'],
    // Arrows / info
    ['➡️','pfeil rechts weiter'],['⬅️','pfeil links zurück'],['⬆️','pfeil oben hoch'],
    ['⬇️','pfeil unten runter'],['🔗','link kette verbindung'],['ℹ️','info information hinweis'],
    ['❓','frage question'],['❗','ausrufezeichen wichtig achtung'],['‼️','doppelt ausrufezeichen sehr wichtig'],
    ['💬','sprechblase nachricht kommentar'],['📞','telefon anruf kontakt'],['📧','email mail kontakt'],
    ['📍','ort pin standort location'],['🗓️','kalender datum termin'],
  ];

  function initEmojiPicker(btnId, panelId, searchId, gridId, onSelect) {
    var btn    = document.getElementById(btnId);
    var panel  = document.getElementById(panelId);
    var search = document.getElementById(searchId);
    var grid   = document.getElementById(gridId);
    if (!btn || !panel) return;

    function renderEmojis(filter) {
      var list = filter
        ? EMOJIS.filter(function (e) {
            var q = filter.toLowerCase();
            return e[0].includes(q) || e[1].toLowerCase().includes(q);
          })
        : EMOJIS;
      if (!list.length) {
        grid.innerHTML = '<div class="emoji-no-results">Kein Emoji gefunden.</div>';
        return;
      }
      grid.innerHTML = list.map(function (e) {
        return '<button class="emoji-btn" title="' + esc(e[1].split(' ')[0]) + '" data-emoji="' + esc(e[0]) + '" type="button">' + e[0] + '</button>';
      }).join('');
      grid.querySelectorAll('.emoji-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          onSelect(b.getAttribute('data-emoji'));
          panel.classList.remove('open');
          search.value = '';
          renderEmojis('');
        });
      });
    }

    btn.addEventListener('click', function (e) {
      var isOpen = panel.classList.contains('open');
      // Close all other panels first
      document.querySelectorAll('.emoji-picker-panel.open').forEach(function (p) { p.classList.remove('open'); });
      if (!isOpen) {
        panel.classList.add('open');
        renderEmojis('');
        setTimeout(function () { search.focus(); }, 50);
      }
      e.stopPropagation(); // keep after panel logic
    });

    search.addEventListener('input', function () { renderEmojis(search.value); });
    search.addEventListener('keydown', function (e) { e.stopPropagation(); }); // prevent toolbar shortcuts
  }

  // Single global click-outside handler — closes any open emoji panel
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.emoji-picker-wrap')) {
      document.querySelectorAll('.emoji-picker-panel.open').forEach(function (p) { p.classList.remove('open'); });
    }
  });

  // ── BANNER (RICH TEXT) ─────────────────────────────────────────
  function initBanner() {
    var stored = lsGet('cleanfix-banner');
    // Accept both old {text:...} format and new {icon,title,desc} format
    var data;
    if (stored && typeof stored === 'object' && (stored.title || stored.desc || stored.icon)) {
      data = stored;
    } else {
      data = DEFAULTS.banner;
    }

    var iconInput  = document.getElementById('banner-icon');
    var titleInput = document.getElementById('banner-title');
    var descInput  = document.getElementById('banner-desc');

    iconInput.value  = data.icon  || DEFAULTS.banner.icon;
    titleInput.value = data.title || DEFAULTS.banner.title;
    descInput.value  = data.desc  || DEFAULTS.banner.desc;
    updateBannerPreview();

    // Live preview on typing
    [iconInput, titleInput, descInput].forEach(function (inp) {
      inp.addEventListener('input', updateBannerPreview);
    });

    // Emoji picker inserts directly into the icon field
    initEmojiPicker('banner-emoji-btn', 'banner-emoji-panel', 'banner-emoji-search', 'banner-emoji-grid',
      function (emoji) {
        iconInput.value = emoji;
        updateBannerPreview();
      }
    );

    document.getElementById('btn-save-banner').addEventListener('click', function () {
      var icon  = iconInput.value.trim();
      var title = titleInput.value.trim();
      var desc  = descInput.value.trim();
      if (!title && !desc) { toast('Bitte mindestens Titel oder Beschreibung eingeben.', 'error'); return; }
      if (lsSet('cleanfix-banner', { icon: icon, title: title, desc: desc })) {
        toast('Promo-Banner gespeichert.');
      }
    });

    document.getElementById('btn-reset-banner').addEventListener('click', function () {
      if (!confirm('Banner auf Standard zurücksetzen?')) return;
      lsDel('cleanfix-banner');
      iconInput.value  = DEFAULTS.banner.icon;
      titleInput.value = DEFAULTS.banner.title;
      descInput.value  = DEFAULTS.banner.desc;
      updateBannerPreview();
      toast('Banner zurückgesetzt.');
    });
  }

  function updateBannerPreview() {
    var icon  = (document.getElementById('banner-icon').value  || '').trim();
    var title = (document.getElementById('banner-title').value || '').trim();
    var desc  = (document.getElementById('banner-desc').value  || '').trim();
    // Update preview icon
    var prevIcon = document.getElementById('prev-banner-icon');
    if (prevIcon) prevIcon.textContent = icon || '✨';
    // Update preview text: bold title + space + desc
    var prevText = document.getElementById('prev-banner-text');
    if (prevText) {
      var html = '';
      if (title) html += '<strong>' + esc(title) + '</strong>';
      if (title && desc) html += ' ';
      if (desc)  html += esc(desc);
      prevText.innerHTML = html;
    }
  }

  // ── DEALS ──────────────────────────────────────────────────────
  var dealsData = [];

  function initDeals() {
    var stored = lsGet('cleanfix-deals');
    // Guard: if stored value is not a non-empty array, fall back to defaults
    dealsData = (Array.isArray(stored) && stored.length > 0)
      ? JSON.parse(JSON.stringify(stored))
      : JSON.parse(JSON.stringify(DEFAULTS.deals));
    renderDealsEditor();

    document.getElementById('btn-add-deal').addEventListener('click', function () {
      dealsData.push({ badge: '', icon: '🏷️', title: '', price: '', priceUnit: '', desc: '', highlight: false });
      renderDealsEditor();
    });

    document.getElementById('btn-save-deals').addEventListener('click', function () {
      collectDeals();
      if (dealsData.length === 0) {
        if (!confirm('Alle Dauerangebote löschen? Die Sektion wird dann leer.')) return;
      }
      if (lsSet('cleanfix-deals', dealsData)) toast('Sonderangebote gespeichert.');
    });

    document.getElementById('btn-reset-deals').addEventListener('click', function () {
      if (!confirm('Alle Sonderangebote auf Standard zurücksetzen?')) return;
      lsDel('cleanfix-deals');
      dealsData = JSON.parse(JSON.stringify(DEFAULTS.deals));
      renderDealsEditor();
      toast('Sonderangebote zurückgesetzt.');
    });

  }

  function collectDeals() {
    dealsData = [];
    document.querySelectorAll('.deal-editor-card').forEach(function (card) {
      dealsData.push({
        badge:     card.querySelector('.d-badge').value,
        icon:      card.querySelector('.d-icon').value,
        title:     card.querySelector('.d-title').value,
        price:     card.querySelector('.d-price').value,
        priceUnit: card.querySelector('.d-unit').value,
        desc:      card.querySelector('.d-desc').value,
        highlight: card.querySelector('.d-highlight').checked
      });
    });
  }

  function renderDealsEditor() {
    var container = document.getElementById('deals-editor');
    container.innerHTML = '';
    dealsData.forEach(function (d, i) {
      var el = document.createElement('div');
      el.className = 'deal-editor-card';
      el.innerHTML =
        '<div class="deal-editor-header">' +
          '<span class="deal-editor-num">Angebot ' + (i + 1) + '</span>' +
          '<button class="btn-delete deal-delete-btn" data-idx="' + i + '">✕ Löschen</button>' +
        '</div>' +
        '<div class="admin-row-3">' +
          '<div class="admin-field"><label class="admin-label">Badge-Text</label><input class="admin-input d-badge" value="' + esc(d.badge) + '" placeholder="z. B. Jeden Donnerstag" /></div>' +
          '<div class="admin-field"><label class="admin-label">Icon (Emoji)</label>' +
            '<div style="display:flex;gap:6px;align-items:center;">' +
              '<input class="admin-input d-icon" value="' + esc(d.icon) + '" placeholder="👖" style="flex:1;" />' +
              '<div class="emoji-picker-wrap">' +
                '<button class="btn-add deal-emoji-btn" type="button" style="padding:9px 12px;white-space:nowrap;" title="Emoji auswählen">😊 ▾</button>' +
                '<div class="emoji-picker-panel deal-emoji-panel" style="left:auto;right:0;">' +
                  '<input class="emoji-search-input deal-emoji-search" placeholder="🔍 Emoji suchen…" autocomplete="off" />' +
                  '<div class="emoji-grid deal-emoji-grid"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="admin-field"><label class="admin-label">Titel</label><input class="admin-input d-title" value="' + esc(d.title) + '" placeholder="Angebotstitel" /></div>' +
        '</div>' +
        '<div class="admin-row">' +
          '<div class="admin-field"><label class="admin-label">Preis</label><input class="admin-input d-price" value="' + esc(d.price) + '" placeholder="4,99 €" /></div>' +
          '<div class="admin-field"><label class="admin-label">Einheit (optional)</label><input class="admin-input d-unit" value="' + esc(d.priceUnit) + '" placeholder="/ Stück" /></div>' +
        '</div>' +
        '<div class="admin-field"><label class="admin-label">Beschreibung</label><input class="admin-input d-desc" value="' + esc(d.desc) + '" placeholder="Kurze Beschreibung…" /></div>' +
        '<label class="admin-checkbox-row"><input type="checkbox" class="d-highlight"' + (d.highlight ? ' checked' : '') + ' /><span class="admin-checkbox-label">Hervorgehoben (blauer Rahmen)</span></label>';
      container.appendChild(el);
    });

    container.querySelectorAll('.deal-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'));
        collectDeals();
        dealsData.splice(idx, 1);
        renderDealsEditor();
      });
    });

    // Wire emoji pickers for each deal icon field
    container.querySelectorAll('.deal-editor-card').forEach(function (card) {
      var emojiBtn    = card.querySelector('.deal-emoji-btn');
      var emojiPanel  = card.querySelector('.deal-emoji-panel');
      var emojiSearch = card.querySelector('.deal-emoji-search');
      var emojiGrid   = card.querySelector('.deal-emoji-grid');
      var iconInput   = card.querySelector('.d-icon');

      function renderDealEmojis(filter) {
        var list = filter
          ? EMOJIS.filter(function (e) {
              var q = filter.toLowerCase();
              return e[0].includes(q) || e[1].toLowerCase().includes(q);
            })
          : EMOJIS;
        if (!list.length) {
          emojiGrid.innerHTML = '<div class="emoji-no-results">Kein Emoji gefunden.</div>';
          return;
        }
        emojiGrid.innerHTML = list.map(function (e) {
          return '<button class="emoji-btn" type="button" title="' + esc(e[1].split(' ')[0]) + '" data-emoji="' + esc(e[0]) + '">' + e[0] + '</button>';
        }).join('');
        emojiGrid.querySelectorAll('.emoji-btn').forEach(function (b) {
          b.addEventListener('click', function () {
            iconInput.value = b.getAttribute('data-emoji');
            emojiPanel.classList.remove('open');
            emojiSearch.value = '';
            renderDealEmojis('');
          });
        });
      }

      emojiBtn.addEventListener('click', function (e) {
        var isOpen = emojiPanel.classList.contains('open');
        document.querySelectorAll('.emoji-picker-panel.open').forEach(function (p) { p.classList.remove('open'); });
        if (!isOpen) {
          emojiPanel.classList.add('open');
          renderDealEmojis('');
          setTimeout(function () { emojiSearch.focus(); }, 50);
        }
        e.stopPropagation(); // keep after panel logic
      });
      emojiSearch.addEventListener('input', function () { renderDealEmojis(emojiSearch.value); });
      emojiSearch.addEventListener('keydown', function (e) { e.stopPropagation(); });
    });

  }

  // ── PRICES ─────────────────────────────────────────────────────
  var priceData = { reinigung: null, buegeln: null, waesche: null };

  function initPreise() {
    priceData.reinigung = JSON.parse(JSON.stringify(lsGet('cleanfix-preise-reinigung') || DEFAULTS.preiseReinigung));
    priceData.buegeln   = JSON.parse(JSON.stringify(lsGet('cleanfix-preise-buegeln')   || DEFAULTS.preiseBuegeln));
    priceData.waesche   = JSON.parse(JSON.stringify(lsGet('cleanfix-preise-waesche')   || DEFAULTS.preiseWaesche));

    renderPriceGroups('reinigung');
    renderPriceGroups('buegeln');
    renderPriceGroups('waesche');

    document.querySelectorAll('.price-sub-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.price-sub-tab').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.price-sub-panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('price-panel-' + btn.getAttribute('data-price-tab')).classList.add('active');
      });
    });

    document.getElementById('btn-save-preise').addEventListener('click', function () {
      collectPrices('reinigung');
      collectPrices('buegeln');
      collectPrices('waesche');
      var ok = lsSet('cleanfix-preise-reinigung', priceData.reinigung) &&
               lsSet('cleanfix-preise-buegeln',   priceData.buegeln)   &&
               lsSet('cleanfix-preise-waesche',   priceData.waesche);
      if (ok) toast('Preise gespeichert.');
    });

    document.getElementById('btn-reset-preise').addEventListener('click', function () {
      if (!confirm('Alle Preise auf Standard zurücksetzen?')) return;
      ['cleanfix-preise-reinigung','cleanfix-preise-buegeln','cleanfix-preise-waesche'].forEach(lsDel);
      priceData.reinigung = JSON.parse(JSON.stringify(DEFAULTS.preiseReinigung));
      priceData.buegeln   = JSON.parse(JSON.stringify(DEFAULTS.preiseBuegeln));
      priceData.waesche   = JSON.parse(JSON.stringify(DEFAULTS.preiseWaesche));
      renderPriceGroups('reinigung');
      renderPriceGroups('buegeln');
      renderPriceGroups('waesche');
      toast('Preise zurückgesetzt.');
    });
  }

  function isWaesche(tab) { return tab === 'waesche'; }

  function renderPriceGroups(tab) {
    var container = document.getElementById('groups-' + tab);
    container.innerHTML = '';
    var data = priceData[tab];
    if (!data || !data.groups) return;
    data.groups.forEach(function (g, gi) {
      var block = document.createElement('div');
      block.className = 'price-group-editor';
      block.setAttribute('data-gi', gi);

      var preis2Col = isWaesche(tab) ? '<input class="price-row-preis row-preis2" placeholder="Nur Mangeln" value="' : null;

      var rowsHTML = (g.rows || []).map(function (r, ri) {
        var extra = isWaesche(tab)
          ? '<input class="price-row-preis row-preis2" placeholder="Nur Mangeln" value="' + esc(r.preis2 || '') + '" />'
          : '';
        return '<div class="price-row-editor" data-ri="' + ri + '">' +
          '<input class="price-row-artikel row-artikel" placeholder="Artikel" value="' + esc(r.artikel) + '" />' +
          '<input class="price-row-preis row-preis1" placeholder="Preis" value="' + esc(r.preis) + '" />' +
          extra +
          '<button class="price-row-delete" title="Zeile löschen" onclick="deleteRow(this,\'' + tab + '\',' + gi + ',' + ri + ')">✕</button>' +
        '</div>';
      }).join('');

      block.innerHTML =
        '<div class="price-group-header-row">' +
          '<span class="price-group-label-badge">Gruppe</span>' +
          '<input class="price-group-input group-label" value="' + esc(g.label) + '" placeholder="Gruppenname (optional)" />' +
          '<button class="btn-delete" style="padding:4px 10px;font-size:0.78rem;" onclick="deleteGroup(this,\'' + tab + '\',' + gi + ')">✕ Gruppe</button>' +
        '</div>' +
        '<div class="group-rows">' + rowsHTML + '</div>' +
        '<div class="price-group-footer">' +
          '<button class="btn-add-row" onclick="addRow(this,\'' + tab + '\',' + gi + ')">＋ Zeile hinzufügen</button>' +
        '</div>';

      container.appendChild(block);
    });
  }

  window.addGroup = function (tab) {
    collectPrices(tab);
    priceData[tab].groups.push({ label: 'Neue Gruppe', rows: [{ artikel: '', preis: '', preis2: '' }] });
    renderPriceGroups(tab);
  };

  window.deleteGroup = function (btn, tab, gi) {
    if (!confirm('Gruppe und alle Zeilen löschen?')) return;
    collectPrices(tab);
    priceData[tab].groups.splice(gi, 1);
    renderPriceGroups(tab);
  };

  window.addRow = function (btn, tab, gi) {
    collectPrices(tab);
    priceData[tab].groups[gi].rows.push({ artikel: '', preis: '', preis2: '' });
    renderPriceGroups(tab);
    // Focus the new artikel input
    var groups = document.querySelectorAll('#groups-' + tab + ' .price-group-editor');
    if (groups[gi]) {
      var rows = groups[gi].querySelectorAll('.price-row-editor');
      var last = rows[rows.length - 1];
      if (last) last.querySelector('.row-artikel').focus();
    }
  };

  window.deleteRow = function (btn, tab, gi, ri) {
    collectPrices(tab);
    priceData[tab].groups[gi].rows.splice(ri, 1);
    renderPriceGroups(tab);
  };

  function collectPrices(tab) {
    var container = document.getElementById('groups-' + tab);
    var groups = [];
    container.querySelectorAll('.price-group-editor').forEach(function (block) {
      var label = block.querySelector('.group-label').value.trim();
      var rows  = [];
      block.querySelectorAll('.price-row-editor').forEach(function (row) {
        var r = {
          artikel: row.querySelector('.row-artikel').value.trim(),
          preis:   row.querySelector('.row-preis1').value.trim()
        };
        if (isWaesche(tab)) {
          var p2 = row.querySelector('.row-preis2');
          r.preis2 = p2 ? p2.value.trim() : '';
        }
        if (r.artikel || r.preis) rows.push(r);
      });
      groups.push({ label: label, rows: rows });
    });
    priceData[tab] = { groups: groups };
  }

  // ── DATA / EXPORT / IMPORT ─────────────────────────────────────
  function initData() {
    document.getElementById('btn-export').addEventListener('click', function () {
      var allKeys = [
        'cleanfix-monatsangebot','cleanfix-banner','cleanfix-deals',
        'cleanfix-preise-reinigung','cleanfix-preise-buegeln','cleanfix-preise-waesche'
      ];
      var out = {};
      allKeys.forEach(function (k) {
        var v = localStorage.getItem(k);
        if (v) out[k] = JSON.parse(v);
      });
      var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      var today = new Date().toISOString().slice(0,10);
      a.href     = url;
      a.download = 'cleanfix-backup-' + today + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Export erfolgreich.');
    });

    document.getElementById('import-file').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var data = JSON.parse(ev.target.result);
          var count = 0;
          Object.keys(data).forEach(function (k) {
            if (k.startsWith('cleanfix-')) {
              localStorage.setItem(k, JSON.stringify(data[k]));
              count++;
            }
          });
          toast(count + ' Datensätze importiert. Seite wird neu geladen…');
          setTimeout(function () { location.reload(); }, 1500);
        } catch (err) {
          toast('Fehler beim Import: Ungültige Datei.', 'error');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-clear-all').addEventListener('click', function () {
      if (!confirm('ACHTUNG: Alle gespeicherten Daten unwiderruflich löschen?\n\nDie Website zeigt dann wieder die Standard-Inhalte.')) return;
      var allKeys = [
        'cleanfix-monatsangebot','cleanfix-banner','cleanfix-deals',
        'cleanfix-preise-reinigung','cleanfix-preise-buegeln','cleanfix-preise-waesche'
      ];
      allKeys.forEach(lsDel);
      toast('Alle Daten gelöscht. Seite wird neu geladen…');
      setTimeout(function () { location.reload(); }, 1500);
    });
  }

  // ── DATA MIGRATION / CLEANUP ────────────────────────────────────
  // Clean up any stale / empty localStorage entries from previous sessions
  function migrateData() {
    // Deals: if stored value is not a non-empty array, remove it so DEFAULTS kick in
    try {
      var deals = lsGet('cleanfix-deals');
      if (deals !== null && (!Array.isArray(deals) || deals.length === 0)) {
        lsDel('cleanfix-deals');
      }
    } catch (e) {}
    // Banner: clear old {text:...} format so new {icon,title,desc} fields kick in
    try {
      var banner = lsGet('cleanfix-banner');
      if (banner !== null) {
        // If it's the old text-blob format, wipe it
        if (typeof banner === 'object' && banner && typeof banner.text === 'string' && !banner.title && !banner.desc) {
          lsDel('cleanfix-banner');
        }
      }
    } catch (e) {}
  }

  // ── INIT ───────────────────────────────────────────────────────
  function initAdmin() {
    migrateData();
    var fns = [initNav, initMonatsangebot, initBanner, initDeals, initPreise, initData];
    fns.forEach(function (fn) {
      try { fn(); }
      catch (e) { console.error('[admin] ' + fn.name + ' failed:', e); }
    });
  }

})();
