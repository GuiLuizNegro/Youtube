/* =========================================================
   VOCETUBE — aplicação
   Sumário:
   1. Utilitários          6. Rotas
   2. Dados dos vídeos     7. Topo (menu, notificações, conta, tema)
   3. Componentes          8. Busca (autocompletar + voz)
   4. Páginas              9. Janelas (enviar, compartilhar, confirmar)
   5. Página do vídeo     10. Atalhos de teclado e início
   ========================================================= */

/* ============ 1. Utilitários ============ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const DAY = 86400000;

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function normalize(str) {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = String(sec % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
function fmtCount(n) {
  const f = (x) => (x >= 10 ? Math.floor(x) : Math.floor(x * 10) / 10).toString().replace('.', ',');
  if (n >= 1e6) return f(n / 1e6) + ' mi';
  if (n >= 1e3) return f(n / 1e3) + ' mil';
  return String(n);
}
function fmtViews(n) {
  if (n === 0) return 'Nenhuma visualização';
  return n === 1 ? '1 visualização' : `${fmtCount(n)} visualizações`;
}
function ago(ms) {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000), h = Math.floor(min / 60), d = Math.floor(h / 24);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  if (d < 30) { const w = Math.floor(d / 7); return `há ${w} ${w === 1 ? 'semana' : 'semanas'}`; }
  if (d < 365) { const mo = Math.floor(d / 30); return `há ${mo} ${mo === 1 ? 'mês' : 'meses'}`; }
  const y = Math.floor(d / 365); return `há ${y} ${y === 1 ? 'ano' : 'anos'}`;
}
function hashCode(str) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
}

/* Janela de confirmação que devolve true/false */
function confirmBox({ title, text, ok = 'Confirmar' }) {
  const dlg = $('#confirmDialog');
  $('#confirmTitle').textContent = title;
  $('#confirmText').textContent = text;
  $('#confirmOk').textContent = ok;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
  });
}

/* ============ 2. Dados dos vídeos ============ */
const BOOT_TIME = Date.now();

/* Junta os vídeos de exemplo com os enviados pelo usuário */
function allVideos() {
  const uploads = Store.data.uploads.map((u) => ({
    ...u, ch: 'me', views: 0, likes: 0, isUpload: true,
    publishedAt: u.created, c1: '#1E3A5F', c2: '#0B1A2B'
  }));
  const samples = VIDEOS.map((v) => ({ ...v, publishedAt: BOOT_TIME - v.days * DAY }));
  return [...uploads, ...samples];
}
const getVideo = (id) => allVideos().find((v) => v.id === id);
const channelVideos = (key) => allVideos().filter((v) => v.ch === key);
const viewsOf = (v) => v.views + (Store.data.views[v.id] || 0);
const likesOf = (v) => v.likes + (Store.has('liked', v.id) ? 1 : 0);
const followersOf = (key) => CHANNELS[key].followers + (Store.has('following', key) ? 1 : 0);

/* Porcentagem já assistida (para a barrinha na miniatura) */
function progressOf(v) {
  const h = Store.historyEntry(v.id);
  if (!h || !h.pos || !v.dur) return 0;
  return Math.min(100, (h.pos / v.dur) * 100);
}

/* ============ 3. Componentes ============ */
const ICON = {
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H4V10zM7 10l4-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.3 7a2 2 0 0 1-2 1.7H7"/></svg>',
  dislike: '<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(180 12 12)"><path d="M7 10v11H4V10zM7 10l4-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.3 7a2 2 0 0 1-2 1.7H7"/></g></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l6 6-6 6M21 11h-9a8 8 0 0 0-8 8"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  empty: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>'
};

function avatar(key, size = '') {
  const c = CHANNELS[key];
  return `<a href="#/c/${key}" class="avatar ${size}" style="background:${c.color}" aria-label="Canal ${esc(c.name)}">${c.ini}</a>`;
}

