/* =========================================================
   VOCETUBE — player
   Funciona de dois jeitos com os mesmos controles:
   - vídeo real (<video>) para os arquivos enviados pelo usuário
   - vídeo de demonstração (simulado) para os vídeos de exemplo
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
  fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  exitFullscreen: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'
};

function svg(name, cls = '') {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" class="${cls}">${ICONS[name]}</svg>`;
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
    get buffered() { return totalSeconds; },
    set rate(r) { rate = r; },
    set volume(v) {}, set muted(m) {},
    destroy() { clearInterval(timer); }
  };
}

/* ---------- Player ---------- */
/**
 * @param {HTMLElement} root  elemento onde o player será montado
 * @param {object} video      vídeo a tocar (com .src para vídeo real)
 * @param {object} opts       { startAt, onEnded, onTime, onNext, onTheater, hasNext }
 */
function createPlayer(root, video, opts = {}) {
  const real = Boolean(video.src);
  const prefs = Store.data;

  root.innerHTML = `
    <div class="player ${real ? 'is-real' : 'is-demo'}" tabindex="0" aria-label="Player de vídeo">
      ${real
        ? `<video class="player__video" src="${video.src}" playsinline preload="metadata"></video>`
        : `<div class="player__demo" style="--c1:${video.c1};--c2:${video.c2}">
             <svg viewBox="0 0 24 24" aria-hidden="true" class="player__demo-icon">${CAT_ICONS[video.cat] || ''}</svg>
             <span class="player__demo-label">Vídeo de demonstração</span>
           </div>`}
      <div class="player__spinner" hidden></div>
      <button class="player__big" aria-label="Reproduzir">${svg('play')}</button>
      <div class="player__next" hidden></div>

      <div class="player__controls">
        <div class="progress" role="slider" tabindex="0" aria-label="Posição do vídeo" aria-valuemin="0">
          <div class="progress__track">
            <div class="progress__buffer"></div>
            <div class="progress__fill"><span class="progress__thumb"></span></div>
          </div>
          <span class="progress__tip" hidden></span>
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
          </div>
          <div class="player__group">
            <button class="switch" data-act="autoplay" aria-label="Reprodução automática" aria-pressed="${prefs.autoplay}"><span></span></button>
            <div class="settings">
              <button class="ctrl" data-act="settings" aria-label="Configurações" aria-haspopup="true" aria-expanded="false">${svg('settings')}</button>
              <div class="settings__menu" role="menu" hidden>
                <span class="settings__title">Velocidade</span>
                ${[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) =>
                  `<button role="menuitemradio" data-speed="${s}" aria-checked="${s === prefs.speed}">${s === 1 ? 'Normal' : String(s).replace('.', ',') + 'x'}</button>`
                ).join('')}
              </div>
            </div>
            <button class="ctrl" data-act="theater" aria-label="Modo cinema (T)">${svg('theater')}</button>
            <button class="ctrl" data-act="fullscreen" aria-label="Tela cheia (F)">${svg('fullscreen')}</button>
          </div>
        </div>
      </div>
    </div>`;

  const el = root.querySelector('.player');
  const q = (s) => el.querySelector(s);
  const engine = real ? videoEngine(q('video')) : demoEngine(video.dur);
  const progress = q('.progress');
  const fill = q('.progress__fill');
  const buffer = q('.progress__buffer');
  const tip = q('.progress__tip');
  const volRange = q('.volume__range');
  const menu = q('.settings__menu');
  let started = false, nextTimer = null, idleTimer = null;

  /* Preferências salvas */
  engine.rate = prefs.speed;
  engine.volume = prefs.volume;
  engine.muted = prefs.muted;
  volRange.value = prefs.muted ? 0 : prefs.volume;

  function duration() { return engine.duration || video.dur || 0; }

  function updateTime() {
    const d = duration();
    const pct = d ? (engine.time / d) * 100 : 0;
    fill.style.width = pct + '%';
    buffer.style.width = (d ? Math.min(100, (engine.buffered / d) * 100) : 0) + '%';
    q('[data-time]').textContent = fmtTime(engine.time);
    q('[data-dur]').textContent = fmtTime(d);
    progress.setAttribute('aria-valuemax', Math.round(d));
    progress.setAttribute('aria-valuenow', Math.round(engine.time));
    progress.setAttribute('aria-valuetext', `${fmtTime(engine.time)} de ${fmtTime(d)}`);
    opts.onTime?.(engine.time, d);
  }

  function updateState() {
    const playing = engine.playing;
    const ended = !playing && engine.time >= duration() - 0.5 && started;
    el.classList.toggle('is-playing', playing);
    el.classList.toggle('is-started', started);
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
      if (!menu.hidden) return;
      el.classList.add('is-idle');
    }, 2500);
  }

  /* ----- Ações públicas ----- */
  const api = {
    play() { cancelNext(); started = true; engine.play(); },
    pause() { engine.pause(); },
    toggle() { engine.playing ? api.pause() : api.play(); },
    seek(t) { engine.time = Math.max(0, Math.min(duration(), t)); updateTime(); },
    seekBy(s) { api.seek(engine.time + s); flash(s > 0 ? `+${s}s` : `${s}s`); },
    setVolume(v) {
      prefs.volume = Math.max(0, Math.min(1, v));
      prefs.muted = prefs.volume === 0;
      engine.volume = prefs.volume; engine.muted = prefs.muted;
      Store.save(); updateVolume();
    },
    toggleMute() {
      prefs.muted = !prefs.muted;
      if (!prefs.muted && prefs.volume === 0) prefs.volume = 0.5;
      engine.muted = prefs.muted; engine.volume = prefs.volume;
      Store.save(); updateVolume();
      flash(prefs.muted ? 'Sem som' : `Volume ${Math.round(prefs.volume * 100)}%`);
    },
    setSpeed(s) {
      prefs.speed = s; engine.rate = s; Store.save();
      menu.querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-checked', Number(b.dataset.speed) === s));
      flash(s === 1 ? 'Velocidade normal' : `${String(s).replace('.', ',')}x`);
    },
    fullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else el.requestFullscreen?.();
    },
    get time() { return engine.time; },
    get duration() { return duration(); },
    destroy() {
      cancelNext(); clearTimeout(idleTimer); engine.destroy();
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('click', onDocClick);
    }
  };

  /* Mensagem rápida no centro do player (ex.: "+10s") */
  let flashTimer;
  function flash(text) {
    let f = q('.player__flash');
    if (!f) { f = document.createElement('div'); f.className = 'player__flash'; el.append(f); }
    f.textContent = text;
    f.classList.add('is-visible');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => f.classList.remove('is-visible'), 700);
  }

  /* ----- Próximo vídeo automático ----- */
  function showNext(next) {
    const box = q('.player__next');
    let left = 5;
    box.hidden = false;
    box.innerHTML = `
      <span class="muted small">A seguir em <strong data-count>${left}</strong></span>
      <strong class="player__next-title">${esc(next.title)}</strong>
      <span class="muted small">${esc(CHANNELS[next.ch].name)}</span>
      <div class="player__next-actions">
        <button class="pill-btn" data-act="cancel-next">Cancelar</button>
        <button class="pill-btn pill-btn--accent" data-act="go-next">Assistir agora</button>
      </div>`;
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
  engine.on('meta', () => { if (opts.startAt) engine.time = opts.startAt; updateTime(); });
  engine.on('state', updateState);
  engine.on('waiting', (w) => { q('.player__spinner').hidden = !w; });
  engine.on('ended', () => {
    updateState();
    opts.onEnded?.();
    if (prefs.autoplay && opts.nextVideo) showNext(opts.nextVideo);
  });

  /* ----- Eventos da interface ----- */
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act], [data-speed]');
    if (btn?.dataset.speed) { api.setSpeed(Number(btn.dataset.speed)); closeMenu(); return; }
    const act = btn?.dataset.act;
    if (act === 'play' || btn?.classList.contains('player__big')) api.toggle();
    else if (act === 'next') opts.onNext?.();
    else if (act === 'mute') api.toggleMute();
    else if (act === 'theater') opts.onTheater?.();
    else if (act === 'fullscreen') api.fullscreen();
    else if (act === 'cancel-next') cancelNext();
    else if (act === 'go-next') { cancelNext(); opts.onNext?.(); }
    else if (act === 'autoplay') {
      prefs.autoplay = !prefs.autoplay; Store.save();
      btn.setAttribute('aria-pressed', prefs.autoplay);
      flash(prefs.autoplay ? 'Reprodução automática ligada' : 'Reprodução automática desligada');
    } else if (act === 'settings') {
      menu.hidden ? openMenu() : closeMenu();
    } else if (!btn && (e.target.closest('.player__video, .player__demo') || e.target === el)) {
      api.toggle();
    }
  });
  q('.player__big').addEventListener('click', (e) => { e.stopPropagation(); api.toggle(); });
  el.addEventListener('dblclick', (e) => { if (!e.target.closest('.player__controls')) api.fullscreen(); });
  el.addEventListener('mousemove', poke);
  el.addEventListener('mouseleave', () => { if (engine.playing) el.classList.add('is-idle'); });

  function openMenu() { menu.hidden = false; q('[data-act="settings"]').setAttribute('aria-expanded', 'true'); }
  function closeMenu() { menu.hidden = true; q('[data-act="settings"]').setAttribute('aria-expanded', 'false'); }
  function onDocClick(e) { if (!e.target.closest('.settings')) closeMenu(); }
  document.addEventListener('click', onDocClick);

  volRange.addEventListener('input', () => api.setVolume(Number(volRange.value)));

  /* Barra de progresso: clicar, arrastar e ver o tempo ao passar o mouse */
  function pctFromEvent(e) {
    const r = progress.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  }
  progress.addEventListener('pointerdown', (e) => {
    progress.setPointerCapture(e.pointerId);
    progress.classList.add('is-dragging');
    api.seek(pctFromEvent(e) * duration());
  });
  progress.addEventListener('pointermove', (e) => {
    const p = pctFromEvent(e);
    tip.hidden = false;
    tip.textContent = fmtTime(p * duration());
    tip.style.left = p * 100 + '%';
    if (progress.classList.contains('is-dragging')) api.seek(p * duration());
  });
  progress.addEventListener('pointerup', () => progress.classList.remove('is-dragging'));
  progress.addEventListener('pointerleave', () => { tip.hidden = true; });
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
  updateTime();
  updateState();
  updateVolume();

  return api;
}
