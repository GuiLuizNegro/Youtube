/* =========================================================
   VOCETUBE — Shorts (vídeos curtos na vertical com rolagem infinita)

   Como funciona
   - A página #/shorts mostra um Short por vez, em tela cheia. Role (mouse, dedo,
     setas do teclado ou botões) para passar para o próximo.
   - A lista nunca acaba: quando o usuário chega perto do fim, mais Shorts são
     adicionados (a lista de exemplo é embaralhada de novo a cada volta, sem repetir
     o mesmo Short em seguida). Shorts muito antigos saem da tela para poupar memória.
   - Só o Short que está na tela toca. Como no YouTube, ele repete até o usuário passar.
   - Os Shorts de exemplo (js/shorts-data.js) são demonstrações: foto com leve movimento
     de câmera e barra de progresso. Vídeos enviados com até 60 s tocam de verdade.
   - Curtir, não gostei, inscrever-se e comentários usam o mesmo estado do resto do site
     (Store), então ficam salvos no servidor.
   ========================================================= */

const SH_ICON = {
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.2 7.6L3.5 21l1.4-5A8.5 8.5 0 1 1 21 12z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 6 6M22 9l-6 6"/></svg>'
};

let shorts = null;   // estado da página aberta (null = fora da página Shorts)

/* ---------- Dados ---------- */

/* Vídeos enviados com até 60 s (tocam de verdade) + Shorts de exemplo */
function shortPool() {
  const uploads = Store.data.uploads
    .filter((u) => u.dur && u.dur <= 60)
    .map((u) => ({ id: u.id, ch: 'me', title: u.title, tags: [], dur: u.dur, likes: 0, real: true, thumb: u.thumb || '', publishedAt: u.created }));
  const samples = SHORTS
    .filter((s) => CHANNELS[s.ch])
    .map((s) => ({ ...s, real: false, publishedAt: BOOT_TIME - s.days * DAY }));
  return [...uploads, ...samples];
}

/* Os comentários do site esperam um "vídeo" com id, publishedAt e isUpload */
const shortAsVideo = (it) => ({ id: it.id, isUpload: Boolean(it.real), publishedAt: it.publishedAt || BOOT_TIME });
const shLikes = (it) => it.likes + (Store.has('liked', it.id) ? 1 : 0);

/* Fila infinita: a 1ª volta segue a ordem da lista (começando pelo Short pedido);
   as próximas voltas são embaralhadas e nunca repetem o Short anterior em seguida. */
function shQueue(pool, startId) {
  let round = [];
  let last = null;
  let first = true;
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return {
    next() {
      if (!round.length) {
        if (first) {
          const at = Math.max(0, pool.findIndex((p) => p.id === startId));
          round = [...pool.slice(at), ...pool.slice(0, at)];
          first = false;
        } else {
          round = shuffle(pool);
          if (round.length > 1 && round[0].id === last) round.push(round.shift());
        }
      }
      const it = round.shift();
      last = it.id;
      return it;
    }
  };
}

/* ---------- HTML ---------- */

function shRailHTML(it) {
  const liked = Store.has('liked', it.id);
  const disliked = Store.has('disliked', it.id);
  const likes = shLikes(it);
  const comments = commentsFor(shortAsVideo(it)).length;
  return `
    <button class="short__act" data-s-like aria-pressed="${liked}" aria-label="Curtir">
      <span class="ico">${ICON.like}</span><b>${likes ? fmtCount(likes) : 'Curtir'}</b>
    </button>
    <button class="short__act" data-s-dislike aria-pressed="${disliked}" aria-label="Não gostei">
      <span class="ico">${ICON.dislike}</span><b>Não gostei</b>
    </button>
    <button class="short__act" data-s-comments aria-label="Comentários">
      <span class="ico">${SH_ICON.comment}</span><b>${comments}</b>
    </button>
    <button class="short__act" data-s-share aria-label="Compartilhar">
      <span class="ico">${ICON.share}</span><b>Compartilhar</b>
    </button>`;
}

