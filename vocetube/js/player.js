/* =========================================================
   VOCETUBE — player (estilo YouTube)
   Funciona de dois jeitos com os mesmos controles:
   - vídeo real (<video>) para os arquivos enviados pelo usuário
   - vídeo de demonstração (simulado) para os vídeos de exemplo,
     mostrando a miniatura com um leve movimento de câmera

   Recursos: capítulos na barra de progresso (lidos da descrição),
   prévia ao passar o mouse na barra, menu de configurações com
   submenus (velocidade, qualidade, repetir, modo ambiente),
   miniplayer (picture-in-picture), animações de play/pause e de
   avanço, tela final com o próximo vídeo e modo ambiente (brilho
   com as cores do vídeo atrás do player, no tema escuro).
   ========================================================= */

const ICONS = {
  play: '<path d="M8 5v14l11-7z" class="fill"/>',
  pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" class="fill"/>',
  replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  next: '<path d="M6 5v14l10-7z" class="fill"/><path d="M18 5v14"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  volumeLow: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 6 6M22 9l-6 6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  theater: '<rect x="2" y="6" width="20" height="12" rx="2"/>',
  theaterOff: '<rect x="4" y="7" width="16" height="10" rx="2"/>',
  fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  exitFullscreen: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  miniplayer: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="12" width="7" height="5" rx="1" class="fill"/>',
  speed: '<path d="M12 21a9 9 0 1 1 9-9"/><path d="m12 12 4-4"/><path d="M19 15l2 2-2 2"/>',
  quality: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  ambient: '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  loop: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  rewind: '<path d="M11 6 4 12l7 6zM20 6l-7 6 7 6z" class="fill"/>',
  forward: '<path d="m13 6 7 6-7 6zM4 6l7 6-7 6z" class="fill"/>'
};

function svg(name, cls = '') {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" class="${cls}">${ICONS[name]}</svg>`;
}

/* Preferências que valem só enquanto a página está aberta */
const PlayerPrefs = { ambient: true, loop: false, quality: 'auto' };

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITIES = ['auto', '1080', '720', '480', '360', '144'];
const speedLabel = (s) => (s === 1 ? 'Normal' : String(s).replace('.', ','));
const qualityLabel = (q, real) => (q === 'auto' ? (real ? 'Auto' : 'Auto (1080p)') : `${q}p`);

/* Lê os capítulos da descrição: linhas que começam com "00:00 Título" (ou "1:02:03 Título").
   Como no YouTube, só vale se houver pelo menos 2 capítulos e o primeiro começar em 0:00. */
function parseChapters(desc, dur) {
  const list = [];
  (desc || '').split('\n').forEach((line) => {
    const m = line.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+[-–—]?\s*(.+)$/);
    if (!m) return;
    const start = Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    if (dur && start >= dur) return;
    list.push({ start, title: m[4].trim() });
  });
  list.sort((a, b) => a.start - b.start);
  if (list.length < 2 || list[0].start !== 0) return [];
  return list.map((c, i) => ({ ...c, end: list[i + 1] ? list[i + 1].start : dur }));
}

/* ---------- Motores de reprodução ---------- */
function createEmitter() {
  const handlers = {};
  return {
    on(evt, fn) { (handlers[evt] ||= []).push(fn); },
    emit(evt, data) { (handlers[evt] || []).forEach((fn) => fn(data)); }
  };
}

/* Vídeo real: só repassa os eventos do elemento <video> */
function videoEngine(el) {
  const em = createEmitter();
  el.addEventListener('timeupdate', () => em.emit('time'));
  el.addEventListener('progress', () => em.emit('time'));
  el.addEventListener('loadedmetadata', () => em.emit('meta'));
  el.addEventListener('play', () => em.emit('state'));
  el.addEventListener('pause', () => em.emit('state'));
  el.addEventListener('ended', () => em.emit('ended'));
  el.addEventListener('waiting', () => em.emit('waiting', true));
  el.addEventListener('playing', () => em.emit('waiting', false));
  return {
    ...em,
    play: () => el.play().catch(() => {}),
    pause: () => el.pause(),
    get playing() { return !el.paused && !el.ended; },
    get time() { return el.currentTime || 0; },
    set time(t) { el.currentTime = t; },
    get duration() { return Number.isFinite(el.duration) ? el.duration : 0; },
    get buffered() { return el.buffered.length ? el.buffered.end(el.buffered.length - 1) : 0; },
    get height() { return el.videoHeight || 0; },
    set rate(r) { el.playbackRate = r; },
    set volume(v) { el.volume = v; },
    set muted(m) { el.muted = m; },
    destroy() { el.pause(); el.removeAttribute('src'); el.load(); }
  };
}

