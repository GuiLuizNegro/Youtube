package Youtube_Archives;

import java.util.List;

public final class DadosIniciais {

    private DadosIniciais() {
    }

    public static List<Categoria> categorias() {
        return List.of(
                new Categoria("Games", "<rect x=\"2\" y=\"7\" width=\"20\" height=\"11\" rx=\"5\"/><path d=\"M7 10v5M4.5 12.5h5M15.5 11.5h.01M18 14h.01\"/>"),
                new Categoria("Humor", "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5M9 9.5h.01M15 9.5h.01\"/>"),
                new Categoria("Música", "<path d=\"M9 18V5l12-2v13\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"18\" cy=\"16\" r=\"3\"/>"),
                new Categoria("Culinária", "<path d=\"M4 11h16a8 8 0 0 1-16 0z\"/><path d=\"M8 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4\"/>"),
                new Categoria("Viagens", "<path d=\"m3 20 6-11 4 7 3-4 5 8z\"/><circle cx=\"17\" cy=\"6\" r=\"2\"/>"),
                new Categoria("Esportes", "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18M3 12h18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8\"/>"),
                new Categoria("Tecnologia", "<rect x=\"3\" y=\"4\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M8 20h8M12 16v4\"/>")
        );
    }

    /** Os canais aparecem no site. */
    public static List<Canal> canais() {
        return List.of(
                new Canal("me", "Meu canal", "@meucanal", "M", "#F59E0B",
                        0L, "hoje",
                        "Seus vídeos enviados aparecem aqui."),
                new Canal("pipoca", "Save Point", "@savepoint", "S", "#F472B6",
                        412000L, "mar. de 2019",
                        "Rankings, curiosidades e história dos videogames. Vídeo novo toda terça."),
                new Canal("gato", "Turma do Improviso", "@turmadoimproviso", "T", "#FBBF24",
                        268000L, "ago. de 2020",
                        "Esquetes de humor sobre trabalho, família e situações do dia a dia."),
                new Canal("mamao", "Cozinha da Bia", "@cozinhadabia", "C", "#FB923C",
                        540000L, "jun. de 2021",
                        "Receitas brasileiras fáceis, do doce ao salgado, explicadas passo a passo."),
                new Canal("nuvem", "Rota Livre", "@rotalivre", "R", "#7DD3FC",
                        96000L, "fev. de 2022",
                        "Roteiros de viagem pelo Brasil, de mochila e de moto, com custos reais."),
                new Canal("tigre", "Corpo em Movimento", "@corpoemmovimento", "C", "#FDE68A",
                        83000L, "out. de 2020",
                        "Treinos em casa, esportes ao ar livre e desafios de 30 dias."),
                new Canal("bruxo", "Estúdio Acústico", "@estudioacustico", "E", "#A78BFA",
                        1100000L, "jan. de 2018",
                        "Sessões acústicas ao vivo com clássicos da música brasileira."),
                new Canal("lhama", "Modo Hard", "@modohard", "M", "#34D399",
                        630000L, "jul. de 2019",
                        "Gameplays, dicas e os melhores lançamentos dos jogos independentes."),
                new Canal("panda", "Som pra Focar", "@somprafocar", "S", "#A5B4FC",
                        2800000L, "mai. de 2017",
                        "Músicas calmas para estudar, trabalhar e relaxar."),
                new Canal("cacto", "Sem Roteiro", "@semroteiro", "S", "#86EFAC",
                        57000L, "set. de 2023",
                        "Vlogs e desafios de humor feitos sem ensaio."),
                new Canal("pixel", "Tech Simples", "@techsimples", "T", "#5EEAD4",
                        74000L, "abr. de 2021",
                        "Tecnologia sem complicação: setups, atalhos e dicas de produtividade.")
        );
    }

