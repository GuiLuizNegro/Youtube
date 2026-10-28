package Youtube_Archives;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

/**
 * BE-03 — Disponibiliza os dados dos vídeos publicados.
 *
 * Agora os dados vêm do BancoDeDados (arquivo dados/banco.json), e não mais de uma lista fixa no código.
 * O resto do sistema continua falando só com esta classe para pegar vídeos.
 */
public class VideoRepository {

    private final BancoDeDados banco;

    // Banco em memória só com a lista informada (pode ser vazia) — útil para testar, ex.: new VideoRepository(List.of())
    public VideoRepository(List<Video> videos) {
        this(BancoDeDados.emMemoria(videos));
    }

    public VideoRepository(BancoDeDados banco) {
        this.banco = banco;
    }

    // Repositório em memória com os dados de teste (os mesmos vídeos do site VoceTube), sem gravar nada em disco
    public static VideoRepository DadosTeste() {
        return new VideoRepository(BancoDeDados.emMemoria());
    }

    // Repositório de verdade: abre (ou cria) o banco na pasta indicada
    public static VideoRepository abrir(Path pastaDados) {
        return new VideoRepository(BancoDeDados.abrir(pastaDados));
    }

    public BancoDeDados getBanco() {
        return banco;
    }

    // Retorna os vídeos publicados. Se não houver nenhum, retorna lista vazia (nunca null).
    public List<Video> listarPublicados() {
        return banco.listarPublicados();
    }

    public Optional<Video> buscarPorId(String id) {
        return banco.buscarVideo(id);
    }
}