function shSlideHTML(it) {
  const c = CHANNELS[it.ch];
  const on = Store.has('following', it.ch);
  const media = it.real
    ? `<div class="short__bg" style="background-image:url('${esc(it.thumb)}')"></div>
       <video class="short__video" src="${esc(VideoApi.urlDoVideo(it.id))}" ${it.thumb ? `poster="${esc(it.thumb)}"` : ''} loop playsinline preload="metadata"></video>`
    : `<img class="short__img" src="${esc(it.img)}" alt="" draggable="false" style="object-position:${esc(it.focus || '50% 50%')}">`;
  return `
    <section class="short" data-id="${esc(it.id)}" aria-label="${esc(it.title)}">
      <div class="short__stage">
        ${media}
        <div class="short__shade"></div>
        ${it.real ? '' : '<span class="short__tag">Demonstração</span>'}
        ${it.real ? `<button class="short__mute" data-s-mute aria-label="Silenciar">${Store.data.muted ? SH_ICON.mute : SH_ICON.volume}</button>` : ''}
        <button class="short__tap" data-s-tap aria-label="Pausar ou reproduzir"></button>
        <span class="short__pause-ind" aria-hidden="true">${SH_ICON.play}</span>
        <div class="short__info">
          <div class="short__who">
            <a href="#/c/${it.ch}" class="short__channel">
              <span class="avatar avatar--xs${avClass(c)}" style="${avStyle(c)}" aria-hidden="true">${avText(c)}</span>
              <span>${esc(c.handle)}</span>
            </a>
            ${it.ch === 'me' ? '' : `<button class="follow-btn short__follow ${on ? 'is-following' : ''}" data-follow="${it.ch}" aria-pressed="${on}">${on ? 'Inscrito' : 'Inscrever-se'}</button>`}
          </div>
          <h2 class="short__title">${esc(it.title)}</h2>
          ${it.tags && it.tags.length ? `<p class="short__tags">${it.tags.map((t) => `#${esc(t)}`).join(' ')}</p>` : ''}
        </div>
        <div class="short__bar" data-s-bar role="slider" aria-label="Posição do Short" aria-valuemin="0" aria-valuemax="100"><span class="short__track"><i></i></span></div>
      </div>
      <div class="short__rail">${shRailHTML(it)}</div>
    </section>`;
}

function shPanelHTML() {
  const me = CHANNELS.me;
  return `
    <div class="spanel">
      <div class="spanel__head">
        <h2>Comentários <span class="muted" id="spCount"></span></h2>
        <button class="icon-btn icon-btn--sm" data-s-close aria-label="Fechar comentários">${ICON.close}</button>
      </div>
      <div class="spanel__list" id="spList"></div>
      <form class="spanel__form" id="shortCommentForm" autocomplete="off">
        <span class="avatar avatar--sm avatar--me${avClass(me)}" style="${avStyle(me)}" aria-hidden="true">${avText(me)}</span>
        <label class="sr-only" for="shortCommentInput">Adicionar um comentário</label>
        <input id="shortCommentInput" placeholder="Adicione um comentário…" maxlength="500" autocomplete="off">
        <button type="submit" class="pill-btn pill-btn--accent" id="shortCommentSend" disabled>Comentar</button>
      </form>
    </div>`;
}

/* ---------- Página ---------- */