    public static List<Video> videos() {
        return List.of(
                new Video("v1", "lhama", "Modo Hard", "Games",
                        "10 jogos indie que merecem sua atenção em 2026",
                        "Uma seleção de jogos independentes com ótimas histórias, trilhas sonoras e mecânicas criativas.\n\n00:00 Introdução\n01:40 Jogos de plataforma\n06:10 Jogos de história\n12:30 Os favoritos do canal",
                        1124, 128000L, 3, 9400L, "#1E6B47", "#0A2B1C"),
                new Video("v2", "gato", "Turma do Improviso", "Humor",
                        "Quando a reunião podia ter sido um e-mail",
                        "Uma hora de reunião, doze pessoas na sala e nenhuma decisão tomada. Quem nunca?",
                        842, 54000L, 7, 3100L, "#6B5A1E", "#2B240A"),
                new Video("v3", "mamao", "Cozinha da Bia", "Culinária",
                        "Brigadeiro gourmet: 5 sabores fáceis para vender",
                        "Massa base, ponto certo e cinco variações que fazem sucesso em festas e encomendas.\n\n00:00 Abertura\n02:15 Massa base\n08:40 Os cinco sabores",
                        1031, 1200000L, 60, 88000L, "#6B3A1E", "#2B160A"),
                new Video("v4", "mamao", "Cozinha da Bia", "Culinária",
                        "Pão de queijo mineiro: receita tradicional",
                        "Polvilho, queijo meia cura e o ponto da massa: o passo a passo para ficar crocante por fora e macio por dentro.\n\n00:00 Ingredientes\n02:30 Escaldando o polvilho\n07:50 Hora do forno",
                        937, 310000L, 5, 21000L, "#6B1E46", "#2B0A1C"),
                new Video("v5", "pixel", "Tech Simples", "Tecnologia",
                        "20 atalhos de teclado que economizam horas no Windows",
                        "Atalhos do sistema, do navegador e do Excel que eu uso todos os dias no trabalho.\n\n00:00 Sistema\n03:10 Navegador\n06:20 Excel",
                        540, 87000L, 14, 6200L, "#2A1E6B", "#100A2B"),
                new Video("v6", "gato", "Turma do Improviso", "Humor",
                        "Os tipos de pessoa no grupo da família",
                        "Quem manda bom dia com figurinha, quem só aparece no aniversário e quem compartilha corrente.",
                        765, 203000L, 30, 14000L, "#3E2F6B", "#17102B"),
                new Video("v7", "nuvem", "Rota Livre", "Viagens",
                        "Jericoacoara: roteiro de 5 dias gastando pouco",
                        "Como chegar, onde ficar, quanto custa cada passeio e o famoso pôr do sol na duna.\n\n00:00 Como chegar\n14:20 Passeios e lagoas\n31:00 Pôr do sol na duna",
                        2468, 76000L, 21, 5300L, "#1E4A6B", "#0A1E2B"),
                new Video("v8", "panda", "Som pra Focar", "Música",
                        "Lo-fi para estudar e focar — 2 horas",
                        "Duas horas de lo-fi para estudar e trabalhar com concentração.",
                        7200, 2400000L, 365, 120000L, "#1E2F6B", "#0A102B"),
                new Video("v9", "cacto", "Sem Roteiro", "Humor",
                        "Segunda-feira de manhã: expectativa x realidade",
                        "O plano era acordar às 6h, treinar e tomar café com calma. O despertador tinha outros planos.",
                        372, 45000L, 4, 2900L, "#24502A", "#0C2010"),
                new Video("v10", "pipoca", "Save Point", "Games",
                        "Os 10 finais mais marcantes da história dos games",
                        "Ranking com os finais que mais emocionaram e surpreenderam os jogadores, com aviso antes de cada spoiler.",
                        1290, 61000L, 6, 4700L, "#6B1E3A", "#2B0A16"),
                new Video("v11", "pixel", "Tech Simples", "Tecnologia",
                        "Montei meu setup completo com R$ 3.000",
                        "Mesa, cadeira, iluminação e monitor: o que comprei, quanto paguei e o que valeu a pena.\n\n00:00 O setup pronto\n02:40 Mesa e cadeira\n09:15 Monitor e periféricos",
                        1025, 498000L, 90, 33000L, "#4A1E6B", "#1D0A2B"),
                new Video("v12", "tigre", "Corpo em Movimento", "Esportes",
                        "Treino de 10 minutos em casa sem equipamento",
                        "Funciona na sala, no quarto ou na varanda. Só precisa de um tapete.\n\n00:00 Aquecimento\n01:30 Circuito\n08:00 Alongamento",
                        624, 139000L, 30, 10200L, "#1E4E6B", "#0B2233"),
                new Video("v13", "tigre", "Corpo em Movimento", "Esportes",
                        "Aprendi a surfar em 30 dias: do zero à primeira onda",
                        "Foram 30 dias de aula, 41 tombos e, finalmente, uma onda de verdade.",
                        1368, 92000L, 45, 7100L, "#1E3A6B", "#0A162B"),
                new Video("v14", "lhama", "Modo Hard", "Games",
                        "Visitei um fliperama retrô cheio de máquinas clássicas",
                        "Pinball, jogos de luta e de corrida: testei os clássicos dos anos 80 e 90.",
                        860, 38000L, 20, 2600L, "#5A3A20", "#24160A"),
                new Video("v15", "nuvem", "Rota Livre", "Viagens",
                        "Serra do Rio do Rastro de moto: 3 dias de estrada",
                        "Roteiro de três dias pela serra catarinense, com paradas, custos e dicas de hospedagem.\n\n00:00 Saída\n10:30 A subida da serra\n24:00 Mirante",
                        1842, 210000L, 2, 15000L, "#3A5A20", "#16240A"),
                new Video("v16", "mamao", "Cozinha da Bia", "Culinária",
                        "Pizza margherita caseira: massa, molho e forno",
                        "Massa de fermentação lenta, molho de tomate fresco e manjericão. Funciona no forno de casa.",
                        1105, 155000L, 12, 11000L, "#6B2A1E", "#2B100A"),
                new Video("v17", "panda", "Som pra Focar", "Música",
                        "Piano relaxante com som de chuva — 1 hora",
                        "Uma hora de piano suave com som de chuva ao fundo, para relaxar ou dormir.",
                        3600, 870000L, 120, 54000L, "#2A3A5A", "#0F1624"),
                new Video("v18", "bruxo", "Estúdio Acústico", "Música",
                        "Violão ao vivo: clássicos da MPB",
                        "Uma sessão acústica com músicas que marcaram gerações, gravada ao vivo no estúdio.",
                        1320, 640000L, 25, 41000L, "#46295A", "#1D0A2B"),
                new Video("v19", "cacto", "Sem Roteiro", "Culinária",
                        "Provei todos os pastéis da feira e dei nota",
                        "Carne, queijo, palmito e os sabores mais estranhos da barraca. Qual ganhou?",
                        980, 33000L, 1, 2100L, "#6B4A1E", "#2B1D0A"),
                new Video("v20", "pipoca", "Save Point", "Games",
                        "Consoles retrô que marcaram a infância nos anos 90",
                        "Do cartucho soprado ao controle com fio curto: os videogames que fizeram história.",
                        1574, 112000L, 40, 8800L, "#5A2A44", "#240A1C")
        );
    }

