/* =========================================================
   VOCETUBE — ligação com o back-end (Java)
   Busca GET /api/videos e troca a lista de vídeos de exemplo
   pelos vídeos que vêm do servidor.

   O servidor entrega 4 campos por vídeo:
     id, titulo, urlThumbnail, nomeCanal
   O resto (categoria, duração, curtidas...) o site completa
   com valores padrão, ou com os dados de exemplo do data.js
   quando o id do vídeo é o mesmo.
   ========================================================= */

const API_URL = 'http://localhost:8080/api/videos';

const VideoApi = {
  online: false,

  /* Busca os vídeos no servidor. Se falhar, mantém os vídeos de exemplo. */
  async load() {
    try {
      const resp = await fetch(API_URL, { headers: { Accept: 'application/json' } });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const lista = await resp.json();
      if (!Array.isArray(lista)) throw new Error('Resposta inesperada da API');

      /* Guarda os dados de exemplo (categoria, duração...) para completar os campos que a API não envia */
      const exemplos = new Map(VIDEOS.map((v) => [v.id, v]));

      /* Troca o conteúdo de VIDEOS (uma lista vazia da API vira um site sem vídeos) */
      VIDEOS.length = 0;
      lista.forEach((item) => VIDEOS.push(converter(item, exemplos.get(item.id))));
      this.online = true;
    } catch (err) {
      console.warn('API fora do ar, usando os vídeos de exemplo.', err);
      this.online = false;
    }
    return this.online;
  }
};

/* Transforma um vídeo da API no formato que o site usa */
function converter(item, exemplo = {}) {
  const ch = acharOuCriarCanal(item.nomeCanal || 'Canal sem nome');
  const cores = coresDoTexto(item.id || item.titulo);
  return {
    id: String(item.id),
    title: item.titulo || 'Sem título',
    thumb: item.urlThumbnail || '',
    ch,
    cat: exemplo.cat || 'Geral',
    dur: exemplo.dur || 600,
    views: exemplo.views || 0,
    days: exemplo.days ?? 1,
    likes: exemplo.likes || 0,
    c1: exemplo.c1 || cores[0],
    c2: exemplo.c2 || cores[1],
    desc: exemplo.desc || ''
  };
}

/* Procura o canal pelo nome; se não existir, cria um novo */
function acharOuCriarCanal(nome) {
  const nomeNorm = nome.trim().toLowerCase();
  const existente = Object.keys(CHANNELS).find((k) => k !== 'me' && CHANNELS[k].name.toLowerCase() === nomeNorm);
  if (existente) return existente;

  const chave = 'api_' + (nomeNorm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '') || 'canal');
  if (!CHANNELS[chave]) {
    CHANNELS[chave] = {
      name: nome.trim(),
      handle: '@' + chave.slice(4),
      ini: nome.trim().charAt(0).toUpperCase(),
      color: coresDoTexto(nome)[2],
      followers: 0,
      joined: 'recentemente',
      about: 'Canal ' + nome.trim() + '.'
    };
  }
  return chave;
}

/* Cores fixas geradas a partir de um texto (miniatura sem imagem) */
function coresDoTexto(texto) {
  let h = 0;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return [`hsl(${h} 45% 28%)`, `hsl(${h} 55% 10%)`, `hsl(${h} 70% 70%)`];
}