/* Vídeo de demonstração: um relógio que avança como se fosse um vídeo */
function demoEngine(totalSeconds) {
  const em = createEmitter();
  let time = 0, playing = false, rate = 1, timer = null, last = 0;

  function tick() {
    const now = performance.now();
    time = Math.min(totalSeconds, time + ((now - last) / 1000) * rate);
    last = now;
    em.emit('time');
    if (time >= totalSeconds) { stop(); em.emit('ended'); }
  }
  function stop() { playing = false; clearInterval(timer); em.emit('state'); }

  return {
    ...em,
    play() {
      if (playing) return;
      if (time >= totalSeconds) time = 0;
      playing = true; last = performance.now();
      timer = setInterval(tick, 200);
      em.emit('state');
    },
    pause() { if (playing) { tick(); stop(); } },
    get playing() { return playing; },
    get time() { return time; },
    set time(t) { time = Math.max(0, Math.min(totalSeconds, t)); em.emit('time'); },
    get duration() { return totalSeconds; },
    get buffered() { return Math.min(totalSeconds, time + 60); },
    get height() { return 1080; },
    set rate(r) { rate = r; },
    set volume(v) {}, set muted(m) {},
    destroy() { clearInterval(timer); }
  };
}

/* ---------- Player ---------- */
/**
 * @param {HTMLElement} root  elemento onde o player será montado
 * @param {object} video      vídeo a tocar (com .src para vídeo real)
 * @param {object} opts       { startAt, onEnded, onTime, onNext, onTheater, hasNext, nextVideo, theater }
 */
