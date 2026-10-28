/* =========================================================
   VOCETUBE — ligação com o back-end (Java)
   Tudo o que o site mostra e guarda vem do servidor (ServidorVideos.java):

     GET    /api/categorias            categorias e ícones
     GET    /api/canais                canais
     GET    /api/videos/detalhes       vídeos completos (os de exemplo e os enviados)
     GET    /api/comentarios           comentários de exemplo
     GET    /api/estado                curtidas, histórico, preferências... (ver storage.js)
     POST   /api/uploads               cria um vídeo enviado
     PUT    /api/uploads/ID/arquivo    envia o arquivo do vídeo
     GET    /api/uploads/ID/arquivo    toca o vídeo
     DELETE /api/uploads/ID            apaga um vídeo enviado
     DELETE /api/estado                apaga todos os dados do usuário

   (GET /api/videos continua existindo com os 4 campos: id, titulo, urlThumbnail, nomeCanal.)
   ========================================================= */

/* Aberto pelo próprio servidor (http://localhost:8080) usa o mesmo endereço.
   Aberto direto do arquivo (index.html), usa o servidor local na porta 8080.
   Para apontar para outro endereço, defina window.VOCETUBE_API antes dos scripts. */
const API_BASE = window.VOCETUBE_API ?? (location.protocol === 'file:' ? 'http://localhost:8080' : '');

const VideoApi = {
  online: false,

  /* Busca tudo no servidor e preenche CATEGORIES, CAT_ICONS, CHANNELS, VIDEOS, COMMENT_POOL e o Store. */
  async load() {
    try {
      const [categorias, canais, videos, comentarios, estado] = await Promise.all([
        pegar('/api/categorias'),
        pegar('/api/canais'),
        pegar('/api/videos/detalhes'),
        pegar('/api/comentarios'),
        pegar('/api/estado')
      ]);
      if (![categorias, canais, videos, comentarios].every(Array.isArray)) throw new Error('Resposta inesperada da API');

      CATEGORIES.length = 0;
      Object.keys(CAT_ICONS).forEach((k) => delete CAT_ICONS[k]);
      categorias.forEach((c) => { CATEGORIES.push(c.nome); CAT_ICONS[c.nome] = c.icone; });

      Object.keys(CHANNELS).forEach((k) => delete CHANNELS[k]);
      canais.forEach((c) => {
        CHANNELS[c.chave] = {
          name: c.nome, handle: c.handle, ini: c.inicial, color: c.cor,
          followers: c.seguidores, joined: c.entrou, about: c.sobre
        };
      });

      VIDEOS.length = 0;
      videos.filter((v) => !v.enviado).forEach((v) => VIDEOS.push(converter(v)));
      const uploads = videos.filter((v) => v.enviado).map(converterUpload);   // o servidor já manda do mais novo para o mais antigo

      COMMENT_POOL.length = 0;
      comentarios.forEach((c) => COMMENT_POOL.push({
        name: c.nome, ini: c.inicial, color: c.cor, text: c.texto, likes: c.curtidas, days: c.dias
      }));

      Store.hydrate(estado, uploads);
      this.online = true;
    } catch (err) {
      console.error('Não foi possível carregar os dados do servidor.', err);
      this.online = false;
    }
    return this.online;
  },

  /* Envia um vídeo: primeiro cria o registro (título, descrição...), depois manda o arquivo.
     Devolve o vídeo no formato de Store.data.uploads. Se algo falhar, desfaz o registro. */
  async enviar(file, { titulo, descricao, categoria, duracao, miniatura }) {
    const criado = await chamar('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao, categoria, duracao, miniatura, nomeArquivo: file.name })
    });
    try {
      const pronto = await chamar(`/api/uploads/${criado.id}/arquivo`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'video/mp4' },
        body: file
      });
      return converterUpload(pronto);
    } catch (err) {
      fetch(`${API_BASE}/api/uploads/${criado.id}`, { method: 'DELETE' }).catch(() => {});
      throw err;
    }
  },

  /* Apaga um vídeo enviado (registro, arquivo e miniatura no servidor). */
  async excluir(id) {
    const resp = await fetch(`${API_BASE}/api/uploads/${id}`, { method: 'DELETE' });
    if (!resp.ok && resp.status !== 404) throw new Error(await mensagemDeErro(resp));
  },

  /* Endereço do arquivo de um vídeo enviado (o player pede aos poucos, então dá para avançar e voltar). */
  urlDoVideo(id) {
    return `${API_BASE}/api/uploads/${id}/arquivo`;
  },

  /* Baixa o arquivo de um vídeo enviado como Blob (para o botão "Baixar"). */
  async baixar(id) {
    const resp = await fetch(this.urlDoVideo(id));
    if (!resp.ok) throw new Error(await mensagemDeErro(resp));
    return resp.blob();
  }
};

/* ---------- Conversas com o servidor ---------- */

async function pegar(caminho) {
  const resp = await fetch(API_BASE + caminho, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} em ${caminho}`);
  return resp.json();
}

/* Faz o pedido e devolve o JSON da resposta; em caso de erro, lança uma mensagem legível */
async function chamar(caminho, opcoes) {
  let resp;
  try {
    resp = await fetch(API_BASE + caminho, opcoes);
  } catch {
    throw new Error('Não foi possível falar com o servidor.');
  }
  if (!resp.ok) throw new Error(await mensagemDeErro(resp));
  return resp.json();
}

/* O servidor responde erros como {"erro": "mensagem"} */
async function mensagemDeErro(resp) {
  try {
    const corpo = await resp.json();
    if (corpo && corpo.erro) return corpo.erro;
  } catch { /* sem corpo JSON */ }
  return `Erro ${resp.status} no servidor.`;
}

/* ---------- Do formato do servidor (português) para o formato que o site usa ---------- */

function converter(v) {
  return {
    id: String(v.id),
    ch: v.canal,
    cat: v.categoria,
    title: v.titulo,
    desc: v.descricao || '',
    dur: v.duracao,
    views: v.visualizacoes,
    days: v.dias,
    likes: v.curtidas,
    c1: v.cor1,
    c2: v.cor2,
    thumb: v.urlThumbnail || ''
  };
}

function converterUpload(v) {
  return {
    id: String(v.id),
    title: v.titulo,
    desc: v.descricao || '',
    cat: v.categoria,
    dur: v.duracao,
    thumb: v.urlThumbnail || null,
    fileName: v.nomeArquivo,
    created: v.criadoEm
  };
}