function thumb(v) {
  const p = progressOf(v);
  return `
    <div class="thumb" style="--c1:${v.c1};--c2:${v.c2}">
      ${v.thumb
        ? `<img src="${esc(v.thumb)}" alt="" loading="lazy" onerror="this.nextElementSibling.removeAttribute('style');this.remove()">
           <svg viewBox="0 0 24 24" aria-hidden="true" class="thumb__icon" style="display:none">${CAT_ICONS[v.cat] || ''}</svg>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true" class="thumb__icon">${CAT_ICONS[v.cat] || ''}</svg>`}
      <span class="duration">${fmtTime(v.dur)}</span>
      ${p > 0 ? `<span class="thumb__progress"><span style="width:${p}%"></span></span>` : ''}
    </div>`;
}

function saveButton(v) {
  const on = Store.has('saved', v.id);
  return `<button class="icon-btn icon-btn--sm" data-save="${v.id}" aria-pressed="${on}"
            aria-label="${on ? 'Remover de Ver depois' : 'Salvar em Ver depois'}" title="${on ? 'Salvo' : 'Ver depois'}">${on ? ICON.check : ICON.clock}</button>`;
}

function videoCard(v, { showChannel = true, deletable = false } = {}) {
  const c = CHANNELS[v.ch];
  return `
    <article class="card">
      <a href="#/v/${v.id}" class="card__thumb" tabindex="-1" aria-hidden="true">${thumb(v)}</a>
      <div class="card__body">
        ${showChannel ? avatar(v.ch) : ''}
        <div class="card__text">
          <h3 class="card__title"><a href="#/v/${v.id}">${esc(v.title)}</a></h3>
          ${showChannel ? `<a href="#/c/${v.ch}" class="card__meta card__channel">${esc(c.name)}</a>` : ''}
          <span class="card__meta">${fmtViews(viewsOf(v))} · ${ago(v.publishedAt)}</span>
        </div>
        <div class="card__actions">
          ${deletable
            ? `<button class="icon-btn icon-btn--sm" data-delete-upload="${v.id}" aria-label="Excluir vídeo" title="Excluir">${ICON.trash}</button>`
            : saveButton(v)}
        </div>
      </div>
    </article>`;
}

function rowItem(v, { rank, action } = {}) {
  const c = CHANNELS[v.ch];
  const firstLine = (v.desc || '').split('\n')[0];
  return `
    <article class="row-item">
      ${rank ? `<span class="row-item__rank">${rank}</span>` : ''}
      <a href="#/v/${v.id}" class="row-item__thumb" tabindex="-1" aria-hidden="true">${thumb(v)}</a>
      <div class="row-item__text">
        <h3 class="row-item__title"><a href="#/v/${v.id}">${esc(v.title)}</a></h3>
        <span class="card__meta">${fmtViews(viewsOf(v))} · ${ago(v.publishedAt)}</span>
        <a href="#/c/${v.ch}" class="row-item__channel">${avatar(v.ch, 'avatar--xs').replace('<a ', '<span ').replace('</a>', '</span>')}${esc(c.name)}</a>
        ${firstLine ? `<p class="row-item__desc">${esc(firstLine)}</p>` : ''}
      </div>
      ${action || ''}
    </article>`;
}

function followButton(key) {
  if (key === 'me') return '';
  const on = Store.has('following', key);
  return `<button class="follow-btn ${on ? 'is-following' : ''}" data-follow="${key}" aria-pressed="${on}">${on ? 'Seguindo' : 'Seguir'}</button>`;
}

function emptyState({ icon = ICON.empty, title, text, action = '' }) {
  return `
    <div class="empty-state">
      <span class="empty-state__icon">${icon}</span>
      <h2>${title}</h2>
      ${text ? `<p class="muted">${text}</p>` : ''}
      ${action}
    </div>`;
}

function pageHead(title, extra = '') {
  return `<div class="page-head"><h1>${title}</h1>${extra}</div>`;
}

function chipsHTML(list, active, attr) {
  return `<div class="chips" role="toolbar">${list.map((c) =>
    `<button class="chip" ${attr}="${esc(c.value ?? c)}" aria-pressed="${(c.value ?? c) === active}">${esc(c.label ?? c)}</button>`
  ).join('')}</div>`;
}

/* ============ 4. Páginas ============ */
const view = { homeCat: 'Tudo', trendCat: 'Tudo', searchType: 'all', searchSort: 'relevance', channelTab: 'videos', channelSort: 'new', relatedFilter: 'all', commentSort: 'top' };
const app = () => $('#app');

function renderHome() {
  document.title = 'VoceTube';
  const list = allVideos().filter((v) => view.homeCat === 'Tudo' || v.cat === view.homeCat);

  const continuing = Store.data.history
    .map((h) => ({ h, v: getVideo(h.id) }))
    .filter(({ h, v }) => v && h.pos > 10 && h.pos < v.dur - 10)
    .slice(0, 8).map(({ v }) => v);

  app().innerHTML = `
    <div class="page">
      ${chipsHTML(['Tudo', ...CATEGORIES], view.homeCat, 'data-home-cat')}
      ${view.homeCat === 'Tudo' && continuing.length ? `
        <section class="shelf" aria-labelledby="contTitle">
          <h2 class="shelf__title" id="contTitle">Continue assistindo</h2>
          <div class="shelf__row">${continuing.map((v) => videoCard(v)).join('')}</div>
        </section>` : ''}
      ${list.length
        ? `<div class="grid">${list.map((v) => videoCard(v)).join('')}</div>`
        : emptyState({ title: 'Nenhum vídeo nesta categoria', text: 'Escolha outra categoria ou envie o primeiro vídeo.' })}
    </div>`;
}

function renderTrending() {
  document.title = 'Em alta — VoceTube';
  const score = (v) => viewsOf(v) / Math.pow((Date.now() - v.publishedAt) / DAY + 2, 1.2);
  const list = allVideos()
    .filter((v) => !v.isUpload && (view.trendCat === 'Tudo' || v.cat === view.trendCat))
    .sort((a, b) => score(b) - score(a));
  app().innerHTML = `
    <div class="page page--narrow">
      ${pageHead('Em alta', '<p class="muted">Os vídeos que mais crescem agora, considerando visualizações e data de publicação.</p>')}
      ${chipsHTML(['Tudo', ...CATEGORIES], view.trendCat, 'data-trend-cat')}
      <div class="rows">${list.map((v, i) => rowItem(v, { rank: i + 1, action: `<div class="row-item__action">${saveButton(v)}</div>` })).join('')}</div>
    </div>`;
}

function renderFollowing() {
  document.title = 'Seguindo — VoceTube';
  const keys = Store.data.following;
  if (!keys.length) {
    const suggestions = Object.keys(CHANNELS).filter((k) => k !== 'me');
    app().innerHTML = `
      <div class="page page--narrow">
        ${emptyState({ title: 'Você ainda não segue nenhum canal', text: 'Siga canais para ver os vídeos novos deles reunidos aqui.' })}
        <h2 class="shelf__title">Sugestões de canais</h2>
        <div class="channel-list">${suggestions.map(channelRow).join('')}</div>
      </div>`;
    return;
  }
  const list = allVideos().filter((v) => keys.includes(v.ch)).sort((a, b) => b.publishedAt - a.publishedAt);
  app().innerHTML = `
    <div class="page">
      ${pageHead('Seguindo')}
      <div class="following-row">
        ${keys.map((k) => `
          <a href="#/c/${k}" class="following-row__item">
            <span class="avatar avatar--xl" style="background:${CHANNELS[k].color}" aria-hidden="true">${CHANNELS[k].ini}</span>
            <span>${esc(CHANNELS[k].name)}</span>
          </a>`).join('')}
      </div>
      <h2 class="shelf__title">Mais recentes</h2>
      <div class="grid">${list.map((v) => videoCard(v)).join('')}</div>
    </div>`;
}

function channelRow(key) {
  const c = CHANNELS[key];
  return `
    <div class="channel-row">
      ${avatar(key, 'avatar--xl')}
      <div class="channel-row__text">
        <a href="#/c/${key}"><strong>${esc(c.name)}</strong></a>
        <span class="muted small">${c.handle} · ${fmtCount(followersOf(key))} seguidores · ${channelVideos(key).length} vídeos</span>
        <span class="muted small channel-row__about">${esc(c.about)}</span>
      </div>
      ${followButton(key)}
    </div>`;
}

function renderHistory() {
  document.title = 'Histórico — VoceTube';
  const entries = Store.data.history.map((h) => ({ h, v: getVideo(h.id) })).filter((x) => x.v);
  if (!entries.length) {
    app().innerHTML = `<div class="page page--narrow">${pageHead('Histórico')}${emptyState({ icon: ICON.clock, title: 'Seu histórico está vazio', text: 'Os vídeos que você assistir aparecem aqui, com o ponto onde parou.', action: '<a href="#/" class="pill-btn pill-btn--accent">Explorar vídeos</a>' })}</div>`;
    return;
  }
  const groups = {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (const e of entries) {
    const diff = today - new Date(e.h.at).setHours(0, 0, 0, 0);
    const label = diff <= 0 ? 'Hoje' : diff <= DAY ? 'Ontem' : diff < 7 * DAY ? 'Esta semana' : 'Mais antigos';
    (groups[label] ||= []).push(e);
  }
  app().innerHTML = `
    <div class="page page--narrow">
      ${pageHead('Histórico', `<button class="pill-btn" id="clearHistory">${ICON.trash}Limpar histórico</button>`)}
      ${Object.entries(groups).map(([label, list]) => `
        <section class="history-group">
          <h2 class="shelf__title">${label}</h2>
          <div class="rows">${list.map(({ v }) => rowItem(v, {
            action: `<div class="row-item__action"><button class="icon-btn icon-btn--sm" data-remove-history="${v.id}" aria-label="Remover do histórico" title="Remover">${ICON.close}</button></div>`
          })).join('')}</div>
        </section>`).join('')}
    </div>`;
}

function renderSaved() {
  document.title = 'Ver depois — VoceTube';
  const list = Store.data.saved.map(getVideo).filter(Boolean);
  const total = list.reduce((s, v) => s + v.dur, 0);
  app().innerHTML = `
    <div class="page page--narrow">
      ${pageHead('Ver depois', list.length ? `<p class="muted">${list.length} ${list.length === 1 ? 'vídeo' : 'vídeos'} · ${fmtTime(total)} no total</p>` : '')}
      ${list.length
        ? `<div class="rows">${list.map((v) => rowItem(v, {
            action: `<div class="row-item__action"><button class="icon-btn icon-btn--sm" data-save="${v.id}" aria-pressed="true" aria-label="Remover de Ver depois" title="Remover">${ICON.close}</button></div>`
          })).join('')}</div>`
        : emptyState({ icon: ICON.save, title: 'Nada salvo ainda', text: 'Use o botão de relógio nos vídeos para guardá-los e assistir mais tarde.' })}
    </div>`;
}

function renderLiked() {
  document.title = 'Curtidos — VoceTube';
  const list = Store.data.liked.map(getVideo).filter(Boolean);
  app().innerHTML = `
    <div class="page">
      ${pageHead('Vídeos curtidos', list.length ? `<p class="muted">${list.length} ${list.length === 1 ? 'vídeo' : 'vídeos'}</p>` : '')}
      ${list.length
        ? `<div class="grid">${list.map((v) => videoCard(v)).join('')}</div>`
        : emptyState({ icon: ICON.like, title: 'Você ainda não curtiu nenhum vídeo' })}
    </div>`;
}

function renderSearch(query) {
  document.title = `${query} — VoceTube`;
  $('#searchInput').value = query;
  const q = normalize(query);
  const words = q.split(/\s+/).filter(Boolean);

  const scoreVideo = (v) => {
    const title = normalize(v.title), other = normalize(`${CHANNELS[v.ch].name} ${v.cat} ${v.desc || ''}`);
    let s = 0;
    for (const w of words) {
      if (title.includes(w)) s += 3; else if (other.includes(w)) s += 1; else return 0;
    }
    return s;
  };
  let videos = allVideos().map((v) => ({ v, s: scoreVideo(v) })).filter((x) => x.s > 0);
  if (view.searchSort === 'relevance') videos.sort((a, b) => b.s - a.s || viewsOf(b.v) - viewsOf(a.v));
  if (view.searchSort === 'new') videos.sort((a, b) => b.v.publishedAt - a.v.publishedAt);
  if (view.searchSort === 'views') videos.sort((a, b) => viewsOf(b.v) - viewsOf(a.v));
  if (view.searchSort === 'short') videos.sort((a, b) => a.v.dur - b.v.dur);
  videos = videos.map((x) => x.v);

  const channels = Object.keys(CHANNELS).filter((k) =>
    k !== 'me' && words.every((w) => normalize(`${CHANNELS[k].name} ${CHANNELS[k].handle}`).includes(w)));

  const showV = view.searchType !== 'channels', showC = view.searchType !== 'videos';
  const count = (showV ? videos.length : 0) + (showC ? channels.length : 0);

  app().innerHTML = `
    <div class="page page--narrow">
      <div class="search-head">
        ${chipsHTML([{ value: 'all', label: 'Tudo' }, { value: 'videos', label: 'Vídeos' }, { value: 'channels', label: 'Canais' }], view.searchType, 'data-search-type')}
        <label class="select">
          <span class="sr-only">Ordenar resultados</span>
          <select id="searchSort">
            <option value="relevance">Relevância</option>
            <option value="new">Mais recentes</option>
            <option value="views">Mais vistos</option>
            <option value="short">Mais curtos</option>
          </select>
        </label>
      </div>
      <p class="muted small results-count">${count} ${count === 1 ? 'resultado' : 'resultados'} para “${esc(query)}”</p>
      ${showC && channels.length ? `<div class="channel-list">${channels.map(channelRow).join('')}</div>` : ''}
      ${showV && videos.length ? `<div class="rows">${videos.map((v) => rowItem(v, { action: `<div class="row-item__action">${saveButton(v)}</div>` })).join('')}</div>` : ''}
      ${count === 0 ? emptyState({ icon: ICON.search, title: 'Nenhum resultado', text: 'Confira a ortografia ou tente palavras mais gerais.' }) : ''}
    </div>`;
  $('#searchSort').value = view.searchSort;
}

function renderChannel(key) {
  const c = CHANNELS[key];
  if (!c) return renderNotFound();
  const mine = key === 'me';
  document.title = `${c.name} — VoceTube`;
  let list = channelVideos(key);
  if (view.channelSort === 'new') list.sort((a, b) => b.publishedAt - a.publishedAt);
  if (view.channelSort === 'popular') list.sort((a, b) => viewsOf(b) - viewsOf(a));
  if (view.channelSort === 'old') list.sort((a, b) => a.publishedAt - b.publishedAt);
  const totalViews = list.reduce((s, v) => s + viewsOf(v), 0);

  app().innerHTML = `
    <div class="page">
      <div class="channel-banner" style="--ch:${c.color}"></div>
      <div class="channel-head">
        <span class="avatar avatar--huge" style="background:${c.color}" aria-hidden="true">${c.ini}</span>
        <div class="channel-head__text">
          <h1>${esc(c.name)}</h1>
          <p class="muted">${c.handle} · ${fmtCount(followersOf(key))} seguidores · ${list.length} ${list.length === 1 ? 'vídeo' : 'vídeos'}</p>
          <p class="muted channel-head__about">${esc(c.about)}</p>
          <div class="channel-head__actions">
            ${mine ? `<button class="pill-btn pill-btn--accent" data-open="upload">${ICON.upload}Enviar vídeo</button>` : followButton(key)}
          </div>
        </div>
      </div>
      <div class="tabs" role="tablist">
        <button role="tab" class="tab" data-channel-tab="videos" aria-selected="${view.channelTab === 'videos'}">Vídeos</button>
        <button role="tab" class="tab" data-channel-tab="about" aria-selected="${view.channelTab === 'about'}">Sobre</button>
      </div>
      ${view.channelTab === 'about' ? `
        <div class="about-box">
          <h2 class="shelf__title">Descrição</h2>
          <p>${esc(c.about)}</p>
          <dl class="about-stats">
            <dt>Entrou</dt><dd>${c.joined}</dd>
            <dt>Seguidores</dt><dd>${followersOf(key).toLocaleString('pt-BR')}</dd>
            <dt>Visualizações</dt><dd>${totalViews.toLocaleString('pt-BR')}</dd>
            <dt>Vídeos</dt><dd>${list.length}</dd>
          </dl>
        </div>` : list.length ? `
        ${chipsHTML([{ value: 'new', label: 'Mais recentes' }, { value: 'popular', label: 'Populares' }, { value: 'old', label: 'Mais antigos' }], view.channelSort, 'data-channel-sort')}
        <div class="grid">${list.map((v) => videoCard(v, { showChannel: false, deletable: mine })).join('')}</div>`
        : emptyState({
            icon: ICON.upload,
            title: mine ? 'Você ainda não enviou vídeos' : 'Este canal ainda não tem vídeos',
            text: mine ? 'Envie um vídeo do seu computador: ele fica salvo neste navegador e toca de verdade no player.' : '',
            action: mine ? `<button class="pill-btn pill-btn--accent" data-open="upload">${ICON.upload}Enviar vídeo</button>` : ''
          })}
    </div>`;
}

function renderNotFound() {
  document.title = 'Página não encontrada — VoceTube';
  app().innerHTML = `<div class="page page--narrow">${emptyState({ title: 'Página não encontrada', text: 'O link pode estar errado ou o vídeo foi removido.', action: '<a href="#/" class="pill-btn pill-btn--accent">Voltar ao início</a>' })}</div>`;
}

/* ============ 5. Página do vídeo ============ */
let player = null;
let watchingId = null;

function commentsFor(v) {
  const start = hashCode(v.id) % COMMENT_POOL.length;
  const n = v.isUpload ? 0 : 3 + (hashCode(v.id + 'n') % 4);
  const samples = Array.from({ length: n }, (_, i) => {
    const c = COMMENT_POOL[(start + i) % COMMENT_POOL.length];
    return { ...c, id: `${v.id}-s${i}`, at: Math.max(v.publishedAt + (i + 1) * 3600000, Date.now() - c.days * DAY - i * 7200000) };
  });
  const mine = (Store.data.comments[v.id] || []).map((c) => ({ ...c, name: 'Você', ini: 'M', color: '#F59E0B', likes: 0, mine: true }));
  const all = [...mine, ...samples];
  const likesOfC = (c) => c.likes + (Store.has('commentLikes', c.id) ? 1 : 0);
  if (view.commentSort === 'top') all.sort((a, b) => (b.mine - a.mine) || likesOfC(b) - likesOfC(a));
  else all.sort((a, b) => b.at - a.at);
  return all.map((c) => ({ ...c, totalLikes: likesOfC(c) }));
}

function commentsHTML(v) {
  const list = commentsFor(v);
  return `
    <div class="comments__head">
      <h2>${list.length} comentários</h2>
      <label class="select">
        <span class="sr-only">Ordenar comentários</span>
        <select id="commentSort">
          <option value="top">Mais curtidos</option>
          <option value="new">Mais recentes</option>
        </select>
      </label>
    </div>
    <form class="comment-form" id="commentForm">
      <span class="avatar avatar--me" aria-hidden="true">M</span>
      <label class="sr-only" for="commentInput">Adicionar um comentário</label>
      <input id="commentInput" placeholder="Adicione um comentário…" autocomplete="off" maxlength="500">
      <button type="submit" class="pill-btn pill-btn--accent" disabled id="commentSend">Comentar</button>
    </form>
    <div class="comment-list">
      ${list.map((c) => `
        <div class="comment">
          <span class="avatar" style="background:${c.color}" aria-hidden="true">${esc(c.ini)}</span>
          <div class="comment__body">
            <span class="comment__head"><strong>${esc(c.name)}</strong><span class="muted">${ago(c.at)}</span></span>
            <p>${esc(c.text)}</p>
            <div class="comment__actions">
              <button class="mini-btn" data-comment-like="${c.id}" aria-pressed="${Store.has('commentLikes', c.id)}" aria-label="Curtir comentário">${ICON.like}<span>${c.totalLikes || ''}</span></button>
              ${c.mine ? `<button class="mini-btn" data-comment-delete="${c.id}">Excluir</button>` : ''}
            </div>
          </div>
        </div>`).join('')}
    </div>`;
}

function relatedFor(v) {
  const others = allVideos().filter((x) => x.id !== v.id);
  if (view.relatedFilter === 'channel') return others.filter((x) => x.ch === v.ch);
  if (view.relatedFilter === 'cat') return others.filter((x) => x.cat === v.cat);
  return others.sort((a, b) => (b.cat === v.cat) - (a.cat === v.cat) || (b.ch === v.ch) - (a.ch === v.ch));
}

function relatedHTML(v) {
  const list = relatedFor(v);
  return `
    ${chipsHTML([{ value: 'all', label: 'Tudo' }, { value: 'channel', label: `De ${CHANNELS[v.ch].name}` }, { value: 'cat', label: v.cat }], view.relatedFilter, 'data-related')}
    <div class="related__list">
      ${list.length ? list.map((r) => `
        <a href="#/v/${r.id}" class="related-item">
          ${thumb(r)}
          <div class="related-item__text">
            <span class="related-item__title">${esc(r.title)}</span>
            <span class="card__meta">${esc(CHANNELS[r.ch].name)}</span>
            <span class="card__meta">${fmtCount(viewsOf(r))} · ${ago(r.publishedAt)}</span>
          </div>
        </a>`).join('') : '<p class="muted">Nenhum outro vídeo aqui.</p>'}
    </div>`;
}

function actionsHTML(v) {
  const liked = Store.has('liked', v.id), disliked = Store.has('disliked', v.id), saved = Store.has('saved', v.id);
  return `
    <div class="like-group">
      <button class="like-btn" data-like aria-pressed="${liked}" aria-label="Gostei">${ICON.like}<span>${fmtCount(likesOf(v))}</span></button>
      <span class="like-sep" aria-hidden="true"></span>
      <button class="like-btn like-btn--icon" data-dislike aria-pressed="${disliked}" aria-label="Não gostei">${ICON.dislike}</button>
    </div>
    <button class="pill-btn" data-share>${ICON.share}<span>Compartilhar</span></button>
    <button class="pill-btn" data-save="${v.id}" aria-pressed="${saved}">${saved ? ICON.check : ICON.save}<span>${saved ? 'Salvo' : 'Salvar'}</span></button>
    ${v.isUpload ? `<button class="pill-btn" data-download>${ICON.download}<span>Baixar</span></button>` : ''}`;
}

async function renderWatch(id, params) {
  const v = getVideo(id);
  if (!v) return renderNotFound();
  watchingId = id;
  document.title = `${v.title} — VoceTube`;

  /* Conta a visualização e coloca no histórico */
  Store.data.views[id] = (Store.data.views[id] || 0) + 1;
  const prev = Store.historyEntry(id);
  Store.touchHistory(id);

  const c = CHANNELS[v.ch];
  app().innerHTML = `
    <div class="watch ${Store.data.theater ? 'is-theater' : ''}">
      <div class="watch__player" id="playerMount"><div class="player player--loading"></div></div>
      <div class="watch__main">
        <h1 class="watch__title">${esc(v.title)}</h1>
        <div class="watch__row">
          <div class="channel">
            ${avatar(v.ch, 'avatar--lg')}
            <div class="channel__info">
              <a href="#/c/${v.ch}" class="channel__name">${esc(c.name)}</a>
              <span class="muted small" data-followers>${fmtCount(followersOf(v.ch))} seguidores</span>
            </div>
            ${followButton(v.ch)}
          </div>
          <div class="actions" id="watchActions">${actionsHTML(v)}</div>
        </div>
        <div class="description" id="description">
          <strong>${viewsOf(v).toLocaleString('pt-BR')} visualizações · ${ago(v.publishedAt)} · <a href="#/" data-goto-cat="${v.cat}" class="tag">#${esc(v.cat)}</a></strong>
          <p class="description__text">${linkTimestamps(esc(v.desc || 'Sem descrição.'))}</p>
          <button class="description__toggle" id="descToggle" aria-expanded="false">mais</button>
        </div>
        <section class="comments" id="comments" aria-label="Comentários">${commentsHTML(v)}</section>
      </div>
      <aside class="related" id="related" aria-label="Próximos vídeos">${relatedHTML(v)}</aside>
    </div>`;
  $('#commentSort').value = view.commentSort;

  /* Esconde o botão "mais" se a descrição for curta */
  const descText = $('.description__text');
  if (descText.scrollHeight <= descText.clientHeight + 2) $('#descToggle').hidden = true;

  /* Vídeo enviado: busca o arquivo salvo no navegador */
  if (v.isUpload) {
    const blob = await VideoDB.get(id);
    if (watchingId !== id) return; // usuário já trocou de página
    if (!blob) {
      $('#playerMount').innerHTML = `<div class="player player--error"><p>O arquivo deste vídeo não está mais salvo neste navegador.</p></div>`;
      return;
    }
    v.src = URL.createObjectURL(blob);
  }

  let startAt = Number(params.get('t')) || 0;
  if (!startAt && prev && prev.pos > 10 && prev.pos < v.dur - 10) {
    startAt = prev.pos;
    toast(`Continuando de onde você parou (${fmtTime(startAt)})`);
  }

  const next = relatedFor(v)[0];
  let lastSave = 0;
  player = createPlayer($('#playerMount'), v, {
    startAt,
    hasNext: Boolean(next),
    nextVideo: next,
    onNext: () => { if (next) location.hash = `#/v/${next.id}`; },
    onTheater: toggleTheater,
    onTime: (t, d) => {
      if (d && !v.dur) v.dur = d;
      if (Date.now() - lastSave > 4000) { lastSave = Date.now(); Store.setPosition(id, t); }
    },
    onEnded: () => Store.setPosition(id, v.dur)
  });
  player.objectUrl = v.src;
  player.play(); // começa a tocar sozinho (o navegador pode bloquear vídeos com som)
}

