/* =========================================================
   VOCETUBE — Shorts de exemplo
   Cada Short é um vídeo curto (até 60 s) mostrado na vertical, na página #/shorts.
   Para trocar ou acrescentar Shorts, edite esta lista:
     id     identificador único (use "s" + número)
     ch     chave do canal (a mesma de CHANNELS, ex.: 'mamao', 'nuvem')
     title  título mostrado sobre o vídeo
     tags   hashtags
     dur    duração em segundos (máximo 60)
     likes  curtidas de exemplo
     days   há quantos dias foi publicado
     img    foto vertical (9:16) em img/shorts/
     focus  parte da foto que fica visível ao recortar (CSS object-position)
   Vídeos enviados pelo usuário com até 60 s também entram no Shorts.
   ========================================================= */
const SHORTS = [
  { id: 's01', ch: 'mamao', title: 'Brigadeiro de panela: o ponto certo em 30 segundos', tags: ['receita', 'brigadeiro', 'doce'], dur: 31, likes: 48200, days: 4, img: 'img/shorts/s01.jpg', focus: '50% 50%' },
  { id: 's02', ch: 'mamao', title: 'O segredo do pão de queijo: escaldar o polvilho', tags: ['paodequeijo', 'receita', 'minas'], dur: 38, likes: 31800, days: 9, img: 'img/shorts/s02.jpg', focus: '50% 50%' },
  { id: 's03', ch: 'mamao', title: 'Pizza margherita: 3 ingredientes e forno bem quente', tags: ['pizza', 'receita', 'forno'], dur: 27, likes: 22400, days: 15, img: 'img/shorts/s03.jpg', focus: '50% 50%' },
  { id: 's04', ch: 'nuvem', title: 'Pôr do sol na Duna de Jericoacoara', tags: ['jericoacoara', 'viagem', 'ceara'], dur: 24, likes: 15900, days: 6, img: 'img/shorts/s04.jpg', focus: '50% 50%' },
  { id: 's05', ch: 'nuvem', title: 'Serra do Rio do Rastro: a vista que vale cada curva', tags: ['serra', 'moto', 'santacatarina'], dur: 29, likes: 18700, days: 11, img: 'img/shorts/s05.jpg', focus: '50% 50%' },
  { id: 's06', ch: 'tigre', title: 'Treino de 1 minuto para acordar o corpo', tags: ['treino', 'emcasa', 'saude'], dur: 49, likes: 9300, days: 3, img: 'img/shorts/s06.jpg', focus: '50% 50%' },
  { id: 's07', ch: 'tigre', title: 'Pegando a primeira onda: o que ninguém conta', tags: ['surf', 'iniciante', 'praia'], dur: 33, likes: 12600, days: 20, img: 'img/shorts/s07.jpg', focus: '50% 50%' },
  { id: 's08', ch: 'bruxo', title: 'Violão: 4 acordes que tocam metade da MPB', tags: ['violao', 'mpb', 'aula'], dur: 44, likes: 40100, days: 8, img: 'img/shorts/s08.jpg', focus: '50% 50%' },
  { id: 's09', ch: 'panda', title: 'Piano suave para estudar: 40 segundos de calma', tags: ['piano', 'foco', 'relax'], dur: 40, likes: 27500, days: 2, img: 'img/shorts/s09.jpg', focus: '50% 50%' },
  { id: 's10', ch: 'lhama', title: 'Fliperama retrô: você ainda lembra desta máquina?', tags: ['fliperama', 'retro', 'games'], dur: 22, likes: 8800, days: 13, img: 'img/shorts/s10.jpg', focus: '50% 50%' },
  { id: 's11', ch: 'pipoca', title: 'Consoles dos anos 90: qual era o seu?', tags: ['games', 'nostalgia', 'anos90'], dur: 35, likes: 36400, days: 5, img: 'img/shorts/s11.jpg', focus: '50% 50%' },
  { id: 's12', ch: 'pixel', title: 'Atalho do Windows que quase ninguém conhece', tags: ['windows', 'atalhos', 'produtividade'], dur: 21, likes: 19200, days: 7, img: 'img/shorts/s12.jpg', focus: '50% 50%' },
  { id: 's13', ch: 'pixel', title: 'Setup barato: o que vale a pena comprar', tags: ['setup', 'tecnologia', 'dica'], dur: 47, likes: 14100, days: 18, img: 'img/shorts/s13.jpg', focus: '50% 50%' },
  { id: 's14', ch: 'cacto', title: 'Provei o pastel da feira e dei nota', tags: ['pastel', 'feira', 'comida'], dur: 28, likes: 6700, days: 1, img: 'img/shorts/s14.jpg', focus: '50% 50%' },
  { id: 's15', ch: 'gato', title: 'A reunião de uma hora que cabia em um e-mail', tags: ['humor', 'trabalho', 'reuniao'], dur: 36, likes: 52800, days: 10, img: 'img/shorts/s15.jpg', focus: '50% 50%' },
  { id: 's16', ch: 'cacto', title: 'Segunda-feira de manhã: expectativa x realidade', tags: ['humor', 'segundafeira', 'rotina'], dur: 18, likes: 11300, days: 2, img: 'img/shorts/s16.jpg', focus: '50% 50%' }
];