function createPlayer(root, video, opts = {}) {
  const real = Boolean(video.src);
  const prefs = Store.data;
  const thumbSrc = video.thumb ? esc(video.thumb) : '';
  const canPip = real && document.pictureInPictureEnabled;

  root.innerHTML = `
    <canvas class="ambient" width="32" height="18" aria-hidden="true"></canvas>
    <div class="player ${real ? 'is-real' : 'is-demo'}" tabindex="0" aria-label="Player de vídeo">
      ${real
        ? `<video class="player__video" src="${video.src}" ${thumbSrc ? `poster="${thumbSrc}"` : ''} playsinline preload="metadata"></video>`
        : `<div class="player__demo" style="--c1:${video.c1};--c2:${video.c2}">
             ${thumbSrc
               ? `<img class="player__demo-img" src="${thumbSrc}" alt="" crossorigin="anonymous">`
               : `<svg viewBox="0 0 24 24" aria-hidden="true" class="player__demo-icon">${CAT_ICONS[video.cat] || ''}</svg>`}
             <span class="player__demo-label">Demonstração</span>
           </div>`}
      <div class="player__top">
        <span class="player__top-title">${esc(video.title)}</span>
      </div>
      <div class="player__spinner" hidden></div>
      <button class="player__big" aria-label="Reproduzir">${svg('play')}</button>
      <div class="player__bezel" aria-hidden="true"></div>
      <div class="player__seek player__seek--left" aria-hidden="true"><span class="player__seek-arrows">${svg('rewind')}</span><span data-seek-text></span></div>
      <div class="player__seek player__seek--right" aria-hidden="true"><span class="player__seek-arrows">${svg('forward')}</span><span data-seek-text></span></div>
      <div class="player__flash" aria-hidden="true"></div>
      <div class="player__next" hidden></div>

      <div class="player__controls">
        <div class="progress" role="slider" tabindex="0" aria-label="Posição do vídeo" aria-valuemin="0">
          <div class="progress__segments"></div>
          <span class="progress__thumb"></span>
          <div class="progress__preview" hidden>
            <div class="progress__preview-img">
              ${real ? '<canvas width="192" height="108"></canvas>' : thumbSrc ? `<img src="${thumbSrc}" alt="">` : ''}
            </div>
            <span class="progress__preview-chapter"></span>
            <span class="progress__preview-time"></span>
          </div>
        </div>

        <div class="player__bar">
          <div class="player__group">
            <button class="ctrl" data-act="play" aria-label="Reproduzir (K)">${svg('play')}</button>
            <button class="ctrl" data-act="next" aria-label="Próximo vídeo (Shift+N)" ${opts.hasNext ? '' : 'hidden'}>${svg('next')}</button>
            <div class="volume">
              <button class="ctrl" data-act="mute" aria-label="Silenciar (M)">${svg('volume')}</button>
              <input class="volume__range" type="range" min="0" max="1" step="0.05" aria-label="Volume">
            </div>
            <span class="time"><span data-time>0:00</span> / <span data-dur>0:00</span></span>
            <button class="chapter-btn" data-act="chapters" hidden><span class="chapter-btn__dot">•</span><span data-chapter></span>${svg('chevron')}</button>
          </div>
          <div class="player__group">
            <button class="switch" data-act="autoplay" aria-label="Reprodução automática" title="Reprodução automática" aria-pressed="${prefs.autoplay}"><span>${svg('play')}</span></button>
            <div class="settings">
              <button class="ctrl ctrl--settings" data-act="settings" aria-label="Configurações" aria-haspopup="true" aria-expanded="false">${svg('settings')}${real ? '' : '<span class="ctrl__badge">HD</span>'}</button>
              <div class="settings__menu" role="menu" hidden></div>
            </div>
            ${canPip ? `<button class="ctrl" data-act="miniplayer" aria-label="Miniplayer (I)">${svg('miniplayer')}</button>` : ''}
            <button class="ctrl" data-act="theater" aria-label="Modo cinema (T)">${svg(opts.theater ? 'theaterOff' : 'theater')}</button>
            <button class="ctrl" data-act="fullscreen" aria-label="Tela cheia (F)">${svg('fullscreen')}</button>
          </div>
        </div>
      </div>
    </div>`;

  const el = root.querySelector('.player');
  const q = (s) => el.querySelector(s);
  const videoEl = q('video');
  const engine = real ? videoEngine(videoEl) : demoEngine(video.dur);
  const progress = q('.progress');
  const segBox = q('.progress__segments');
  const scrub = q('.progress__thumb');
  const preview = q('.progress__preview');
  const volRange = q('.volume__range');
  const menu = q('.settings__menu');
  const ambient = root.querySelector('.ambient');
  let started = false, nextTimer = null, idleTimer = null, ambientTimer = null, menuPage = 'main';
  let chapters = [];
  let segs = [];

  /* Preferências salvas */
  engine.rate = prefs.speed;
  engine.volume = prefs.volume;
  engine.muted = prefs.muted;
  volRange.value = prefs.muted ? 0 : prefs.volume;
  applyQuality();

  function duration() { return engine.duration || video.dur || 0; }

  /* ----- Barra de progresso dividida em capítulos ----- */
  function buildSegments() {
    const d = duration();
    chapters = parseChapters(video.desc, d);
    const parts = chapters.length ? chapters : [{ start: 0, end: d, title: '' }];
    segBox.innerHTML = parts.map((c) => `
      <div class="progress__seg" style="flex:${Math.max(0.001, (c.end - c.start) || 1)}">
        <div class="progress__buffer"></div><div class="progress__fill"></div><div class="progress__hover"></div>
      </div>`).join('');
    segs = [...segBox.children].map((node, i) => ({ node, ...parts[i] }));
    q('[data-act="chapters"]').hidden = !chapters.length;
  }
  function chapterAt(t) {
    for (let i = chapters.length - 1; i >= 0; i -= 1) if (t >= chapters[i].start) return chapters[i];
    return null;
  }
  function paintSegments(prop, t) {
    segs.forEach((s) => {
      const len = s.end - s.start;
      const pct = len > 0 ? Math.max(0, Math.min(1, (t - s.start) / len)) * 100 : 0;
      s.node.querySelector(prop).style.width = pct + '%';
    });
  }

  function updateTime() {
    const d = duration();
    const t = engine.time;
    paintSegments('.progress__fill', t);
    paintSegments('.progress__buffer', engine.buffered);
    scrub.style.left = (d ? (t / d) * 100 : 0) + '%';
    q('[data-time]').textContent = fmtTime(t);
    q('[data-dur]').textContent = fmtTime(d);
    const ch = chapterAt(t);
    if (ch) q('[data-chapter]').textContent = ch.title;
    progress.setAttribute('aria-valuemax', Math.round(d));
    progress.setAttribute('aria-valuenow', Math.round(t));
    progress.setAttribute('aria-valuetext', `${fmtTime(t)} de ${fmtTime(d)}${ch ? ` — ${ch.title}` : ''}`);
    opts.onTime?.(t, d);
  }

  function updateState() {
    const playing = engine.playing;
    const ended = !playing && engine.time >= duration() - 0.5 && started;
    el.classList.toggle('is-playing', playing);
    el.classList.toggle('is-started', started);
    el.classList.toggle('is-ended', ended);
    const btn = q('[data-act="play"]');
    btn.innerHTML = svg(playing ? 'pause' : ended ? 'replay' : 'play');
    btn.setAttribute('aria-label', playing ? 'Pausar (K)' : ended ? 'Assistir novamente' : 'Reproduzir (K)');
    poke();
  }

  function updateVolume() {
    const level = prefs.muted ? 0 : prefs.volume;
    q('[data-act="mute"]').innerHTML = svg(level === 0 ? 'mute' : level < 0.5 ? 'volumeLow' : 'volume');
    q('[data-act="mute"]').setAttribute('aria-label', level === 0 ? 'Ativar som (M)' : 'Silenciar (M)');
    volRange.value = level;
    volRange.style.setProperty('--level', level * 100 + '%');
  }

  /* Esconde os controles depois de 2,5 s sem mexer o mouse, enquanto toca */
  function poke() {
    el.classList.remove('is-idle');
    clearTimeout(idleTimer);
    if (engine.playing) idleTimer = setTimeout(() => {
      if (!menu.hidden || progress.matches(':hover')) return;
      el.classList.add('is-idle');
    }, 2500);
  }

  /* ----- Ações públicas ----- */
  const api = {
    play() { cancelNext(); started = true; engine.play(); },
    pause() { engine.pause(); },
    toggle() {
      const willPlay = !engine.playing;
      willPlay ? api.play() : api.pause();
      if (started) bezel(willPlay ? 'play' : 'pause');
    },
    seek(t) { engine.time = Math.max(0, Math.min(duration(), t)); updateTime(); },
    seekBy(s) { api.seek(engine.time + s); seekIndicator(s); },
    setVolume(v) {
      prefs.volume = Math.max(0, Math.min(1, v));
      prefs.muted = prefs.volume === 0;
      engine.volume = prefs.volume; engine.muted = prefs.muted;
      Store.save(); updateVolume();
      flash(`${Math.round(prefs.volume * 100)}%`);
    },
    toggleMute() {
      prefs.muted = !prefs.muted;
      if (!prefs.muted && prefs.volume === 0) prefs.volume = 0.5;
      engine.muted = prefs.muted; engine.volume = prefs.volume;
      Store.save(); updateVolume();
      bezel(prefs.muted ? 'mute' : 'volume');
    },
    setSpeed(s) {
      prefs.speed = s; engine.rate = s; Store.save();
      if (!menu.hidden) renderMenu();
      flash(`${speedLabel(s)}${s === 1 ? '' : 'x'}`);
    },
    /* Teclas < e > (Shift + vírgula / ponto), como no YouTube */
    stepSpeed(dir) {
      const i = SPEEDS.indexOf(prefs.speed);
      const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, (i < 0 ? 3 : i) + dir))];
      api.setSpeed(next);
    },
    fullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else el.requestFullscreen?.();
    },
    async miniplayer() {
      if (!canPip) return flash('Miniplayer só funciona em vídeos enviados');
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await videoEl.requestPictureInPicture();
      } catch { flash('Miniplayer indisponível'); }
    },
    setTheater(on) { q('[data-act="theater"]').innerHTML = svg(on ? 'theaterOff' : 'theater'); },
    get time() { return engine.time; },
    get duration() { return duration(); },
    destroy() {
      cancelNext(); clearTimeout(idleTimer); clearInterval(ambientTimer); engine.destroy();
      if (previewVideo) { previewVideo.removeAttribute('src'); previewVideo.load(); }
      if (document.pictureInPictureElement === videoEl) document.exitPictureInPicture().catch(() => {});
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('click', onDocClick);
    }
  };

  /* Mensagem rápida no alto do player (ex.: "1,5x", "60%") */
  let flashTimer;
  function flash(text) {
    const f = q('.player__flash');
    f.textContent = text;
    f.classList.add('is-visible');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => f.classList.remove('is-visible'), 700);
  }

  /* Ícone que aparece e some no centro ao reproduzir/pausar */
  function bezel(icon) {
    const b = q('.player__bezel');
    b.innerHTML = svg(icon);
    b.classList.remove('is-animating');
    void b.offsetWidth; // reinicia a animação
    b.classList.add('is-animating');
  }

  /* Indicador "« 10 segundos" na lateral, somando toques seguidos */
  let seekSum = 0, seekSide = '', seekTimer;
  function seekIndicator(s) {
    const side = s > 0 ? 'right' : 'left';
    if (side !== seekSide) seekSum = 0;
    seekSide = side; seekSum += Math.abs(s);
    el.querySelectorAll('.player__seek').forEach((n) => n.classList.remove('is-visible'));
    const box = q(`.player__seek--${side}`);
    box.querySelector('[data-seek-text]').textContent = `${seekSum} segundos`;
    box.classList.remove('is-visible'); void box.offsetWidth; box.classList.add('is-visible');
    clearTimeout(seekTimer);
    seekTimer = setTimeout(() => { box.classList.remove('is-visible'); seekSum = 0; seekSide = ''; }, 650);
  }

  /* ----- Menu de configurações (com submenus) ----- */
  function currentQuality() {
    if (real) {
      const h = engine.height;
      return `Auto${h ? ` (${h}p)` : ''}`;
    }
    return qualityLabel(PlayerPrefs.quality, real);
  }
  function renderMenu() {
    const item = (act, icon, label, value) =>
      `<button role="menuitem" class="settings__item" data-menu="${act}">${svg(icon, 'settings__icon')}<span>${label}</span><span class="settings__value">${value}</span></button>`;
    const toggle = (act, icon, label, on) =>
      `<button role="menuitemcheckbox" class="settings__item" data-menu="${act}" aria-checked="${on}">${svg(icon, 'settings__icon')}<span>${label}</span><span class="settings__toggle"></span></button>`;
    const head = (title) =>
      `<button class="settings__head" data-menu="main">${svg('back')}<span>${title}</span></button>`;

    if (menuPage === 'speed') {
      menu.innerHTML = head('Velocidade da reprodução') + SPEEDS.map((s) =>
        `<button role="menuitemradio" class="settings__option" data-speed="${s}" aria-checked="${s === prefs.speed}">${speedLabel(s)}</button>`).join('');
    } else if (menuPage === 'quality') {
      menu.innerHTML = head('Qualidade') + (real
        ? `<button role="menuitemradio" class="settings__option" aria-checked="true">${currentQuality()}</button>
           <p class="settings__note">O vídeo enviado toca na resolução original do arquivo.</p>`
        : QUALITIES.map((qv) =>
          `<button role="menuitemradio" class="settings__option" data-quality="${qv}" aria-checked="${qv === PlayerPrefs.quality}">${qualityLabel(qv, real)}${qv === '1080' || qv === 'auto' ? ' <sup>HD</sup>' : ''}</button>`).join(''));
    } else {
      menu.innerHTML =
        toggle('ambient', 'ambient', 'Modo ambiente', PlayerPrefs.ambient) +
        toggle('loop', 'loop', 'Repetir', PlayerPrefs.loop) +
        item('speed', 'speed', 'Velocidade da reprodução', speedLabel(prefs.speed)) +
        item('quality', 'quality', 'Qualidade', currentQuality());
    }
  }
  function openMenu() {
    menuPage = 'main'; renderMenu();
    menu.hidden = false;
    q('[data-act="settings"]').setAttribute('aria-expanded', 'true');
    el.classList.add('is-menu-open');
  }
  function closeMenu() {
    menu.hidden = true;
    q('[data-act="settings"]').setAttribute('aria-expanded', 'false');
    el.classList.remove('is-menu-open');
  }
  function onDocClick(e) { if (!e.target.closest('.settings')) closeMenu(); }
  document.addEventListener('click', onDocClick);

  /* Qualidade nos vídeos de demonstração: só simula (deixa a imagem mais borrada) */
  function applyQuality() {
    const blur = { auto: 0, 1080: 0, 720: 0.4, 480: 1, 360: 1.8, 144: 4 }[PlayerPrefs.quality] || 0;
    el.style.setProperty('--demo-blur', real ? '0px' : blur + 'px');
  }

  /* ----- Modo ambiente: brilho com as cores do vídeo atrás do player ----- */
  const ctx = ambient.getContext('2d');
  function paintAmbient() {
    if (!PlayerPrefs.ambient) return;
    try {
      const src = real ? videoEl : q('.player__demo-img');
      if (!src || (real && videoEl.readyState < 2) || (!real && !src.complete)) return;
      ctx.drawImage(src, 0, 0, ambient.width, ambient.height);
      ambient.classList.add('is-ready');
    } catch { /* imagem de outro endereço: ignora */ }
  }
  function updateAmbient() {
    ambient.hidden = !PlayerPrefs.ambient;
    clearInterval(ambientTimer);
    if (!PlayerPrefs.ambient) return;
    paintAmbient();
    if (real) ambientTimer = setInterval(() => { if (engine.playing) paintAmbient(); }, 600);
  }
  if (real) videoEl.addEventListener('loadeddata', paintAmbient);
  else q('.player__demo-img')?.addEventListener('load', paintAmbient);

  /* ----- Próximo vídeo automático (tela final) ----- */
  function showNext(next) {
    const box = q('.player__next');
    let left = 8;
    const total = left;
    box.hidden = false;
    box.innerHTML = `
      <span class="player__next-label">A seguir</span>
      <div class="player__next-card">
        <div class="player__next-thumb" style="--c1:${next.c1};--c2:${next.c2}">
          ${next.thumb ? `<img src="${esc(next.thumb)}" alt="">` : ''}
          <svg class="countdown" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><circle class="countdown__ring" cx="24" cy="24" r="21" pathLength="100"/></svg>
          <span class="countdown__num" data-count>${left}</span>
        </div>
        <div class="player__next-text">
          <strong class="player__next-title">${esc(next.title)}</strong>
          <span>${esc(CHANNELS[next.ch].name)}</span>
        </div>
      </div>
      <div class="player__next-actions">
        <button class="pill-btn" data-act="cancel-next">Cancelar</button>
        <button class="pill-btn pill-btn--accent" data-act="go-next">Reproduzir agora</button>
      </div>`;
    const ring = box.querySelector('.countdown__ring');
    ring.style.strokeDashoffset = 0;
    requestAnimationFrame(() => {
      ring.style.transition = `stroke-dashoffset ${total}s linear`;
      ring.style.strokeDashoffset = 100;
    });
    nextTimer = setInterval(() => {
      left -= 1;
      const c = box.querySelector('[data-count]');
      if (c) c.textContent = left;
      if (left <= 0) { cancelNext(); opts.onNext?.(); }
    }, 1000);
  }
  function cancelNext() {
    clearInterval(nextTimer); nextTimer = null;
    const box = q('.player__next');
    if (box) { box.hidden = true; box.innerHTML = ''; }
  }

  /* ----- Eventos do motor ----- */
  engine.on('time', updateTime);
  engine.on('meta', () => { if (opts.startAt) engine.time = opts.startAt; buildSegments(); updateTime(); });
  engine.on('state', updateState);
  engine.on('waiting', (w) => { q('.player__spinner').hidden = !w; });
  engine.on('ended', () => {
    if (PlayerPrefs.loop) { api.seek(0); api.play(); return; }
    updateState();
    opts.onEnded?.();
    if (prefs.autoplay && opts.nextVideo) showNext(opts.nextVideo);
  });

  /* ----- Eventos da interface ----- */
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act], [data-speed], [data-quality], [data-menu]');
    if (btn?.dataset.speed) { api.setSpeed(Number(btn.dataset.speed)); menuPage = 'main'; renderMenu(); return; }
    if (btn?.dataset.quality) {
      PlayerPrefs.quality = btn.dataset.quality; applyQuality();
      flash(qualityLabel(PlayerPrefs.quality, real)); menuPage = 'main'; renderMenu(); return;
    }
    if (btn?.dataset.menu) {
      const m = btn.dataset.menu;
      if (m === 'ambient') { PlayerPrefs.ambient = !PlayerPrefs.ambient; updateAmbient(); }
      else if (m === 'loop') { PlayerPrefs.loop = !PlayerPrefs.loop; flash(PlayerPrefs.loop ? 'Repetir ativado' : 'Repetir desativado'); }
      else menuPage = m;
      renderMenu();
      return;
    }
    const act = btn?.dataset.act;
    if (act === 'play') api.toggle();
    else if (act === 'next') opts.onNext?.();
    else if (act === 'mute') api.toggleMute();
    else if (act === 'theater') opts.onTheater?.();
    else if (act === 'fullscreen') api.fullscreen();
    else if (act === 'miniplayer') api.miniplayer();
    else if (act === 'chapters') opts.onChapters?.();
    else if (act === 'cancel-next') cancelNext();
    else if (act === 'go-next') { cancelNext(); opts.onNext?.(); }
    else if (act === 'autoplay') {
      prefs.autoplay = !prefs.autoplay; Store.save();
      btn.setAttribute('aria-pressed', prefs.autoplay);
      flash(prefs.autoplay ? 'Reprodução automática ativada' : 'Reprodução automática desativada');
    } else if (act === 'settings') {
      menu.hidden ? openMenu() : closeMenu();
    } else if (!btn && (e.target.closest('.player__video, .player__demo') || e.target === el)) {
      if (!menu.hidden) return closeMenu();
      api.toggle();
    }
  });
  q('.player__big').addEventListener('click', (e) => { e.stopPropagation(); api.toggle(); });
  el.addEventListener('dblclick', (e) => { if (!e.target.closest('.player__controls, .player__next')) api.fullscreen(); });
  el.addEventListener('mousemove', poke);
  el.addEventListener('mouseleave', () => { if (engine.playing && menu.hidden) el.classList.add('is-idle'); });

  volRange.addEventListener('input', () => api.setVolume(Number(volRange.value)));

  /* ----- Barra de progresso: clicar, arrastar e ver a prévia ao passar o mouse ----- */
  const previewVideo = real ? Object.assign(document.createElement('video'), { muted: true, preload: 'metadata', src: video.src }) : null;
  const previewCanvas = preview.querySelector('canvas');
  let previewWanted = null, previewBusy = false;
  if (previewVideo) {
    previewVideo.addEventListener('seeked', () => {
      previewCanvas.getContext('2d').drawImage(previewVideo, 0, 0, previewCanvas.width, previewCanvas.height);
      previewBusy = false;
      if (previewWanted !== null) { const t = previewWanted; previewWanted = null; seekPreview(t); }
    });
  }
  function seekPreview(t) {
    if (!previewVideo) return;
    if (previewBusy) { previewWanted = t; return; }
    previewBusy = true;
    previewVideo.currentTime = t;
  }

  function pctFromEvent(e) {
    const r = progress.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  }
  function showPreview(p) {
    const d = duration();
    const t = p * d;
    const ch = chapterAt(t);
    preview.hidden = false;
    preview.classList.toggle('has-img', Boolean(real || thumbSrc));
    preview.querySelector('.progress__preview-chapter').textContent = ch ? ch.title : '';
    preview.querySelector('.progress__preview-time').textContent = fmtTime(t);
    /* Mantém a prévia dentro do player */
    const r = progress.getBoundingClientRect();
    const half = preview.offsetWidth / 2;
    const x = Math.max(half, Math.min(r.width - half, p * r.width));
    preview.style.left = x + 'px';
    if (!real) preview.querySelector('img')?.style.setProperty('object-position', `${p * 100}% 50%`);
    seekPreview(t);
    paintSegments('.progress__hover', t);
  }
  progress.addEventListener('pointerdown', (e) => {
    progress.setPointerCapture(e.pointerId);
    progress.classList.add('is-dragging');
    api.seek(pctFromEvent(e) * duration());
  });
  progress.addEventListener('pointermove', (e) => {
    const p = pctFromEvent(e);
    showPreview(p);
    if (progress.classList.contains('is-dragging')) api.seek(p * duration());
  });
  progress.addEventListener('pointerup', () => progress.classList.remove('is-dragging'));
  progress.addEventListener('pointerleave', () => { preview.hidden = true; paintSegments('.progress__hover', 0); });
  progress.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); api.seekBy(5); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); api.seekBy(-5); }
  });

  function onFullscreen() {
    const fs = document.fullscreenElement === el;
    q('[data-act="fullscreen"]').innerHTML = svg(fs ? 'exitFullscreen' : 'fullscreen');
    q('[data-act="fullscreen"]').setAttribute('aria-label', fs ? 'Sair da tela cheia (F)' : 'Tela cheia (F)');
  }
  document.addEventListener('fullscreenchange', onFullscreen);

  /* Estado inicial */
  if (!real && opts.startAt) engine.time = opts.startAt;
  buildSegments();
  updateTime();
  updateState();
  updateVolume();
  updateAmbient();

  return api;
}
