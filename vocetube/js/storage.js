/* =========================================================
   VOCETUBE — armazenamento no navegador
   - localStorage: preferências, curtidas, histórico, comentários
   - IndexedDB: arquivos de vídeo enviados pelo usuário
   ========================================================= */

const STORE_KEY = 'vocetube:v1';

const DEFAULT_DATA = {
  theme: null,            // 'dark' | 'light' | null (segue o sistema)
  following: ['pipoca', 'gato'],
  liked: [],
  disliked: [],
  saved: [],
  history: [],            // [{ id, pos, at }]
  comments: {},           // { videoId: [{ id, text, at }] }
  commentLikes: [],
  uploads: [],            // [{ id, title, desc, cat, dur, thumb, created }]
  views: {},              // visualizações feitas neste navegador { videoId: n }
  theater: false,
  autoplay: true,
  volume: 1,
  muted: false,
  speed: 1,
  sidebarMini: false,
  notifSeenAt: 0
};

const Store = {
  data: load(),

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn('Não foi possível salvar os dados.', err);
    }
  },

  /* Listas simples (curtidos, salvos, seguindo...) */
  has(list, id) { return this.data[list].includes(id); },
  toggle(list, id) {
    const arr = this.data[list];
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.unshift(id);
    this.save();
    return i < 0; // true = adicionado
  },
  remove(list, id) {
    const arr = this.data[list];
    const i = arr.indexOf(id);
    if (i >= 0) { arr.splice(i, 1); this.save(); }
  },

  /* Histórico com posição de reprodução */
  historyEntry(id) { return this.data.history.find((h) => h.id === id); },
  touchHistory(id, pos) {
    const h = this.data.history.filter((x) => x.id !== id);
    const prev = this.historyEntry(id);
    h.unshift({ id, pos: pos ?? prev?.pos ?? 0, at: Date.now() });
    this.data.history = h.slice(0, 200);
    this.save();
  },
  setPosition(id, pos) {
    const entry = this.historyEntry(id);
    if (entry) { entry.pos = pos; this.save(); }
  },

  reset() {
    this.data = structuredClone(DEFAULT_DATA);
    this.save();
  }
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) } : structuredClone(DEFAULT_DATA);
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

/* ---------- IndexedDB para os arquivos de vídeo ---------- */
const VideoDB = (() => {
  let dbPromise = null;
  const memory = new Map(); // reserva caso o IndexedDB não esteja disponível

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
      const req = indexedDB.open('vocetube', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('videos');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function run(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('videos', mode);
      const req = fn(tx.objectStore('videos'));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    async put(id, blob) {
      memory.set(id, blob);
      try { await run('readwrite', (s) => s.put(blob, id)); return true; }
      catch { return false; } // fica só na memória desta sessão
    },
    async get(id) {
      if (memory.has(id)) return memory.get(id);
      try { return await run('readonly', (s) => s.get(id)); }
      catch { return null; }
    },
    async remove(id) {
      memory.delete(id);
      try { await run('readwrite', (s) => s.delete(id)); } catch { /* ignora */ }
    },
    async clear() {
      memory.clear();
      try { await run('readwrite', (s) => s.clear()); } catch { /* ignora */ }
    }
  };
})();
