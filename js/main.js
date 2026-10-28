const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------- dil: sayfadaki metinler data-en ile, kodla üretilenler t() ile çevrilir ---------- */
const EN = {
  'aç': 'open', 'sepet boş': 'cart is empty', 'ürün': 'items', 'ekle': 'add',
  'sadakat kartı': 'loyalty card', 'randevu': 'booking', 'sipariş': 'ordering', 'kampanya': 'offers',
  'sıcak': 'hot', 'soğuk': 'cold', 'fırın': 'bakery',
  'flat white': 'flat white', 'filtre kahve': 'filter coffee', 'türk kahvesi': 'turkish coffee', 'cold brew': 'cold brew', 'limonata': 'lemonade',
  'kruvasan': 'croissant', 'poğaça': 'savory bun', 'limonlu kek': 'lemon cake',
};
let lang = 'tr';
const t = (s) => (lang === 'en' ? EN[s] ?? s : s);
const langHooks = [];
const onLang = (fn) => { langHooks.push(fn); fn(); };
function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem('lang', l); } catch { /* özel pencere vb.: kalıcı olmasa da çalışır */ }
  document.querySelectorAll('[data-en]').forEach((el) => {
    if (!('tr' in el.dataset)) el.dataset.tr = el.innerHTML;
    el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.tr;
  });
  $('lang').textContent = l === 'en' ? 'tr' : 'en';
  langHooks.forEach((fn) => fn());
}

