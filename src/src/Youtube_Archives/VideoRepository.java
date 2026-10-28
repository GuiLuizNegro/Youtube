package Youtube_Archives;

import java.util.List;

/**
 * BE-03 — Disponibiliza os dados dos vídeos publicados.
 * Por enquanto usa dados de teste (sem banco de dados).
 * Se um dia usar banco, só esta classe precisa mudar.
 */
public class VideoRepository {

    private final List<Video> videos;

    // Recebe a lista de vídeos publicados (pode ser vazia)
    public VideoRepository(List<Video> videos) {
        this.videos = videos;
    }

    // Cria o repositório já com os dados de teste (os mesmos vídeos do site VoceTube)
    public static VideoRepository DadosTeste() {
        return new VideoRepository(List.of(
                new Video("v1", "Leonam Edson de Oliveira",
                        "C://Users//Usuário\\Pictures\\Screenshots/Leonam.png\"", "Lhama Elétrica"),
                new Video("v2", "Tentei viver um dia inteiro como um gato",
                        "https://exemplo.com/thumbs/v2.jpg", "Gato Filósofo"),
                new Video("v3", "Brigadeiro de 7 sabores esquisitos",
                        "https://exemplo.com/thumbs/v3.jpg", "Mamão com Açúcar"),
                new Video("v4", "Pão de queijo perfeito em 5 passos",
                        "https://exemplo.com/thumbs/v4.jpg", "Bruxo do Café"),
                new Video("v5", "Os atalhos de teclado que mais economizam tempo",
                        "https://exemplo.com/thumbs/v5.jpg", "Zé do Pixel"),
                new Video("v6", "Dublando meu cachorro por uma semana",
                        "https://exemplo.com/thumbs/v6.jpg", "Tigre de Papel"),
                new Video("v7", "Fui a pé até a praia mais distante da ilha",
                        "https://exemplo.com/thumbs/v7.jpg", "Dona Nuvem"),
                new Video("v8", "Lo-fi para estudar — 2 horas sem anúncios",
                        "https://exemplo.com/thumbs/v8.jpg", "Panda Sonolento"),
                new Video("v9", "Reagindo a vídeos de gente que odeia segunda-feira",
                        "https://exemplo.com/thumbs/v9.jpg", "Cacto Falante"),
                new Video("v10", "Os 7 finais de jogo mais malucos (sem spoiler pesado)",
                        "https://exemplo.com/thumbs/v10.jpg", "Pipoca Cósmica"),
                new Video("v11", "Montei meu setup com R$ 2.000",
                        "https://exemplo.com/thumbs/v11.jpg", "Zé do Pixel"),
                new Video("v12", "Treino de 10 minutos sem nenhum equipamento",
                        "https://exemplo.com/thumbs/v12.jpg", "Zé do Pixel"),
                new Video("v13", "Aprendi a surfar em 30 dias (quase)",
                        "https://exemplo.com/thumbs/v13.jpg", "Tigre de Papel"),
                new Video("v14", "Speedrun de um jogo que ninguém conhece",
                        "https://exemplo.com/thumbs/v14.jpg", "Lhama Elétrica"),
                new Video("v15", "Estrada da serra de moto: 3 dias de viagem",
                        "https://exemplo.com/thumbs/v15.jpg", "Dona Nuvem"),
                new Video("v16", "Pizza de frigideira que dá certo",
                        "https://exemplo.com/thumbs/v16.jpg", "Mamão com Açúcar"),
                new Video("v17", "Piano para dias chuvosos",
                        "https://exemplo.com/thumbs/v17.jpg", "Panda Sonolento"),
                new Video("v18", "Banda de garagem toca no elevador",
                        "https://exemplo.com/thumbs/v18.jpg", "Bruxo do Café"),
                new Video("v19", "Cardápio de restaurante que só tem erro de português",
                        "https://exemplo.com/thumbs/v19.jpg", "Cacto Falante"),
                new Video("v20", "Joguei só jogos de 1 botão por um mês",
                        "https://exemplo.com/thumbs/v20.jpg", "Pipoca Cósmica")
        ));
    }

    // Retorna os vídeos publicados. Se não houver nenhum, retorna lista vazia (nunca null).
    public List<Video> listarPublicados() {
        if (videos == null) {
            return List.of();
        }
        return videos;
    }
}