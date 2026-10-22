/* =========================================================
   VOCETUBE — dados de exemplo
   Edite aqui para trocar canais, vídeos e comentários.
   ========================================================= */

const CATEGORIES = ['Games', 'Humor', 'Música', 'Culinária', 'Viagens', 'Esportes', 'Tecnologia'];

/* Ícone (SVG) de cada categoria, usado nas miniaturas */
const CAT_ICONS = {
  'Games': '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M15.5 11.5h.01M18 14h.01"/>',
  'Humor': '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5M9 9.5h.01M15 9.5h.01"/>',
  'Música': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'Culinária': '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M8 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4"/>',
  'Viagens': '<path d="m3 20 6-11 4 7 3-4 5 8z"/><circle cx="17" cy="6" r="2"/>',
  'Esportes': '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8"/>',
  'Tecnologia': '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'
};

/* Canais. A chave "me" é o canal do próprio usuário (vídeos enviados por ele). */
const CHANNELS = {
  me:     { name: 'Meu canal',        handle: '@meucanal',      ini: 'M', color: '#F59E0B', followers: 0,       joined: 'hoje',         about: 'Seus vídeos enviados aparecem aqui.' },
  pipoca: { name: 'Pipoca Cósmica',   handle: '@pipocacosmica', ini: 'P', color: '#F472B6', followers: 412000,  joined: 'mar. de 2019', about: 'Jogos estranhos, finais inesperados e muita pipoca. Vídeo novo toda terça.' },
  gato:   { name: 'Gato Filósofo',    handle: '@gatofilosofo',  ini: 'G', color: '#FBBF24', followers: 268000,  joined: 'ago. de 2020', about: 'Um gato, uma câmera e reflexões que ninguém pediu.' },
  mamao:  { name: 'Mamão com Açúcar', handle: '@mamaocomacucar',ini: 'M', color: '#FB923C', followers: 540000,  joined: 'jun. de 2021', about: 'Receitas fáceis, doces demais e cozinha sem frescura.' },
  nuvem:  { name: 'Dona Nuvem',       handle: '@donanuvem',     ini: 'D', color: '#7DD3FC', followers: 96000,   joined: 'fev. de 2022', about: 'Viagens sem pressa, de mochila e de moto.' },
  tigre:  { name: 'Tigre de Papel',   handle: '@tigredepapel',  ini: 'T', color: '#FDE68A', followers: 83000,   joined: 'out. de 2020', about: 'Humor, esquetes e dublagens de gente e de bicho.' },
  bruxo:  { name: 'Bruxo do Café',    handle: '@bruxodocafe',   ini: 'B', color: '#A78BFA', followers: 1100000, joined: 'jan. de 2018', about: 'Poções de café, músicas de fundo e receitas que parecem feitiço.' },
  lhama:  { name: 'Lhama Elétrica',   handle: '@lhamaeletrica', ini: 'L', color: '#34D399', followers: 630000,  joined: 'jul. de 2019', about: 'Gameplays, speedruns e desafios sem sentido.' },
  panda:  { name: 'Panda Sonolento',  handle: '@pandasonolento',ini: 'P', color: '#A5B4FC', followers: 2800000, joined: 'mai. de 2017', about: 'Música calma para dormir, estudar e fingir que está tudo bem.' },
  cacto:  { name: 'Cacto Falante',    handle: '@cactofalante',  ini: 'C', color: '#86EFAC', followers: 57000,   joined: 'set. de 2023', about: 'Um cacto que comenta tudo, inclusive o que não devia.' },
  pixel:  { name: 'Zé do Pixel',      handle: '@zedopixel',     ini: 'Z', color: '#5EEAD4', followers: 74000,   joined: 'abr. de 2021', about: 'Tecnologia simples, setups baratos e esportes em casa.' }
};

/* Vídeos de exemplo.
   dur = duração em segundos | days = publicado há N dias | c1/c2 = cores da miniatura */