/* Transforma "01:40" na descrição em link que pula para aquele tempo */
function linkTimestamps(html) {
  return html.replace(/\b(\d{1,2}):(\d{2})\b/g, (m, mm, ss) =>
    `<button class="timestamp" data-seek="${Number(mm) * 60 + Number(ss)}">${m}</button>`);
}

function toggleTheater() {
  Store.data.theater = !Store.data.theater;
  Store.save();
  $('.watch')?.classList.toggle('is-theater', Store.data.theater);
}

function destroyPlayer() {
  if (!player) return;
  if (watchingId) Store.setPosition(watchingId, player.time);
  player.destroy();
  const url = player.objectUrl;
  if (url?.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 1000); // libera a memória do arquivo
  player = null;
}

/* Atualiza só a parte que mudou, sem recarregar o player */
function refreshWatchPart(part) {
  const v = getVideo(watchingId);
  if (!v) return;
  if (part === 'actions') $('#watchActions').innerHTML = actionsHTML(v);
  if (part === 'comments') { $('#comments').innerHTML = commentsHTML(v); $('#commentSort').value = view.commentSort; }
  if (part === 'related') $('#related').innerHTML = relatedHTML(v);
  if (part === 'follow') {
    $('.watch [data-follow]').outerHTML = followButton(v.ch);
    $('[data-followers]').textContent = `${fmtCount(followersOf(v.ch))} seguidores`;
  }
}