/* ---------- 01 web siteleri: tarayıcı penceresi ---------- */
const SITES = [
  ['kafe', 'bahcekahve.com', 'bahçe kahve'], ['oto', 'rotamotors.com', 'rota motors'], ['kuafor', 'mirastudio.com', 'mira studio'],
  ['emlak', 'novagayrimenkul.com', 'nova gayrimenkul'], ['hukuk', 'ardahukuk.com', 'arda hukuk'], ['pizza', 'firinnapoli.com', 'fırın napoli'],
  ['fitness', 'pulsefit.com', 'pulse fit'],
];
// [deste kartının zemin rengi, arkadaki ışıma rengi]
const SITE_THEME = [['#efe8da', '#7a3e1d'], ['#0e0e0f', '#c8a15a'], ['#efe3dc', '#8c3b57'], ['#ebe8e1', '#3a4a40'], ['#f3efe6', '#8a6a2f'], ['#f2e9d8', '#a8301c'], ['#0b0b0b', '#ff5b2e']];
let firstFrameLoaded = false;
function initBrowser() {
  const win = $('win'), stage = $('stage'), frame = $('w-frame'), dock = $('dock'), backdrop = $('backdrop');
  const tabsEl = $('tabs'), glow = $('glow'), newBtn = $('newtab');
  const open = SITES.map(() => true); // sekme açık mı
  let idx = 0, fresh = -1;

  const replay = () => { win.classList.remove('enter'); void win.offsetWidth; win.classList.add('enter'); };
  const unmax = () => { win.classList.remove('max'); backdrop.classList.remove('on'); stage.style.minHeight = ''; document.body.style.overflow = ''; };
  const dockText = () => (dock.textContent = win.classList.contains('none') ? t('aç') : `${SITES[idx][2]} · ${t('aç')}`);

  function render() {
    tabsEl.innerHTML = SITES.map((s, i) => !open[i] ? '' :
      `<div class="tab${i === idx && !win.classList.contains('none') ? ' on' : ''}${i === fresh ? ' new' : ''}" role="tab" tabindex="0" data-i="${i}" aria-selected="${i === idx}"><i style="background:${SITE_THEME[i][1]}"></i><span>${s[2]}</span><button class="x" type="button" data-x="${i}" aria-label="kapat / close">✕</button></div>`).join('');
    fresh = -1;
    const list = open.map((o, i) => (o ? i : -1)).filter((i) => i >= 0);
    $('w-count').textContent = list.length ? `${list.indexOf(idx) + 1} / ${list.length}` : '0';
    newBtn.disabled = open.every(Boolean);
    const on = tabsEl.querySelector('.tab.on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function activate(i) {
    idx = i;
    win.classList.remove('none');
    frame.classList.add('loading');
    frame.onload = () => frame.classList.remove('loading');
    frame.src = `sites/${SITES[i][0]}.html`;
    $('w-url').textContent = SITES[i][1];
    glow.style.setProperty('--g', SITE_THEME[i][1]);
    dockText();
    render();
  }
  function showNone() {
    win.classList.add('none');
    frame.removeAttribute('src');
    $('w-url').textContent = '—';
    glow.style.setProperty('--g', '#444');
    dockText();
    render();
  }
  function closeTab(i) {
    const el = tabsEl.querySelector(`.tab[data-i="${i}"]`);
    if (el) el.classList.add('gone');
    setTimeout(() => {
      open[i] = false;
      if (open.every((o) => !o)) return showNone();
      if (i === idx) { let k = i; do k = (k + 1) % SITES.length; while (!open[k]); activate(k); } else render();
    }, el ? 230 : 0);
  }
  function reopen(all) {
    const closed = open.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
    if (!closed.length) return;
    if (all) open.fill(true); else open[closed[0]] = true;
    const target = all ? 0 : closed[0];
    fresh = target;
    activate(target);
    replay();
  }

  frame.addEventListener('load', () => { firstFrameLoaded = true; }, { once: true });
  tabsEl.addEventListener('click', (e) => {
    const x = e.target.closest('[data-x]');
    if (x) return closeTab(+x.dataset.x);
    const tab = e.target.closest('.tab');
    if (tab) activate(+tab.dataset.i);
  });
  tabsEl.addEventListener('keydown', (e) => {
    const tab = e.target.closest('.tab'); if (!tab) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(+tab.dataset.i); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = e.key === 'ArrowRight' ? tab.nextElementSibling : tab.previousElementSibling; if (n) { n.focus(); activate(+n.dataset.i); } }
  });
  $('w-close').onclick = () => { $('w-close').classList.remove('hint'); if (win.classList.contains('none')) reopen(true); else closeTab(idx); };
  newBtn.onclick = () => reopen(false);
  $('restore').onclick = () => reopen(true);
  $('w-min').onclick = () => { unmax(); win.classList.add('min'); stage.classList.add('is-min'); };
  dock.onclick = () => { win.classList.remove('min'); stage.classList.remove('is-min'); replay(); };
  $('w-max').onclick = () => {
    if (win.classList.contains('max')) return unmax();
    stage.style.minHeight = win.offsetHeight + 'px'; // pencere akıştan çıkınca sayfa zıplamasın
    win.classList.add('max'); backdrop.classList.add('on'); document.body.style.overflow = 'hidden'; replay();
  };
  backdrop.onclick = unmax;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') unmax(); });
  onLang(dockText);
  activate(0);
  replay();
  $('w-close').classList.add('hint');
}