    public static List<ComentarioExemplo> comentarios() {
        return List.of(
                new ComentarioExemplo("Ana Ribeiro", "A", "#93C5FD",
                        "Conteúdo muito bem feito, aprendi bastante.", 248, 2),
                new ComentarioExemplo("Carlos Menezes", "C", "#FDBA74",
                        "Faz uma parte 2, por favor?", 96, 1),
                new ComentarioExemplo("Juliana Prado", "J", "#D8B4FE",
                        "Mandei para todo mundo do grupo da família.", 41, 1),
                new ComentarioExemplo("Rafael Souza", "R", "#86EFAC",
                        "Vídeo direto ao ponto, sem enrolação. Inscrito!", 132, 4),
                new ComentarioExemplo("Patrícia Lima", "P", "#FDA4AF",
                        "Qual música toca no começo? Ficou grudada na cabeça.", 18, 3),
                new ComentarioExemplo("Marcos Oliveira", "M", "#FDE68A",
                        "Assisti três vezes e ainda descubro detalhes novos.", 305, 6),
                new ComentarioExemplo("Beatriz Costa", "B", "#5EEAD4",
                        "O meio do vídeo foi o melhor, sem dúvida.", 27, 5),
                new ComentarioExemplo("Diego Martins", "D", "#A5B4FC",
                        "Esse canal merece muito mais gente assistindo.", 64, 8)
        );
    }
}