/* ============ 6. Rotas ============ */
function parseRoute() {
  const raw = location.hash.slice(1) || '/';
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, params: new URLSearchParams(query) };
}

function route() {
  destroyPlayer();
  watchingId = null;
  const { parts, params } = parseRoute();
  const [page, arg] = parts;
  const isWatch = page === 'v';

  document.body.classList.toggle('is-watch', isWatch);
  closeDrawer();
  closePopovers();

  let active = 'home';
  if (!page) renderHome();
  else if (page === 'alta') { active = 'alta'; renderTrending(); }
  else if (page === 'seguindo') { active = 'seguindo'; renderFollowing(); }
  else if (page === 'historico') { active = 'historico'; renderHistory(); }
  else if (page === 'depois') { active = 'depois'; renderSaved(); }
  else if (page === 'curtidos') { active = 'curtidos'; renderLiked(); }
  else if (page === 'busca' && arg) { active = ''; renderSearch(decodeURIComponent(arg)); }
  else if (page === 'c' && arg) { active = arg === 'me' ? 'me' : ''; renderChannel(arg); }
  else if (isWatch && arg) { active = ''; renderWatch(arg, params); }
  else renderNotFound();

  $$('[data-route]').forEach((a) => {
    const on = a.dataset.route === active;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (page !== 'busca') $('#searchInput').value = '';
  window.scrollTo(0, 0);
  app().focus({ preventScroll: true });
}

/* Redesenha a página atual sem mudar de endereço */
function rerender() {
  const { parts } = parseRoute();
  if (parts[0] === 'v') return; // a página do vídeo é atualizada por partes
  const y = window.scrollY;
  route();
  window.scrollTo(0, y);
}

/* ============ Cliques em toda a página (delegação) ============ */
document.addEventListener('click', async (e) => {
  const t = e.target.closest('button, a');
  if (!t) return;
  const d = t.dataset;

  if (d.homeCat) { view.homeCat = d.homeCat; return renderHome(); }
  if (d.trendCat) { view.trendCat = d.trendCat; return renderTrending(); }
  if (d.searchType) { view.searchType = d.searchType; return rerender(); }
  if (d.channelTab) { view.channelTab = d.channelTab; return rerender(); }
  if (d.channelSort) { view.channelSort = d.channelSort; return rerender(); }
  if (d.related) { view.relatedFilter = d.related; return refreshWatchPart('related'); }
  if (d.gotoCat) { e.preventDefault(); view.homeCat = d.gotoCat; location.hash = '#/'; return; }
  if (d.seek && player) { player.seek(Number(d.seek)); player.play(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  if (d.open) { closePopovers(); return openDialog(d.open); }

  if (d.save) {
    const added = Store.toggle('saved', d.save);
    toast(added ? 'Salvo em Ver depois' : 'Removido de Ver depois');
    return watchingId && $('#watchActions')?.contains(t) ? refreshWatchPart('actions') : rerender();
  }
  if (d.follow) {
    const added = Store.toggle('following', d.follow);
    toast(added ? `Você agora segue ${CHANNELS[d.follow].name}` : `Você deixou de seguir ${CHANNELS[d.follow].name}`);
    renderChannelList();
    return watchingId ? refreshWatchPart('follow') : rerender();
  }
  if ('like' in d || 'dislike' in d) {
    const id = watchingId;
    if ('like' in d) { Store.remove('disliked', id); Store.toggle('liked', id); }
    else { Store.remove('liked', id); Store.toggle('disliked', id); }
    return refreshWatchPart('actions');
  }
  if ('share' in d) return openShare();
  if ('download' in d) return downloadUpload(watchingId);

  if (d.removeHistory) {
    Store.data.history = Store.data.history.filter((h) => h.id !== d.removeHistory);
    Store.save(); toast('Removido do histórico');
    return rerender();
  }
  if (t.id === 'clearHistory') {
    const ok = await confirmBox({ title: 'Limpar todo o histórico?', text: 'Esta ação não pode ser desfeita. O ponto onde você parou em cada vídeo também será apagado.', ok: 'Limpar' });
    if (ok) { Store.data.history = []; Store.save(); toast('Histórico limpo'); rerender(); }
    return;
  }
  if (d.deleteUpload) return deleteUpload(d.deleteUpload);

  if (d.commentLike) { Store.toggle('commentLikes', d.commentLike); return refreshWatchPart('comments'); }
  if (d.commentDelete) {
    const list = Store.data.comments[watchingId] || [];
    Store.data.comments[watchingId] = list.filter((c) => c.id !== d.commentDelete);
    Store.save(); toast('Comentário excluído');
    return refreshWatchPart('comments');
  }
  if (t.id === 'descToggle') {
    const open = $('#description').classList.toggle('is-open');
    t.textContent = open ? 'mostrar menos' : 'mais';
    t.setAttribute('aria-expanded', open);
  }
});

/* Formulários e seletores dentro das páginas */
document.addEventListener('change', (e) => {
  if (e.target.id === 'searchSort') { view.searchSort = e.target.value; rerender(); }
  if (e.target.id === 'commentSort') { view.commentSort = e.target.value; refreshWatchPart('comments'); }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'commentInput') $('#commentSend').disabled = !e.target.value.trim();
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'commentForm') return;
  e.preventDefault();
  const text = $('#commentInput').value.trim();
  if (!text) return;
  (Store.data.comments[watchingId] ||= []).unshift({ id: 'c' + Date.now().toString(36), text, at: Date.now() });
  Store.save();
  view.commentSort = 'top';
  refreshWatchPart('comments');
  toast('Comentário publicado');
});

async function deleteUpload(id) {
  const v = getVideo(id);
  const ok = await confirmBox({ title: 'Excluir este vídeo?', text: `“${v.title}” será apagado deste navegador. Esta ação não pode ser desfeita.`, ok: 'Excluir' });
  if (!ok) return;
  await VideoDB.remove(id);
  const d = Store.data;
  d.uploads = d.uploads.filter((u) => u.id !== id);
  ['saved', 'liked', 'disliked'].forEach((l) => { d[l] = d[l].filter((x) => x !== id); });
  d.history = d.history.filter((h) => h.id !== id);
  delete d.comments[id];
  Store.save();
  toast('Vídeo excluído');
  if (watchingId === id) location.hash = '#/c/me'; else rerender();
}

async function downloadUpload(id) {
  const v = getVideo(id);
  const blob = await VideoDB.get(id);
  if (!blob) return toast('Arquivo não encontrado');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = v.fileName || `${v.title}.mp4`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ============ 7. Topo: menu lateral, notificações, conta, tema ============ */
const scrim = document.createElement('div');
scrim.className = 'scrim';
document.body.append(scrim);
scrim.addEventListener('click', closeDrawer);

const isDrawerMode = () => document.body.classList.contains('is-watch') || window.matchMedia('(max-width: 1000px)').matches;

function closeDrawer() {
  document.body.classList.remove('drawer-open');
  if (isDrawerMode()) $('#menuBtn').setAttribute('aria-expanded', 'false');
}

$('#menuBtn').addEventListener('click', () => {
  if (isDrawerMode()) {
    const open = document.body.classList.toggle('drawer-open');
    $('#menuBtn').setAttribute('aria-expanded', open);
  } else {
    Store.data.sidebarMini = !Store.data.sidebarMini;
    Store.save();
    document.body.classList.toggle('sidebar-mini', Store.data.sidebarMini);
    $('#menuBtn').setAttribute('aria-expanded', !Store.data.sidebarMini);
  }
});

function renderChannelList() {
  const keys = Store.data.following;
  $('#channelList').innerHTML = keys.length
    ? keys.map((k) => `
        <a href="#/c/${k}" class="nav-item">
          <span class="avatar avatar--xs" style="background:${CHANNELS[k].color}" aria-hidden="true">${CHANNELS[k].ini}</span>
          <span>${esc(CHANNELS[k].name)}</span>
        </a>`).join('')
    : '<p class="sidebar__hint">Os canais que você seguir aparecem aqui.</p>';
}

/* Pop-ups do topo (notificações e conta) */
function closePopovers() {
  $$('.popover').forEach((p) => { p.hidden = true; });
  $$('[aria-haspopup="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}
function togglePopover(btn, panel) {
  const open = panel.hidden;
  closePopovers();
  panel.hidden = !open;
  btn.setAttribute('aria-expanded', open);
  return open;
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.popover-wrap')) closePopovers();
});

function notifications() {
  const keys = Store.data.following.length ? Store.data.following : Object.keys(CHANNELS);
  return allVideos()
    .filter((v) => keys.includes(v.ch) || v.isUpload)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 8);
}
function renderNotifBadge() {
  const unread = notifications().filter((v) => v.publishedAt > Store.data.notifSeenAt).length;
  const badge = $('#notifBadge');
  badge.hidden = unread === 0;
  badge.textContent = unread > 9 ? '9+' : unread;
  $('#notifBtn').setAttribute('aria-label', unread ? `Notificações, ${unread} novas` : 'Notificações');
}
$('#notifBtn').addEventListener('click', () => {
  const list = notifications();
  $('#notifList').innerHTML = list.length ? list.map((v) => `
    <a href="#/v/${v.id}" class="notif ${v.publishedAt > Store.data.notifSeenAt ? 'is-new' : ''}">
      <span class="avatar avatar--sm" style="background:${CHANNELS[v.ch].color}" aria-hidden="true">${CHANNELS[v.ch].ini}</span>
      <span class="notif__text">
        <span>${v.isUpload ? 'Seu vídeo foi publicado' : `${esc(CHANNELS[v.ch].name)} publicou`}: <strong>${esc(v.title)}</strong></span>
        <span class="muted small">${ago(v.publishedAt)}</span>
      </span>
      ${thumb(v)}
    </a>`).join('') : '<p class="muted popover__empty">Nenhuma notificação.</p>';
  if (togglePopover($('#notifBtn'), $('#notifPanel'))) {
    Store.data.notifSeenAt = Date.now();
    Store.save();
    renderNotifBadge();
  }
});
$('#accountBtn').addEventListener('click', () => togglePopover($('#accountBtn'), $('#accountPanel')));

/* Tema claro/escuro */
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => Store.data.theme || (systemDark.matches ? 'dark' : 'light');
function applyTheme() {
  const t = currentTheme();
  document.documentElement.dataset.theme = t;
  $('#themeLabel').textContent = `Aparência: ${t === 'dark' ? 'escuro' : 'claro'}`;
}
$('#themeBtn').addEventListener('click', () => {
  Store.data.theme = currentTheme() === 'dark' ? 'light' : 'dark';
  Store.save();
  applyTheme();
});
systemDark.addEventListener('change', applyTheme);

$('#resetBtn').addEventListener('click', async () => {
  closePopovers();
  const ok = await confirmBox({
    title: 'Apagar todos os seus dados?',
    text: 'Histórico, curtidas, comentários, canais seguidos e vídeos enviados serão apagados deste navegador. Esta ação não pode ser desfeita.',
    ok: 'Apagar tudo'
  });
  if (!ok) return;
  await VideoDB.clear();
  Store.reset();
  location.hash = '#/';
  location.reload();
});

/* ============ 8. Busca: autocompletar e voz ============ */
const isWatching = () => location.hash.startsWith('#/v/');
function goSearch(text) {
  const q = text.trim();
  if (!q) return;
  view.searchType = 'all';
  location.hash = `#/busca/${encodeURIComponent(q)}`;
}

function buildSuggestions() {
  return [
    ...allVideos().map((v) => ({ label: v.title, type: 'Vídeo', id: v.id })),
    ...Object.entries(CHANNELS).filter(([k]) => k !== 'me').map(([key, c]) => ({ label: c.name, type: 'Canal', key })),
    ...CATEGORIES.map((c) => ({ label: c, type: 'Categoria' }))
  ];
}

const SUGGESTION_ICONS = {
  'Vídeo': '<path d="M8 5v14l11-7z"/>',
  'Canal': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'Categoria': '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  'Pesquisar': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'
};

let skipNextSubmit = false;
const searchAC = new autoComplete({
  selector: '#searchInput',
  submit: true,
  threshold: 1,
  debounce: 100,
  data: {
    src: async () => buildSuggestions(),   // função: inclui vídeos enviados depois
    keys: ['label'],
    cache: false
  },
  searchEngine: (query, record) => {
    const q = normalize(query.trim());
    if (!q) return;
    const i = normalize(record).indexOf(q);
    if (i < 0) return;
    return esc(record.slice(0, i)) + '<mark>' + esc(record.slice(i, i + q.length)) + '</mark>' + esc(record.slice(i + q.length));
  },
  resultsList: {
    class: 'suggestions',
    maxResults: 8,
    noResults: true,
    element: (list, data) => {
      if (!data.results.length) {
        const li = document.createElement('li');
        li.className = 'suggestions__empty';
        li.textContent = `Nenhuma sugestão. Aperte Enter para pesquisar “${data.query}”.`;
        list.append(li);
      }
    }
  },
  resultItem: {
    class: 'suggestion',
    element: (item, data) => {
      const { type } = data.value;
      item.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">${SUGGESTION_ICONS[type]}</svg>
        <span class="suggestion__text">${data.match}</span>
        <span class="suggestion__type">${type}</span>`;
    }
  },
  events: {
    input: {
      selection: (event) => {
        const item = event.detail.selection.value;
        if (!item) return;
        skipNextSubmit = true;
        searchAC.close();
        searchAC.input.blur();
        if (item.type === 'Vídeo') location.hash = `#/v/${item.id}`;
        else if (item.type === 'Canal') location.hash = `#/c/${item.key}`;
        else { view.homeCat = item.label; if (location.hash === '#/' || !location.hash) renderHome(); else location.hash = '#/'; }
      }
    }
  }
});

$('#searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (skipNextSubmit) { skipNextSubmit = false; return; }
  searchAC.close();
  $('#searchInput').blur();
  goSearch($('#searchInput').value);
});
document.addEventListener('click', (e) => { if (!e.target.closest('.search')) searchAC.close(); });

/* Pesquisa por voz (Chrome e Edge) */
$('#voiceBtn').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('Pesquisa por voz não é suportada neste navegador');
  const rec = new SR();
  rec.lang = 'pt-BR';
  rec.interimResults = false;
  const btn = $('#voiceBtn');
  btn.classList.add('is-listening');
  toast('Pode falar…');
  rec.onresult = (ev) => {
    const text = ev.results[0][0].transcript;
    $('#searchInput').value = text;
    goSearch(text);
  };
  rec.onerror = () => toast('Não foi possível ouvir. Verifique a permissão do microfone.');
  rec.onend = () => btn.classList.remove('is-listening');
  rec.start();
});