function renderShorts(startId) {
  document.title = 'Shorts — VoceTube';
  const pool = shortPool();
  if (!pool.length) {
    app().innerHTML = `<div class="page page--narrow">${emptyState({ title: 'Ainda não há Shorts', text: 'Envie um vídeo de até 60 segundos e ele aparece aqui.' })}</div>`;
    return;
  }

  app().innerHTML = `
    <div class="shorts">
      <div class="shorts__main">
        <div class="shorts__feed" id="shortsFeed" tabindex="-1" aria-label="Shorts"></div>
        <div class="shorts__arrows">
          <button class="icon-btn" data-s-prev aria-label="Short anterior">${SH_ICON.up}</button>
          <button class="icon-btn" data-s-next aria-label="Próximo Short">${SH_ICON.down}</button>
        </div>
      </div>
      <aside class="shorts__panel" id="shortsPanel" aria-label="Comentários do Short" inert aria-hidden="true">${shPanelHTML()}</aside>
    </div>`;

  const root = $('.shorts');
  const feed = $('#shortsFeed');
  const s = shorts = {
    root, feed, pool, slides: [], index: -1, cur: null,
    playing: true, seeking: false, t: 0, last: performance.now(), raf: 0,
    queue: shQueue(pool, startId), panelOpen: false,
    wheelLock: false, wheelTimer: 0, lastGo: 0,
    reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  /* Descobre qual Short ocupa a tela (pelo menos 60% visível) */
  s.observer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting || en.intersectionRatio < 0.6) return;
      const i = s.slides.findIndex((x) => x.el === en.target);
      if (i >= 0) shActivate(i);
    });
  }, { root: feed, threshold: [0.6] });

  root.addEventListener('click', shOnClick);
  root.addEventListener('input', (e) => {
    if (e.target.id === 'shortCommentInput') $('#shortCommentSend').disabled = !e.target.value.trim();
  });
  root.addEventListener('submit', shOnSubmit);
  root.addEventListener('pointerdown', shOnBarDown);
  feed.addEventListener('wheel', shOnWheel, { passive: false });

  s.onResize = debounce(() => {
    if (shorts) feed.scrollTo({ top: s.index * feed.clientHeight, behavior: 'auto' });
  }, 150);
  s.onVisibility = () => {
    const v = s.cur && s.cur.video;
    if (!v) return;
    if (document.hidden) v.pause(); else if (s.playing) v.play().catch(() => {});
  };
  document.addEventListener('keydown', shOnKey);
  window.addEventListener('resize', s.onResize);
  document.addEventListener('visibilitychange', s.onVisibility);

  shAppend(5);
  shActivate(0);
  s.raf = requestAnimationFrame(shTick);
}

function destroyShorts() {
  const s = shorts;
  if (!s) return;
  cancelAnimationFrame(s.raf);
  clearTimeout(s.trimTimer);
  s.observer.disconnect();
  s.slides.forEach((sl) => {
    if (!sl.video) return;
    sl.video.pause();
    sl.video.removeAttribute('src');
    sl.video.load();
  });
  document.removeEventListener('keydown', shOnKey);
  window.removeEventListener('resize', s.onResize);
  document.removeEventListener('visibilitychange', s.onVisibility);
  shorts = null;
}

/* Acrescenta mais Shorts no fim da rolagem */
function shAppend(n) {
  const s = shorts;
  const items = Array.from({ length: n }, () => s.queue.next());
  s.feed.insertAdjacentHTML('beforeend', items.map(shSlideHTML).join(''));
  const els = [...s.feed.children].slice(-n);
  els.forEach((el, i) => {
    s.slides.push({
      el, it: items[i],
      fill: el.querySelector('.short__bar i'),
      bar: el.querySelector('.short__bar'),
      rail: el.querySelector('.short__rail'),
      video: el.querySelector('video')
    });
    s.observer.observe(el);
  });
}

/* Depois de muitos Shorts, tira os primeiros da tela (e acerta a rolagem) */
function shTrim() {
  const s = shorts;
  if (!s) return;
  const CUT = 20;
  if (s.slides.length <= 60 || s.index < CUT + 2 || Date.now() - s.lastGo < 1200) return;
  const h = s.feed.clientHeight;
  const target = s.feed.scrollTop - CUT * h;   // calculado antes de remover: depois disso o navegador já encolhe a rolagem
  s.feed.style.scrollSnapType = 'none';
  s.slides.splice(0, CUT).forEach((g) => { s.observer.unobserve(g.el); g.el.remove(); });
  s.index -= CUT;
  s.feed.scrollTop = target;
  requestAnimationFrame(() => { if (shorts) s.feed.style.scrollSnapType = ''; });
}