/* ---------- 02 mobil uygulamalar: telefon ---------- */
const ICON = {
  cup: '<path d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"/>',
  cal: '<rect x="4" y="6" width="16" height="14" rx="3"/><path d="M4 11h16M9 3v4M15 3v4"/>',
  bag: '<path d="M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>',
};
const APPS = [
  ['sadakat', 'sadakat kartı', '#7a3e1d', ICON.cup],
  ['randevu', 'randevu', '#8c3b57', ICON.cal],
  ['siparis', 'sipariş', '#a8301c', ICON.bag],
  ['duyuru', 'kampanya', '#1a1a1a', ICON.bell],
];
function initPhone() {
  const setDate = () => ($('l-date').textContent = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).toLowerCase());
  setDate(); onLang(setDate);
  const screen = document.querySelector('.screen'), frame = $('app-frame'), lock = $('lock');
  const unlock = () => lock.classList.add('up');
  const openApp = (k, btn) => {
    const sr = screen.getBoundingClientRect(), ir = btn && btn.classList.contains('ico') ? btn.querySelector('i').getBoundingClientRect() : null;
    screen.style.setProperty('--ox', ir ? ((ir.left + ir.width / 2 - sr.left) / sr.width) * 100 + '%' : '50%');
    screen.style.setProperty('--oy', ir ? ((ir.top + ir.height / 2 - sr.top) / sr.height) * 100 + '%' : '50%');
    unlock();
    frame.style.setProperty('--ox', screen.style.getPropertyValue('--ox'));
    frame.style.setProperty('--oy', screen.style.getPropertyValue('--oy'));
    frame.src = `apps/${k}.html`;
    requestAnimationFrame(() => screen.classList.add('open'));
    $('phone').scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  };
  const closeApp = () => { screen.classList.remove('open'); setTimeout(() => { if (!screen.classList.contains('open')) frame.removeAttribute('src'); }, 450); };
  $('home').innerHTML = APPS.map((a) => `<button class="ico" type="button" data-k="${a[0]}"><i style="background:${a[2]}"><svg viewBox="0 0 24 24">${a[3]}</svg></i><span></span></button>`).join('');
  $('apps-list').innerHTML = APPS.map((a) => `<li><button type="button" data-k="${a[0]}"></button></li>`).join('');
  onLang(() => {
    document.querySelectorAll('.ico span').forEach((sp, i) => (sp.textContent = t(APPS[i][1])));
    document.querySelectorAll('#apps-list button').forEach((b, i) => (b.textContent = t(APPS[i][1])));
  });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) openApp(b.dataset.k, b); });
  // kilit ekranı: yukarı kaydırın ya da dokunun
  let y0 = null;
  lock.addEventListener('pointerdown', (e) => { y0 = e.clientY; lock.setPointerCapture(e.pointerId); });
  lock.addEventListener('pointerup', (e) => { if (y0 !== null && (y0 - e.clientY > 40 || Math.abs(y0 - e.clientY) < 6)) unlock(); y0 = null; });
  $('homebar').onclick = () => {
    if (screen.classList.contains('open')) closeApp();
    else if (lock.classList.contains('up')) lock.classList.remove('up');
    else unlock();
  };
}

/* ---------- 03 logo ve kurumsal kimlik: işletmeyi seç, bütün kimlik değişsin ---------- */
const BRANDS = [
  {
    id: 'ada', name: 'ada', sector: ['kahve & fırın', 'coffee & bakery'], head: 'DM Serif Display', body: 'DM Sans',
    quote: ['sabah sıcak, akşam bahçede.', 'mornings are warm, evenings are in the garden.'],
    wm: { tt: 'lowercase', ls: '-.01em', st: '100%', w: 400, sz: 'clamp(3rem,7vw,5.6rem)' },
    c: { logoBg: '#3b4a2f', logoFg: '#efe6d4', typeBg: '#efe6d4', typeFg: '#3b4a2f', voiceBg: '#a9573a', voiceFg: '#f6ece0', iconBg: '#26414a', iconFg: '#efe6d4', accent: '#a9573a' },
    names: [['zeytin', 'olive'], ['kum', 'sand'], ['kiremit', 'terracotta'], ['deniz', 'sea']],
  },
  {
    id: 'cinar', name: 'çınar', sector: ['mobilya atölyesi', 'furniture workshop'], head: 'Archivo', body: 'Inter',
    wm: { tt: 'uppercase', ls: '.26em', st: '125%', w: 300, sz: 'clamp(1.7rem,3.6vw,3rem)' },
    quote: ['kalıcı olsun diye yapılır.', 'made to last.'],
    c: { logoBg: '#1f2124', logoFg: '#efeae0', typeBg: '#e9e4d9', typeFg: '#1f2124', voiceBg: '#7b5236', voiceFg: '#f3ece1', iconBg: '#454f47', iconFg: '#efeae0', accent: '#c08a5e' },
    names: [['kömür', 'charcoal'], ['krem', 'cream'], ['ceviz', 'walnut'], ['adaçayı', 'sage']],
  },
  {
    id: 'sera', name: 'sera', sector: ['çiçekçi', 'florist'], head: 'Bodoni Moda', body: 'Jost',
    wm: { tt: 'lowercase', ls: '-.02em', st: '100%', w: 400, sz: 'clamp(3rem,7vw,5.4rem)' },
    quote: ['her gün taze, her gün bir başka.', 'fresh every day, different every day.'],
    c: { logoBg: '#24402f', logoFg: '#f2ede4', typeBg: '#f2ede4', typeFg: '#24402f', voiceBg: '#7a2a40', voiceFg: '#f6ece8', iconBg: '#cfa9a8', iconFg: '#24402f', accent: '#b4435f' },
    names: [['yaprak', 'leaf'], ['krema', 'cream'], ['şarap', 'wine'], ['pudra', 'powder']],
  },
];