/* ============ 9. Janelas ============ */
function openDialog(name) {
  if (name === 'upload') return openUpload();
  if (name === 'shortcuts') return $('#shortcutsDialog').showModal();
}
$$('dialog').forEach((dlg) => {
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
  });
});

/* ----- Enviar vídeo ----- */
let pendingUpload = null;

function openUpload() {
  pendingUpload = null;
  $('#uploadForm').reset();
  $('#upCat').innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join('');
  $('#uploadPreview').hidden = true;
  $('#dropzone').hidden = false;
  $('#uploadError').hidden = true;
  $('#upTitleCount').textContent = '0';
  $('#uploadSubmit').disabled = false;
  $('#uploadDialog').showModal();
}

function uploadError(msg) {
  const el = $('#uploadError');
  el.textContent = msg;
  el.hidden = !msg;
}

/* Lê duração e gera uma miniatura a partir de um quadro do vídeo */
function inspectVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.muted = true;
    vid.playsInline = true;
    vid.src = url;
    const cleanup = () => { vid.removeAttribute('src'); vid.load(); URL.revokeObjectURL(url); };
    const fail = () => { vid.onerror = null; cleanup(); reject(new Error('formato')); };
    vid.onerror = fail;
    vid.onloadedmetadata = () => {
      vid.currentTime = Math.min(1, (vid.duration || 2) / 3);
    };
    vid.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 480; canvas.height = 270;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 480, 270);
      const scale = Math.min(480 / vid.videoWidth, 270 / vid.videoHeight) || 1;
      const w = vid.videoWidth * scale, h = vid.videoHeight * scale;
      ctx.drawImage(vid, (480 - w) / 2, (270 - h) / 2, w, h);
      let thumbUrl = null;
      try { thumbUrl = canvas.toDataURL('image/jpeg', 0.72); } catch { /* ignora */ }
      const dur = vid.duration;
      vid.onerror = null;
      cleanup();
      resolve({ dur: Number.isFinite(dur) ? dur : 0, thumb: thumbUrl });
    };
    setTimeout(() => reject(new Error('tempo')), 15000);
  });
}