/* Muda o Short que está tocando */
function shActivate(i) {
  const s = shorts;
  if (!s || i === s.index || !s.slides[i]) return;

  const prev = s.slides[s.index];
  if (prev) {
    prev.el.classList.remove('is-active', 'is-paused');
    prev.fill.style.transform = 'scaleX(0)';
    if (prev.video) prev.video.pause();
  }

  s.index = i;
  s.cur = s.slides[i];
  s.playing = true;
  s.t = 0;
  s.last = performance.now();
  s.cur.el.classList.add('is-active');
  if (s.cur.video) shPlayVideo(s.cur);

  history.replaceState(null, '', `#/shorts/${s.cur.it.id}`);
  document.title = `${s.cur.it.title} — Shorts — VoceTube`;
  if (s.panelOpen) shRenderComments();
  shUpdateArrows();

  if (i >= s.slides.length - 3) shAppend(5);
  clearTimeout(s.trimTimer);
  s.trimTimer = setTimeout(shTrim, 1400);   // limpa os mais antigos quando a rolagem para
}

function shPlayVideo(sl) {
  const v = sl.video;
  v.currentTime = 0;
  v.muted = Boolean(Store.data.muted);
  v.volume = Store.data.volume ?? 1;
  const p = v.play();
  if (p) p.catch(() => {   // o navegador pode bloquear som automático: toca sem som
    v.muted = true;
    v.play().catch(() => {});
    shSyncMute();
  });
}

function shSyncMute() {
  const s = shorts;
  if (!s) return;
  const muted = s.cur && s.cur.video ? s.cur.video.muted : Boolean(Store.data.muted);
  s.slides.forEach((sl) => {
    const b = sl.el.querySelector('[data-s-mute]');
    if (!b) return;
    b.innerHTML = muted ? SH_ICON.mute : SH_ICON.volume;
    b.setAttribute('aria-label', muted ? 'Ativar som' : 'Silenciar');
  });
}

/* Liga/desliga o som do vídeo que está tocando (vale o estado real: o navegador pode ter silenciado sozinho) */
function shToggleMute() {
  const s = shorts;
  const v = s && s.cur && s.cur.video;
  if (!v) return;
  v.muted = !v.muted;
  Store.data.muted = v.muted;
  Store.save();
  shSyncMute();
}

function shUpdateArrows() {
  const s = shorts;
  const prev = $('[data-s-prev]', s.root);
  if (prev) prev.disabled = s.index <= 0;
}

/* Progresso do Short que está tocando (um único laço de animação) */
function shTick(now) {
  const s = shorts;
  if (!s) return;
  s.raf = requestAnimationFrame(shTick);
  const dt = Math.min(0.25, (now - s.last) / 1000);
  s.last = now;
  const cur = s.cur;
  if (!cur) return;

  let p;
  if (cur.video) {
    p = cur.video.currentTime / (cur.video.duration || cur.it.dur || 1);
  } else {
    if (s.playing && !document.hidden && !s.seeking) {
      s.t += dt;
      if (s.t >= cur.it.dur) s.t -= cur.it.dur;   // repete, como no YouTube
    }
    p = s.t / cur.it.dur;
  }
  p = Math.max(0, Math.min(1, p));
  cur.fill.style.transform = `scaleX(${p})`;
  cur.bar.setAttribute('aria-valuenow', Math.round(p * 100));
}

function shToggle() {
  const s = shorts;
  if (!s || !s.cur) return;
  s.playing = !s.playing;
  s.cur.el.classList.toggle('is-paused', !s.playing);
  if (s.cur.video) { if (s.playing) s.cur.video.play().catch(() => {}); else s.cur.video.pause(); }
}