const VIDEOS = [
  { id: 'v1',  ch: 'lhama',  cat: 'Games',      title: 'Zerei o jogo inteiro com um controle quebrado', dur: 1124, views: 128000,  days: 3,   likes: 9400,  c1: '#1E6B47', c2: '#0A2B1C',
    desc: 'Dois botões travados, um direcional bêbado e muita paciência. Veja como foi.\n\n00:00 Introdução\n01:40 O primeiro chefe\n06:10 Desistir? Nunca\n12:30 O final' },
  { id: 'v2',  ch: 'gato',   cat: 'Humor',      title: 'Tentei viver um dia inteiro como um gato', dur: 842,  views: 54000,   days: 7,   likes: 3100,  c1: '#6B5A1E', c2: '#2B240A',
    desc: 'Dormi 16 horas, derrubei objetos da mesa e ignorei todas as ligações.' },
  { id: 'v3',  ch: 'mamao',  cat: 'Culinária',  title: 'Brigadeiro de 7 sabores esquisitos', dur: 1031, views: 1200000, days: 60,  likes: 88000, c1: '#6B3A1E', c2: '#2B160A',
    desc: 'Pimenta, milho, abacate, queijo... qual deles sobreviveu ao teste?\n\n00:00 Abertura\n02:15 Os sabores\n08:40 A votação' },
  { id: 'v4',  ch: 'bruxo',  cat: 'Culinária',  title: 'Pão de queijo perfeito em 5 passos', dur: 937,  views: 310000,  days: 5,   likes: 21000, c1: '#6B1E46', c2: '#2B0A1C',
    desc: 'A receita mineira que não tem erro: ponto da massa, forno e a hora de comer.' },
  { id: 'v5',  ch: 'pixel',  cat: 'Tecnologia', title: 'Os atalhos de teclado que mais economizam tempo', dur: 540,  views: 87000,   days: 14,  likes: 6200,  c1: '#2A1E6B', c2: '#100A2B',
    desc: 'Atalhos do sistema, do navegador e do editor de texto que eu uso todos os dias.' },
  { id: 'v6',  ch: 'tigre',  cat: 'Humor',      title: 'Dublando meu cachorro por uma semana', dur: 765,  views: 203000,  days: 30,  likes: 14000, c1: '#3E2F6B', c2: '#17102B',
    desc: 'Cada latido ganhou uma voz, um sotaque e uma opinião sobre política.' },
  { id: 'v7',  ch: 'nuvem',  cat: 'Viagens',    title: 'Fui a pé até a praia mais distante da ilha', dur: 2468, views: 76000,   days: 21,  likes: 5300,  c1: '#1E4A6B', c2: '#0A1E2B',
    desc: 'Seis horas de caminhada, duas bolhas nos pés e uma praia só nossa.\n\n00:00 Saída\n14:20 Meio da trilha\n31:00 A chegada' },
  { id: 'v8',  ch: 'panda',  cat: 'Música',     title: 'Lo-fi para estudar — 2 horas sem anúncios', dur: 7200, views: 2400000, days: 365, likes: 120000, c1: '#1E2F6B', c2: '#0A102B',
    desc: 'Duas horas de lo-fi para estudar e trabalhar com foco.' },
  { id: 'v9',  ch: 'cacto',  cat: 'Humor',      title: 'Reagindo a vídeos de gente que odeia segunda-feira', dur: 372,  views: 45000,   days: 4,   likes: 2900,  c1: '#24502A', c2: '#0C2010',
    desc: 'Spoiler: o cacto também odeia, mas disfarça melhor.' },
  { id: 'v10', ch: 'pipoca', cat: 'Games',      title: 'Os 7 finais de jogo mais malucos (sem spoiler pesado)', dur: 1290, views: 61000,   days: 6,   likes: 4700,  c1: '#6B1E3A', c2: '#2B0A16',
    desc: 'Ranking dos finais que ninguém viu chegando.' },
  { id: 'v11', ch: 'pixel',  cat: 'Tecnologia', title: 'Montei meu setup com R$ 2.000', dur: 1025, views: 498000,  days: 90,  likes: 33000, c1: '#4A1E6B', c2: '#1D0A2B',
    desc: 'Mesa, cadeira, iluminação e monitor: o que comprei, quanto paguei e o que valeu a pena.' },
  { id: 'v12', ch: 'pixel',  cat: 'Esportes',   title: 'Treino de 10 minutos sem nenhum equipamento', dur: 624,  views: 139000,  days: 30,  likes: 10200, c1: '#1E4E6B', c2: '#0B2233',
    desc: 'Funciona na sala, no quarto ou no corredor do prédio.\n\n00:00 Aquecimento\n01:30 Circuito\n08:00 Alongamento' },
  { id: 'v13', ch: 'tigre',  cat: 'Esportes',   title: 'Aprendi a surfar em 30 dias (quase)', dur: 1368, views: 92000,   days: 45,  likes: 7100,  c1: '#1E3A6B', c2: '#0A162B',
    desc: 'Foram 30 dias, 41 tombos e uma onda de verdade.' },
  { id: 'v14', ch: 'lhama',  cat: 'Games',      title: 'Speedrun de um jogo que ninguém conhece', dur: 860,  views: 38000,   days: 20,  likes: 2600,  c1: '#5A3A20', c2: '#24160A',
    desc: 'Quebrei o recorde por 0,4 segundo. Ninguém ficou sabendo, só eu.' },
  { id: 'v15', ch: 'nuvem',  cat: 'Viagens',    title: 'Estrada da serra de moto: 3 dias de viagem', dur: 1842, views: 210000,  days: 2,   likes: 15000, c1: '#3A5A20', c2: '#16240A',
    desc: 'Roteiro de três dias pelas estradas da serra, com paradas, custos e dicas de hospedagem.' },
  { id: 'v16', ch: 'mamao',  cat: 'Culinária',  title: 'Pizza de frigideira que dá certo', dur: 1105, views: 155000,  days: 12,  likes: 11000, c1: '#6B2A1E', c2: '#2B100A',
    desc: 'Sem forno, sem desculpa: massa, molho e queijo derretendo em 20 minutos.' },
  { id: 'v17', ch: 'panda',  cat: 'Música',     title: 'Piano para dias chuvosos', dur: 3600, views: 870000,  days: 120, likes: 54000, c1: '#2A3A5A', c2: '#0F1624',
    desc: 'Uma hora de piano suave com som de chuva ao fundo.' },
  { id: 'v18', ch: 'bruxo',  cat: 'Música',     title: 'Banda de garagem toca no elevador', dur: 1320, views: 640000,  days: 25,  likes: 41000, c1: '#46295A', c2: '#1D0A2B',
    desc: 'Três músicas, dois andares e um vizinho que pediu bis.' },
  { id: 'v19', ch: 'cacto',  cat: 'Humor',      title: 'Cardápio de restaurante que só tem erro de português', dur: 980,  views: 33000,   days: 1,   likes: 2100,  c1: '#6B4A1E', c2: '#2B1D0A',
    desc: 'Pedi tudo o que estava escrito errado. Foi uma má ideia.' },
  { id: 'v20', ch: 'pipoca', cat: 'Games',      title: 'Joguei só jogos de 1 botão por um mês', dur: 1574, views: 112000,  days: 40,  likes: 8800,  c1: '#5A2A44', c2: '#240A1C',
    desc: 'Um botão, infinitas formas de perder.' }
];