async function handleFile(file) {
  uploadError('');
  if (!file) return;
  if (!file.type.startsWith('video/')) return uploadError('Esse arquivo não é um vídeo. Escolha um MP4, WebM ou MOV.');
  $('#dropText').textContent = 'Processando o vídeo…';
  try {
    const info = await inspectVideo(file);
    pendingUpload = { file, ...info };
    $('#uploadThumb').src = info.thumb || '';
    $('#uploadFileName').textContent = file.name;
    $('#uploadFileInfo').textContent = `${fmtTime(info.dur)} · ${(file.size / 1048576).toFixed(1).replace('.', ',')} MB`;
    $('#uploadPreview').hidden = false;
    $('#dropzone').hidden = true;
    if (!$('#upTitle').value) {
      $('#upTitle').value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 100);
      $('#upTitleCount').textContent = $('#upTitle').value.length;
    }
  } catch {
    uploadError('O navegador não conseguiu abrir esse vídeo. Tente um arquivo MP4 (H.264).');
  } finally {
    $('#dropText').textContent = 'Escolha um vídeo do seu computador';
  }
}

$('#fileInput').addEventListener('change', (e) => handleFile(e.target.files[0]));
const dz = $('#dropzone');
['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove('is-over')));
dz.addEventListener('drop', (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });
$('#upTitle').addEventListener('input', (e) => { $('#upTitleCount').textContent = e.target.value.length; });

$('#uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!pendingUpload) return uploadError('Escolha um arquivo de vídeo antes de publicar.');
  const title = $('#upTitle').value.trim();
  if (!title) { $('#upTitle').focus(); return uploadError('Escreva um título para o vídeo.'); }

  $('#uploadSubmit').disabled = true;
  const id = 'u' + Date.now().toString(36);
  const saved = await VideoDB.put(id, pendingUpload.file);
  Store.data.uploads.unshift({
    id, title,
    desc: $('#upDesc').value.trim(),
    cat: $('#upCat').value,
    dur: pendingUpload.dur,
    thumb: pendingUpload.thumb,
    fileName: pendingUpload.file.name,
    created: Date.now()
  });
  Store.save();
  $('#uploadDialog').close();
  toast(saved ? 'Vídeo publicado' : 'Vídeo publicado só nesta sessão (o navegador não permitiu salvar o arquivo)');
  renderNotifBadge();
  location.hash = `#/v/${id}`;
});