function initBrand() {
  const bb = $('bb'), pick = $('brand-pick');
  let cur = BRANDS[0];
  const L = () => (lang === 'en' ? 1 : 0);

  const colorsOf = (b) => [[b.c.logoBg, b.c.logoFg], [b.c.typeBg, b.c.typeFg], [b.c.voiceBg, b.c.voiceFg], [b.c.iconBg, b.c.iconFg]];
  const renderPal = () => {
    $('pal').innerHTML = colorsOf(cur).map(([bg, fg], k) =>
      `<button class="stripe" type="button" style="--c:${bg};--t:${fg}" data-hex="${bg}"><b>${cur.names[k][L()]}</b><span>${bg}</span></button>`).join('');
  };
  const bind = () => {
    const text = { name: cur.name, sector: cur.sector[L()], head: cur.head, body: cur.body, quote: cur.quote[L()] };
    bb.querySelectorAll('[data-bind]').forEach((el) => (el.textContent = text[el.dataset.bind]));
    pick.querySelectorAll('button').forEach((b, k) => (b.querySelector('small').textContent = BRANDS[k].sector[L()]));
  };
  const apply = () => {
    const c = cur.c;
    Object.entries(c).forEach(([k, v]) => bb.style.setProperty('--' + k, v));
    const w = cur.wm; bb.style.setProperty('--wt', w.tt); bb.style.setProperty('--wl', w.ls); bb.style.setProperty('--wst', w.st); bb.style.setProperty('--ww', w.w); bb.style.setProperty('--wsz', w.sz);
    bb.style.setProperty('--fh', `"${cur.head}", serif`);
    bb.style.setProperty('--fb', `"${cur.body}", sans-serif`);
    bb.querySelectorAll('.bu').forEach((u) => u.setAttribute('href', '#' + cur.mark));
    renderPal();
    bind();
  };
  BRANDS.forEach((b) => (b.mark = b.id));

  pick.innerHTML = BRANDS.map((b) => `<button type="button" aria-pressed="${b === cur}" data-id="${b.id}"><span class="pm" style="--b1:${b.c.logoBg};--b2:${b.c.logoFg};--accent:${b.c.accent}"><svg viewBox="6 6 88 88"><use href="#${b.id}"/></svg></span><span class="pt"><b>${b.name}</b><small></small></span></button>`).join('');
  pick.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn || btn.dataset.id === cur.id) return;
    cur = BRANDS.find((b) => b.id === btn.dataset.id);
    pick.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
    bb.classList.add('swap');
    document.getElementById('flip').classList.remove('on');
    setTimeout(() => { apply(); bb.classList.remove('swap'); }, 260);
  });

  // renk şeritleri: dokununca renk kodunu kopyalar
  $('pal').addEventListener('click', (e) => {
    const st = e.target.closest('.stripe'); if (!st) return;
    try { navigator.clipboard.writeText(st.dataset.hex); } catch { /* kopyalama kapalıysa sessizce geç */ }
    const sp = st.querySelector('span'), old = st.dataset.hex;
    sp.textContent = lang === 'en' ? 'copied' : 'kopyalandı';
    setTimeout(() => (sp.textContent = old), 1200);
  });
  // kartvizit: dokununca çevrilir
  $('t-card').addEventListener('click', () => $('flip').classList.toggle('on'));
  // logo kutusu: logo fareyi hafifçe takip eder
  const tl = $('t-logo');
  if (finePointer && !reduced) {
    tl.addEventListener('pointermove', (e) => {
      const r = tl.getBoundingClientRect();
      tl.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5) * 22 + 'px');
      tl.style.setProperty('--ty', ((e.clientY - r.top) / r.height - 0.5) * 22 + 'px');
    });
    tl.addEventListener('pointerleave', () => { tl.style.setProperty('--tx', '0px'); tl.style.setProperty('--ty', '0px'); });
  }
  // kutular ekrana gelince sırayla belirir
  new IntersectionObserver(([en], ob) => { if (en.isIntersecting) { bb.classList.add('in'); ob.disconnect(); } }, { threshold: 0.12 }).observe(bb);

  onLang(() => { apply(); });
}