/* Passa para o próximo (1) ou anterior (-1) */
function shGo(dir) {
  const s = shorts;
  const target = s.index + dir;
  if (target < 0 || target >= s.slides.length) return;
  s.lastGo = Date.now();
  shActivate(target);   // atualiza já: a rolagem suave demora um pouco
  s.feed.scrollTo({ top: target * s.feed.clientHeight, behavior: s.reduce ? 'auto' : 'smooth' });
}

/* ---------- Eventos ---------- */

function shRefreshRail(id) {
  shorts.slides.filter((sl) => sl.it.id === id).forEach((sl) => { sl.rail.innerHTML = shRailHTML(sl.it); });
}

function shFollow(key) {
  const added = Store.toggle('following', key);
  toast(added ? `Inscrição feita em ${CHANNELS[key].name}` : `Inscrição cancelada em ${CHANNELS[key].name}`);
  renderChannelList();
  $$(`.short [data-follow="${key}"]`, shorts.root).forEach((b) => {
    b.classList.toggle('is-following', added);
    b.setAttribute('aria-pressed', added);
    b.textContent = added ? 'Inscrito' : 'Inscrever-se';
  });
}

async function shShare(it) {
  const url = `${location.href.split('#')[0]}#/shorts/${it.id}`;
  try { await navigator.clipboard.writeText(url); }
  catch {
    const tmp = document.createElement('input');
    tmp.value = url;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    tmp.remove();
  }
  toast('Link do Short copiado');
}

function shOnClick(e) {
  const s = shorts;
  if (!s) return;
  const t = e.target.closest('button, a');
  if (!t) return;
  const d = t.dataset;
  const slideEl = t.closest('.short');
  const rec = slideEl && s.slides.find((x) => x.el === slideEl);
  const it = rec ? rec.it : (s.cur && s.cur.it);

  /* Botões dos Shorts: não deixa o clique chegar nos atalhos gerais do site,
     que redesenhariam a página e fariam o Short voltar ao começo */
  if (d.follow) { e.stopPropagation(); return shFollow(d.follow); }
  if ('sLike' in d) {
    e.stopPropagation();
    Store.remove('disliked', it.id); Store.toggle('liked', it.id);
    return shRefreshRail(it.id);
  }
  if ('sDislike' in d) {
    e.stopPropagation();
    Store.remove('liked', it.id); Store.toggle('disliked', it.id);
    return shRefreshRail(it.id);
  }
  if ('sComments' in d) { e.stopPropagation(); return shTogglePanel(); }
  if ('sClose' in d) { e.stopPropagation(); return shTogglePanel(false); }
  if ('sShare' in d) { e.stopPropagation(); return shShare(it); }
  if ('sPrev' in d) { e.stopPropagation(); return shGo(-1); }
  if ('sNext' in d) { e.stopPropagation(); return shGo(1); }
  if ('sTap' in d) { e.stopPropagation(); return shToggle(); }
  if ('sMute' in d) { e.stopPropagation(); return shToggleMute(); }
  if (d.commentLike) {
    e.stopPropagation();
    Store.toggle('commentLikes', d.commentLike);
    return shRenderComments();
  }
  if (d.commentDelete) {
    e.stopPropagation();
    const id = s.cur.it.id;
    Store.data.comments[id] = (Store.data.comments[id] || []).filter((c) => c.id !== d.commentDelete);
    Store.save();
    toast('Comentário excluído');
    shRenderComments();
    return shRefreshRail(id);
  }
}

function shOnSubmit(e) {
  if (e.target.id !== 'shortCommentForm') return;
  e.preventDefault();
  const input = $('#shortCommentInput');
  const text = input.value.trim();
  if (!text) return;
  const id = shorts.cur.it.id;
  (Store.data.comments[id] ||= []).unshift({ id: 'c' + Date.now().toString(36), text, at: Date.now() });
  Store.save();
  input.value = '';
  $('#shortCommentSend').disabled = true;
  toast('Comentário publicado');
  shRenderComments();
  shRefreshRail(id);
}