/* ----- Compartilhar ----- */
function shareUrl(withTime) {
  const base = location.href.split('#')[0];
  const t = withTime && player ? Math.floor(player.time) : 0;
  return `${base}#/v/${watchingId}${t ? `?t=${t}` : ''}`;
}
function openShare() {
  $('#shareAtTime').checked = false;
  $('#shareTime').textContent = fmtTime(player ? player.time : 0);
  $('#shareLink').value = shareUrl(false);
  $('#shareDialog').showModal();
  $('#shareLink').select();
}
$('#shareAtTime').addEventListener('change', (e) => { $('#shareLink').value = shareUrl(e.target.checked); });
$('#copyLinkBtn').addEventListener('click', async () => {
  const input = $('#shareLink');
  try { await navigator.clipboard.writeText(input.value); }
  catch { input.select(); document.execCommand('copy'); }
  toast('Link copiado');
  $('#shareDialog').close();
});

/* ============ 10. Atalhos de teclado e início ============ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePopovers(); closeDrawer(); }
  const el = document.activeElement;
  const typing = el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
  if (typing || document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === '/') { e.preventDefault(); $('#searchInput').focus(); return; }
  if (e.key === '?') { $('#shortcutsDialog').showModal(); return; }
  if (!player) return;

  const onButton = el && ['BUTTON', 'A'].includes(el.tagName) && !el.closest('.player');
  const key = e.key.toLowerCase();
  if ((key === ' ' && !onButton) || key === 'k') { e.preventDefault(); player.toggle(); }
  else if (key === 'j') player.seekBy(-10);
  else if (key === 'l') player.seekBy(10);
  else if (e.key === 'ArrowLeft') { e.preventDefault(); player.seekBy(-5); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); player.seekBy(5); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); player.setVolume((Store.data.muted ? 0 : Store.data.volume) + 0.05); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); player.setVolume((Store.data.muted ? 0 : Store.data.volume) - 0.05); }
  else if (key === 'm') player.toggleMute();
  else if (key === 'f') player.fullscreen();
  else if (key === 't') toggleTheater();
  else if (e.key === 'N' && e.shiftKey) { const n = relatedFor(getVideo(watchingId))[0]; if (n) location.hash = `#/v/${n.id}`; }
  else if (/^[0-9]$/.test(e.key)) player.seek((Number(e.key) / 10) * player.duration);
});

/* Salva o ponto do vídeo ao fechar a aba */
window.addEventListener('beforeunload', () => { if (player && watchingId) Store.setPosition(watchingId, player.time); });

/* Ao mudar o tamanho da tela, garante que o menu lateral não fique preso aberto */
window.addEventListener('resize', debounce(() => { if (!isDrawerMode()) document.body.classList.remove('drawer-open'); }, 150));

window.addEventListener('hashchange', route);

/* Início */
document.body.classList.toggle('sidebar-mini', Store.data.sidebarMini);
applyTheme();

/* Busca os vídeos no back-end (api.js) e só então desenha o site */
app().innerHTML = '<p class="muted" style="padding:24px">Carregando vídeos…</p>';
VideoApi.load().then((ok) => {
  renderChannelList();
  renderNotifBadge();
  route();
  if (!ok) toast('Servidor fora do ar: mostrando vídeos de exemplo');
});
