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

    // Cria o repositório já com os dados de teste
    public static VideoRepository DadosTeste() {
        return new VideoRepository(List.of(
                new Video("v001", "Construindo um castelo gigante no Minecraft",
                        "https://exemplo.com/thumbs/v001.jpg", "RezendeMau"),
                new Video("v002", "Aventura no Nether com shaders pesados",
                        "https://exemplo.com/thumbs/v002.jpg", "BigManoelEdson"),
                new Video("v003", "Tutorial de Java para iniciantes",
                        "https://exemplo.com/thumbs/v003.jpg", "Canal Devs")
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