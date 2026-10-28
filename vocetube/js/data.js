/* =========================================================
   VOCETUBE — contêineres de dados
   Os dados (categorias, canais, vídeos e comentários de exemplo) agora ficam
   no BACK-END, em Java (veja BancoDeDados.java e DadosIniciais.java).
   Estas variáveis começam vazias e o js/api.js as preenche assim que o site abre.
   Para trocar canais, vídeos ou comentários, edite dados/banco.json no servidor.
   ========================================================= */

const CATEGORIES = [];     // ['Games', 'Humor', ...]
const CAT_ICONS = {};      // { 'Games': '<path .../>', ... }  ícone (SVG) de cada categoria
const CHANNELS = {};       // { chave: { name, handle, ini, color, followers, joined, about } }
const VIDEOS = [];         // vídeos de exemplo (os enviados pelo usuário vêm em Store.data.uploads)
const COMMENT_POOL = [];   // comentários de exemplo, distribuídos entre os vídeos
