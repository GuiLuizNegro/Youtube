package Youtube_Archives;

import java.util.List;

/**
 * Dados iniciais do VoceTube (antes ficavam no js/data.js do site).
 * São gravados no banco (dados/banco.json) na primeira vez que o servidor sobe;
 * depois disso o que vale é o arquivo do banco.
 */
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

    /** A ordem importa: é a ordem em que os canais aparecem no site. */
    public static List<Canal> canais() {
        return List.of(
                new Canal("me", "Meu canal", "@meucanal", "M", "#F59E0B",
                        0L, "hoje",
                        "Seus vídeos enviados aparecem aqui."),
                new Canal("pipoca", "Pipoca Cósmica", "@pipocacosmica", "P", "#F472B6",
                        412000L, "mar. de 2019",
                        "Jogos estranhos, finais inesperados e muita pipoca. Vídeo novo toda terça."),
                new Canal("gato", "Gato Filósofo", "@gatofilosofo", "G", "#FBBF24",
                        268000L, "ago. de 2020",
                        "Um gato, uma câmera e reflexões que ninguém pediu."),
                new Canal("mamao", "Mamão com Açúcar", "@mamaocomacucar", "M", "#FB923C",
                        540000L, "jun. de 2021",
                        "Receitas fáceis, doces demais e cozinha sem frescura."),
                new Canal("nuvem", "Dona Nuvem", "@donanuvem", "D", "#7DD3FC",
                        96000L, "fev. de 2022",
                        "Viagens sem pressa, de mochila e de moto."),
                new Canal("tigre", "Tigre de Papel", "@tigredepapel", "T", "#FDE68A",
                        83000L, "out. de 2020",
                        "Humor, esquetes e dublagens de gente e de bicho."),
                new Canal("bruxo", "Bruxo do Café", "@bruxodocafe", "B", "#A78BFA",
                        1100000L, "jan. de 2018",
                        "Poções de café, músicas de fundo e receitas que parecem feitiço."),
                new Canal("lhama", "Lhama Elétrica", "@lhamaeletrica", "L", "#34D399",
                        630000L, "jul. de 2019",
                        "Gameplays, speedruns e desafios sem sentido."),
                new Canal("panda", "Panda Sonolento", "@pandasonolento", "P", "#A5B4FC",
                        2800000L, "mai. de 2017",
                        "Música calma para dormir, estudar e fingir que está tudo bem."),
                new Canal("cacto", "Cacto Falante", "@cactofalante", "C", "#86EFAC",
                        57000L, "set. de 2023",
                        "Um cacto que comenta tudo, inclusive o que não devia."),
                new Canal("pixel", "Zé do Pixel", "@zedopixel", "Z", "#5EEAD4",
                        74000L, "abr. de 2021",
                        "Tecnologia simples, setups baratos e esportes em casa.")
        );
    }

    public static List<Video> videos() {
        return List.of(
                new Video("v1", "lhama", "Lhama Elétrica", "Games",
                        "Zerei o jogo inteiro com um controle quebrado",
                        "Dois botões travados, um direcional bêbado e muita paciência. Veja como foi.\n\n00:00 Introdução\n01:40 O primeiro chefe\n06:10 Desistir? Nunca\n12:30 O final",
                        1124, 128000L, 3, 9400L, "#1E6B47", "#0A2B1C"),
                new Video("v2", "gato", "Gato Filósofo", "Humor",
                        "Tentei viver um dia inteiro como um gato",
                        "Dormi 16 horas, derrubei objetos da mesa e ignorei todas as ligações.",
                        842, 54000L, 7, 3100L, "#6B5A1E", "#2B240A"),
                new Video("v3", "mamao", "Mamão com Açúcar", "Culinária",
                        "Brigadeiro de 7 sabores esquisitos",
                        "Pimenta, milho, abacate, queijo... qual deles sobreviveu ao teste?\n\n00:00 Abertura\n02:15 Os sabores\n08:40 A votação",
                        1031, 1200000L, 60, 88000L, "#6B3A1E", "#2B160A"),
                new Video("v4", "bruxo", "Bruxo do Café", "Culinária",
                        "Pão de queijo perfeito em 5 passos",
                        "A receita mineira que não tem erro: ponto da massa, forno e a hora de comer.",
                        937, 310000L, 5, 21000L, "#6B1E46", "#2B0A1C"),
                new Video("v5", "pixel", "Zé do Pixel", "Tecnologia",
                        "Os atalhos de teclado que mais economizam tempo",
                        "Atalhos do sistema, do navegador e do editor de texto que eu uso todos os dias.",
                        540, 87000L, 14, 6200L, "#2A1E6B", "#100A2B"),
                new Video("v6", "tigre", "Tigre de Papel", "Humor",
                        "Dublando meu cachorro por uma semana",
                        "Cada latido ganhou uma voz, um sotaque e uma opinião sobre política.",
                        765, 203000L, 30, 14000L, "#3E2F6B", "#17102B"),
                new Video("v7", "nuvem", "Dona Nuvem", "Viagens",
                        "Fui a pé até a praia mais distante da ilha",
                        "Seis horas de caminhada, duas bolhas nos pés e uma praia só nossa.\n\n00:00 Saída\n14:20 Meio da trilha\n31:00 A chegada",
                        2468, 76000L, 21, 5300L, "#1E4A6B", "#0A1E2B"),
                new Video("v8", "panda", "Panda Sonolento", "Música",
                        "Lo-fi para estudar — 2 horas sem anúncios",
                        "Duas horas de lo-fi para estudar e trabalhar com foco.",
                        7200, 2400000L, 365, 120000L, "#1E2F6B", "#0A102B"),
                new Video("v9", "cacto", "Cacto Falante", "Humor",
                        "Reagindo a vídeos de gente que odeia segunda-feira",
                        "Spoiler: o cacto também odeia, mas disfarça melhor.",
                        372, 45000L, 4, 2900L, "#24502A", "#0C2010"),
                new Video("v10", "pipoca", "Pipoca Cósmica", "Games",
                        "Os 7 finais de jogo mais malucos (sem spoiler pesado)",
                        "Ranking dos finais que ninguém viu chegando.",
                        1290, 61000L, 6, 4700L, "#6B1E3A", "#2B0A16"),
                new Video("v11", "pixel", "Zé do Pixel", "Tecnologia",
                        "Montei meu setup com R$ 2.000",
                        "Mesa, cadeira, iluminação e monitor: o que comprei, quanto paguei e o que valeu a pena.",
                        1025, 498000L, 90, 33000L, "#4A1E6B", "#1D0A2B"),
                new Video("v12", "pixel", "Zé do Pixel", "Esportes",
                        "Treino de 10 minutos sem nenhum equipamento",
                        "Funciona na sala, no quarto ou no corredor do prédio.\n\n00:00 Aquecimento\n01:30 Circuito\n08:00 Alongamento",
                        624, 139000L, 30, 10200L, "#1E4E6B", "#0B2233"),
                new Video("v13", "tigre", "Tigre de Papel", "Esportes",
                        "Aprendi a surfar em 30 dias (quase)",
                        "Foram 30 dias, 41 tombos e uma onda de verdade.",
                        1368, 92000L, 45, 7100L, "#1E3A6B", "#0A162B"),
                new Video("v14", "lhama", "Lhama Elétrica", "Games",
                        "Speedrun de um jogo que ninguém conhece",
                        "Quebrei o recorde por 0,4 segundo. Ninguém ficou sabendo, só eu.",
                        860, 38000L, 20, 2600L, "#5A3A20", "#24160A"),
                new Video("v15", "nuvem", "Dona Nuvem", "Viagens",
                        "Estrada da serra de moto: 3 dias de viagem",
                        "Roteiro de três dias pelas estradas da serra, com paradas, custos e dicas de hospedagem.",
                        1842, 210000L, 2, 15000L, "#3A5A20", "#16240A"),
                new Video("v16", "mamao", "Mamão com Açúcar", "Culinária",
                        "Pizza de frigideira que dá certo",
                        "Sem forno, sem desculpa: massa, molho e queijo derretendo em 20 minutos.",
                        1105, 155000L, 12, 11000L, "#6B2A1E", "#2B100A"),
                new Video("v17", "panda", "Panda Sonolento", "Música",
                        "Piano para dias chuvosos",
                        "Uma hora de piano suave com som de chuva ao fundo.",
                        3600, 870000L, 120, 54000L, "#2A3A5A", "#0F1624"),
                new Video("v18", "bruxo", "Bruxo do Café", "Música",
                        "Banda de garagem toca no elevador",
                        "Três músicas, dois andares e um vizinho que pediu bis.",
                        1320, 640000L, 25, 41000L, "#46295A", "#1D0A2B"),
                new Video("v19", "cacto", "Cacto Falante", "Humor",
                        "Cardápio de restaurante que só tem erro de português",
                        "Pedi tudo o que estava escrito errado. Foi uma má ideia.",
                        980, 33000L, 1, 2100L, "#6B4A1E", "#2B1D0A"),
                new Video("v20", "pipoca", "Pipoca Cósmica", "Games",
                        "Joguei só jogos de 1 botão por um mês",
                        "Um botão, infinitas formas de perder.",
                        1574, 112000L, 40, 8800L, "#5A2A44", "#240A1C")
        );
    }

    public static List<ComentarioExemplo> comentarios() {
        return List.of(
                new ComentarioExemplo("Ana Ribeiro", "A", "#93C5FD",
                        "Chorei de rir no minuto 3. Obrigada por isso.", 248, 2),
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