/* Arrastar a barra de progresso para avançar ou voltar no Short */
function shOnBarDown(e) {
  const s = shorts;
  const bar = e.target.closest('[data-s-bar]');
  if (!s || !bar || !s.cur || bar !== s.cur.bar) return;
  const seek = (ev) => {
    const r = bar.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
    if (s.cur.video) s.cur.video.currentTime = p * (s.cur.video.duration || 0);
    else s.t = p * s.cur.it.dur;
  };
  bar.setPointerCapture(e.pointerId);
  s.seeking = true;
  seek(e);
  const move = (ev) => seek(ev);
  const up = () => {
    s.seeking = false;
    bar.removeEventListener('pointermove', move);
    bar.removeEventListener('pointerup', up);
    bar.removeEventListener('pointercancel', up);
  };
  bar.addEventListener('pointermove', move);
  bar.addEventListener('pointerup', up);
  bar.addEventListener('pointercancel', up);
}

/* Roda do mouse / touchpad: um gesto = um Short (a lista nativa "puxaria" só um pedaço) */
function shOnWheel(e) {
  const s = shorts;
  if (!s) return;
  e.preventDefault();
  clearTimeout(s.wheelTimer);
  s.wheelTimer = setTimeout(() => { s.wheelLock = false; }, 160);   // libera quando a roda para
  if (s.wheelLock || Math.abs(e.deltaY) < 8) return;
  s.wheelLock = true;
  shGo(e.deltaY > 0 ? 1 : -1);
}

function shOnKey(e) {
  const s = shorts;
  if (!s || e.ctrlKey || e.metaKey || e.altKey) return;
  const el = document.activeElement;
  const typing = el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
  if (e.key === 'Escape' && s.panelOpen) { shTogglePanel(false); return; }
  if (typing || document.querySelector('dialog[open]')) return;

  const key = e.key.toLowerCase();
  const onButton = el && ['BUTTON', 'A'].includes(el.tagName);
  if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); shGo(1); }
  else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); shGo(-1); }
  else if (key === 'k' || (key === ' ' && !onButton)) { e.preventDefault(); shToggle(); }
  else if (key === 'm') shToggleMute();
}

/* ---------- Comentários ---------- */

function shTogglePanel(force) {
  const s = shorts;
  const open = force === undefined ? !s.panelOpen : force;
  s.panelOpen = open;
  s.root.classList.toggle('has-comments', open);
  const panel = $('#shortsPanel');
  panel.inert = !open;
  panel.setAttribute('aria-hidden', String(!open));
  if (open) shRenderComments();
}

function shRenderComments() {
  const it = shorts.cur.it;
  const list = commentsFor(shortAsVideo(it));
  $('#spCount').textContent = list.length;
  $('#spList').innerHTML = list.length ? list.map((c) => `
    <div class="comment">
      <span class="avatar${avClass(c)}" style="${avStyle(c)}" aria-hidden="true">${avText(c)}</span>
      <div class="comment__body">
        <span class="comment__head"><strong>${esc(c.name)}</strong><span class="muted">${ago(c.at)}</span></span>
        <p>${esc(c.text)}</p>
        <div class="comment__actions">
          <button class="mini-btn" data-comment-like="${c.id}" aria-pressed="${Store.has('commentLikes', c.id)}" aria-label="Curtir comentário">${ICON.like}<span>${c.totalLikes || ''}</span></button>
          ${c.mine ? `<button class="mini-btn" data-comment-delete="${c.id}">Excluir</button>` : ''}
        </div>
      </div>
    </div>`).join('') : '<p class="muted spanel__empty">Ainda não há comentários. Seja o primeiro!</p>';
}
