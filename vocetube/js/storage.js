/* =========================================================
   VOCETUBE — dados do usuário
   Antes: localStorage (preferências, curtidas, histórico, comentários) e IndexedDB (arquivos de vídeo).
   Agora: tudo fica no servidor (BancoDeDados.java).

   O site trabalha com uma cópia em memória (Store.data), que é carregada de
   GET /api/estado ao abrir (api.js) e enviada de volta com PUT /api/estado a cada
   Store.save(). O envio é agrupado (vários save() seguidos viram um só pedido).
   Os vídeos enviados (uploads) vivem em /api/uploads e não são mandados por aqui.
   ========================================================= */

const DEFAULT_DATA = {
  theme: null,            // 'dark' | 'light' | null (segue o sistema)
  following: ['pipoca', 'gato'],
  liked: [],
  disliked: [],
  saved: [],
  history: [],            // [{ id, pos, at }]
  comments: {},           // { videoId: [{ id, text, at }] }
  commentLikes: [],
  uploads: [],            // [{ id, title, desc, cat, dur, thumb, fileName, created }]  (vem de /api/videos/detalhes)
  views: {},              // visualizações feitas por este usuário { videoId: n }
  theater: false,
  autoplay: true,
  volume: 1,
  muted: false,
  speed: 1,
  sidebarMini: false,
  notifSeenAt: 0
};

const Store = {
  data: structuredClone(DEFAULT_DATA),

  /* Recebe o estado do servidor e a lista de vídeos enviados */
  hydrate(estado, uploads) {
    this.data = { ...structuredClone(DEFAULT_DATA), ...estado, uploads: uploads || [] };
  },

  /* Pede para gravar no servidor (daqui a instantes, juntando vários pedidos seguidos) */
  save() {
    sync.pendente = true;
    clearTimeout(sync.timer);
    sync.timer = setTimeout(() => this.flush(), 400);
  },

  /* Envia agora o que estiver pendente. Com urgente = true (ao fechar a aba) o pedido sobrevive ao fechamento da página. */
  async flush(urgente = false) {
    clearTimeout(sync.timer);
    if (!sync.pendente || (sync.enviando && !urgente)) return;
    sync.pendente = false;
    sync.enviando = true;
    try {
      const { uploads, ...estado } = this.data;      // uploads não vão junto: são geridos por /api/uploads
      const resp = await fetch(`${API_BASE}/api/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estado),
        keepalive: urgente
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      sync.avisou = false;
    } catch (err) {
      console.warn('Não foi possível salvar no servidor.', err);
      sync.pendente = true;
      if (!sync.avisou && typeof toast === 'function') toast('Não foi possível salvar no servidor. Tentando de novo…');
      sync.avisou = true;
      sync.timer = setTimeout(() => this.flush(), 5000);
    } finally {
      sync.enviando = false;
    }
    if (sync.pendente && !sync.avisou) this.flush();   // chegou mais alguma mudança durante o envio
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

  /* Apaga todos os dados do usuário no servidor (inclusive os vídeos enviados) */
  async reset() {
    clearTimeout(sync.timer);
    sync.pendente = false;
    const resp = await fetch(`${API_BASE}/api/estado`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    this.data = structuredClone(DEFAULT_DATA);
  }
};

/* Controle do envio agrupado */
const sync = { timer: null, pendente: false, enviando: false, avisou: false };

/* Ao fechar ou trocar de aba, manda na hora o que ainda não foi enviado */
window.addEventListener('pagehide', () => { Store.flush(true); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Store.flush(true); });