/* ---------- 04 menü tasarımı ---------- */
const MENU = {
  'sıcak': [['flat white', 95], ['filtre kahve', 80], ['türk kahvesi', 70]],
  'soğuk': [['cold brew', 110], ['limonata', 75]],
  'fırın': [['kruvasan', 90], ['poğaça', 60], ['limonlu kek', 85]],
};
function initMenu() {
  const stage = $('mstage');
  $('seg').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#seg button').forEach((x) => x.classList.toggle('on', x === b));
    stage.dataset.mode = b.dataset.m;
  };
  stage.addEventListener('pointermove', (e) => {
    if (stage.dataset.mode === 'digital' || stage.dataset.mode === 'board') return;
    const r = stage.getBoundingClientRect();
    stage.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 18 + 'deg');
    stage.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 12 + 'deg');
  });
  stage.addEventListener('pointerleave', () => { stage.style.setProperty('--rx', '0deg'); stage.style.setProperty('--ry', '0deg'); });
  // masa kartındaki örnek kod (gerçek bir QR değil, görünüm içindir)
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const N = 29, cells = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if ((x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)) continue;
    if (rnd() < 0.48) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  [[0, 0], [N - 7, 0], [0, N - 7]].forEach(([x, y]) => cells.push(`<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`));
  $('qr').innerHTML = cells.join('');

  let cat = 'sıcak', n = 0, total = 0;
  const bar = () => { $('d-n').textContent = n ? `${n} ${t('ürün')}` : t('sepet boş'); $('d-t').textContent = total + ' ₺'; };
  const draw = () => {
    $('d-chips').innerHTML = Object.keys(MENU).map((k) => `<button type="button" class="${k === cat ? 'on' : ''}" data-c="${k}">${t(k)}</button>`).join('');
    $('d-list').innerHTML = MENU[cat].map(([name, price], i) => `<div class="d-item" style="animation-delay:${i * 60}ms"><span>${t(name)}</span><span>${price} ₺</span><button type="button" data-p="${price}" aria-label="${t('ekle')}">+</button></div>`).join('');
    bar();
  };
  $('digi').addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]'), a = e.target.closest('[data-p]');
    if (c) { cat = c.dataset.c; draw(); }
    if (a) { n++; total += +a.dataset.p; bar(); }
  });
  onLang(draw);
}

/* ---------- başlangıç: logo yükleme ilerlemesiyle dolar ---------- */
function initLoader() {
  const fillRect = $('fillrect'), pct = $('loader-pct');
  const FILL_TOP = 200, FILL_H = 1145, MIN_MS = 2600;
  let fontsReady = false, loaded = document.readyState === 'complete';
  document.fonts.ready.then(() => (fontsReady = true));
  addEventListener('load', () => (loaded = true), { once: true });
  let shown = 0;
  (function tick() {
    const real = 0.15 + (fontsReady ? 0.25 : 0) + (loaded ? 0.35 : 0) + (firstFrameLoaded ? 0.25 : 0);
    const target = Math.min(real, performance.now() / MIN_MS);
    const gap = target - shown;
    shown = Math.min(target, gap < 0.001 ? target : shown + Math.max(gap * 0.1, 0.004));
    const h = FILL_H * shown;
    fillRect.setAttribute('y', FILL_TOP + FILL_H - h);
    fillRect.setAttribute('height', h);
    pct.textContent = Math.round(shown * 100);
    if (shown >= 1) {
      $('loader').classList.add('full');
      setTimeout(() => { $('loader').classList.add('done'); document.body.classList.remove('loading'); dispatchEvent(new Event('site-ready')); }, 600);
      return;
    }
    requestAnimationFrame(tick);
  })();
}