/* Comentários de exemplo (cada vídeo recebe alguns, sorteados de forma fixa) */
const COMMENT_POOL = [
  { name: 'Ana Ribeiro',     ini: 'A', color: '#93C5FD', text: 'Chorei de rir no minuto 3. Obrigada por isso.', likes: 248, days: 2 },
  { name: 'Carlos Menezes',  ini: 'C', color: '#FDBA74', text: 'Faz uma parte 2, por favor?', likes: 96, days: 1 },
  { name: 'Juliana Prado',   ini: 'J', color: '#D8B4FE', text: 'Mandei para todo mundo do grupo da família.', likes: 41, days: 1 },
  { name: 'Rafael Souza',    ini: 'R', color: '#86EFAC', text: 'Vídeo direto ao ponto, sem enrolação. Inscrito!', likes: 132, days: 4 },
  { name: 'Patrícia Lima',   ini: 'P', color: '#FDA4AF', text: 'Qual música toca no começo? Ficou grudada na cabeça.', likes: 18, days: 3 },
  { name: 'Marcos Oliveira', ini: 'M', color: '#FDE68A', text: 'Assisti três vezes e ainda descubro detalhes novos.', likes: 305, days: 6 },
  { name: 'Beatriz Costa',   ini: 'B', color: '#5EEAD4', text: 'O meio do vídeo foi o melhor, sem dúvida.', likes: 27, days: 5 },
  { name: 'Diego Martins',   ini: 'D', color: '#A5B4FC', text: 'Esse canal merece muito mais gente assistindo.', likes: 64, days: 8 }
];