/* ---------- üst menü rengi: altındaki bölümün zeminine göre ---------- */
function initHeaderColor() {
  const hdr = document.querySelector('header');
  // [bölüm, yazı rengi, üst menünün altına inen soluk zemin]
  const DARK = 'rgba(10,10,10,.88)';
  const parts = [['.hero', '#f4f4f1', DARK], ['#web', '#f4f4f1', DARK], ['#mobil', '#0a0a0a', 'rgba(233,233,229,.88)'], ['#kimlik', '#f4f4f1', DARK], ['#menu', '#0a0a0a', 'rgba(216,201,174,.88)'], ['#hakkimda', '#f4f4f1', DARK], ['#iletisim', '#f4f4f1', DARK]]
    .map(([sel, c, bg]) => [document.querySelector(sel), c, bg]);
  let raf = 0;
  const update = () => {
    raf = 0;
    const hit = parts.find(([el]) => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    if (hit) {
      const color = hit[1];
      hdr.style.color = color;
      hdr.style.setProperty('--hbg', hit[2]);
      document.documentElement.style.setProperty('--ui', color);
    }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* ---------- açılış kolajı: yüklemeden sonra canlanır, fareyle hafifçe oynar ---------- */
function initCollage() {
  const hero = document.querySelector('.hero'), col = $('collage');
  if (!matchMedia('(min-width: 1150px)').matches) return;
  addEventListener('site-ready', () => col.querySelectorAll('iframe').forEach((f) => (f.src = f.dataset.src)), { once: true });
  if (reduced || !finePointer) return;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    col.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2);
    col.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2);
  });
}

/* ---------- ilerleme, yan gezinti, sabit düğme, imleç, mıknatıslı düğme ---------- */
function initUI() {
  const bar = $('progress'), fab = $('fab'), contact = $('iletisim');
  const navLinks = [...document.querySelectorAll('header nav a')];
  const side = $('sidenav');
  side.innerHTML = navLinks.map((a) => `<a href="${a.getAttribute('href')}"><span></span><i></i></a>`).join('');
  const sideLinks = [...side.children];
  onLang(() => sideLinks.forEach((a, i) => (a.firstChild.textContent = navLinks[i].textContent)));
  const secs = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? scrollY / max : 0);
    sideLinks.forEach((a, i) => { const r = secs[i].getBoundingClientRect(); a.classList.toggle('on', r.top <= innerHeight * 0.45 && r.bottom > innerHeight * 0.45); });
    fab.classList.toggle('on', scrollY > innerHeight * 0.8 && contact.getBoundingClientRect().top > innerHeight * 0.7);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();

  if (!finePointer || reduced) return;
  const wa = $('wa');
  addEventListener('pointermove', (e) => {
    const r = wa.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    wa.style.transform = Math.hypot(dx, dy) < 150 ? `translate(${dx * 0.25}px, ${dy * 0.25}px)` : '';
  });
}

$('lang').onclick = () => setLang(lang === 'en' ? 'tr' : 'en');
initBrowser();
initPhone();
initBrand();
initMenu();
initHeaderColor();
initCollage();
initUI();
let saved = null;
try { saved = localStorage.getItem('lang'); } catch { /* yok say */ }
setLang(saved || (navigator.language.startsWith('tr') ? 'tr' : 'en'));
initLoader();
