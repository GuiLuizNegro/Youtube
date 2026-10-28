package Youtube_Archives;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Banco de dados do VoceTube, em Java puro (sem bibliotecas externas).
 *
 * Guarda tudo o que antes ficava no front-end:
 *   - catálogo: categorias, canais, vídeos e comentários de exemplo (antes: js/data.js)
 *   - estado do usuário: curtidas, histórico, comentários, preferências... (antes: localStorage)
 *   - arquivos dos vídeos enviados e suas miniaturas (antes: IndexedDB)
 *
 * No disco fica assim (a pasta "dados" é criada na raiz do projeto):
 *   dados/banco.json          tudo, menos os arquivos de vídeo
 *   dados/uploads/ID.bin      arquivo do vídeo enviado
 *   dados/uploads/ID.jpg      miniatura do vídeo enviado
 *
 * Todos os métodos públicos são sincronizados: o servidor atende vários pedidos ao mesmo tempo.
 */
public class BancoDeDados {

    /** IDs de vídeo só podem ter letras, números, _ e - (evita acessar outras pastas). */
    private static final Pattern ID_VALIDO = Pattern.compile("[A-Za-z0-9_-]{1,40}");
    private static final SecureRandom SORTEIO = new SecureRandom();

    private final Path arquivoBanco;     // null = banco só em memória
    private final Path pastaUploads;     // null = sem arquivos de vídeo

    private List<Categoria> categorias;
    private List<Canal> canais;
    private final List<Video> videos = new ArrayList<>();   // enviados primeiro (mais novo antes), depois os de exemplo
    private List<ComentarioExemplo> comentarios;
    private EstadoUsuario estado = EstadoUsuario.padrao();

    private BancoDeDados(Path arquivoBanco, Path pastaUploads) {
        this.arquivoBanco = arquivoBanco;
        this.pastaUploads = pastaUploads;
    }

    // ------------------------------------------------------------ criação

    /** Abre o banco na pasta indicada. Se ainda não existir, cria já com os dados iniciais. */
    public static BancoDeDados abrir(Path pastaDados) {
        Path banco = pastaDados.resolve("banco.json");
        Path uploads = pastaDados.resolve("uploads");
        try {
            Files.createDirectories(uploads);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível criar a pasta " + pastaDados, e);
        }

        BancoDeDados b = new BancoDeDados(banco, uploads);
        if (Files.isRegularFile(banco)) {
            b.carregar();
        } else {
            b.carregarDadosIniciais();
            b.salvar();
        }
        return b;
    }

    /** Banco só em memória, com os dados iniciais (nada é gravado em disco). */
    public static BancoDeDados emMemoria() {
        BancoDeDados b = new BancoDeDados(null, null);
        b.carregarDadosIniciais();
        return b;
    }

    /** Banco só em memória, apenas com os vídeos informados (pode ser lista vazia). */
    public static BancoDeDados emMemoria(List<Video> listaDeVideos) {
        BancoDeDados b = new BancoDeDados(null, null);
        b.categorias = DadosIniciais.categorias();
        b.canais = DadosIniciais.canais();
        b.comentarios = DadosIniciais.comentarios();
        if (listaDeVideos != null) {
            b.videos.addAll(listaDeVideos);
        }
        return b;
    }

    private void carregarDadosIniciais() {
        categorias = DadosIniciais.categorias();
        canais = DadosIniciais.canais();
        comentarios = DadosIniciais.comentarios();
        videos.clear();
        videos.addAll(DadosIniciais.videos());
        estado = EstadoUsuario.padrao();
    }

    // ------------------------------------------------------ leitura do catálogo

    public synchronized List<Categoria> listarCategorias() {
        return new ArrayList<>(categorias);
    }

    public synchronized List<Canal> listarCanais() {
        return new ArrayList<>(canais);
    }

    public synchronized List<ComentarioExemplo> listarComentarios() {
        return new ArrayList<>(comentarios);
    }

    /** Vídeos que já podem aparecer no site (envio incompleto fica de fora). */
    public synchronized List<Video> listarPublicados() {
        List<Video> saida = new ArrayList<>();
        for (Video v : videos) {
            if (v.isPublicado()) {
                saida.add(v);
            }
        }
        return saida;
    }

    public synchronized Optional<Video> buscarVideo(String id) {
        for (Video v : videos) {
            if (v.getId().equals(id)) {
                return Optional.of(v);
            }
        }
        return Optional.empty();
    }

    public synchronized boolean categoriaExiste(String nome) {
        for (Categoria c : categorias) {
            if (c.nome().equals(nome)) {
                return true;
            }
        }
        return false;
    }

    // ------------------------------------------------------ vídeos enviados

    public static boolean idValido(String id) {
        return id != null && ID_VALIDO.matcher(id).matches();
    }

    /** Gera um ID novo para um vídeo enviado (ex.: "u1k9x3ab"). */
    public synchronized String novoIdDeEnvio() {
        String id;
        do {
            id = "u" + Long.toString(System.currentTimeMillis(), 36) + Integer.toString(SORTEIO.nextInt(36 * 36), 36);
        } while (buscarVideo(id).isPresent());
        return id;
    }

    public synchronized void adicionarEnvio(Video video) {
        videos.add(0, video);
        salvar();
    }

    /** Marca o envio como concluído: o arquivo já está no servidor e o vídeo passa a aparecer no site. */
    public synchronized boolean publicarEnvio(String id, String tipoMime) {
        Optional<Video> v = buscarVideo(id);
        if (v.isEmpty() || !v.get().isEnviado()) {
            return false;
        }
        v.get().publicar(tipoMime);
        salvar();
        return true;
    }

    /** Apaga um vídeo enviado (registro, arquivo, miniatura e referências no estado do usuário). */
    public synchronized boolean removerEnvio(String id) {
        Optional<Video> v = buscarVideo(id);
        if (v.isEmpty() || !v.get().isEnviado()) {
            return false;
        }
        videos.remove(v.get());
        estado.esquecerVideo(id);
        apagarArquivos(id);
        salvar();
        return true;
    }

    /** Caminho do arquivo de vídeo enviado (o arquivo pode ainda não existir). */
    public Path arquivoDoVideo(String id) {
        return arquivoDeUpload(id, ".bin");
    }

    /** Caminho da miniatura de um vídeo enviado (o arquivo pode não existir). */
    public Path arquivoDaMiniatura(String id) {
        return arquivoDeUpload(id, ".jpg");
    }

    private Path arquivoDeUpload(String id, String extensao) {
        if (pastaUploads == null || !idValido(id)) {
            throw new IllegalArgumentException("ID de vídeo inválido ou banco sem pasta de arquivos");
        }
        return pastaUploads.resolve(id + extensao);
    }

    public boolean temArquivos() {
        return pastaUploads != null;
    }

    private void apagarArquivos(String id) {
        if (pastaUploads == null) {
            return;
        }
        try {
            Files.deleteIfExists(arquivoDoVideo(id));
            Files.deleteIfExists(arquivoDaMiniatura(id));
        } catch (IOException e) {
            System.err.println("Não foi possível apagar os arquivos do vídeo " + id + ": " + e.getMessage());
        }
    }

    // ------------------------------------------------------ estado do usuário

    /** Estado do usuário já em JSON (montado dentro do bloqueio, para ser consistente). */
    public synchronized String estadoComoJson() {
        return Json.escrever(estado.paraMapa());
    }

    public synchronized String temaSalvo() {
        return estado.theme;
    }

    public synchronized void salvarEstado(EstadoUsuario novo) {
        this.estado = novo;
        salvar();
    }

    /** "Apagar todos os dados": volta o estado ao padrão e apaga os vídeos enviados. */
    public synchronized void resetarUsuario() {
        List<Video> enviados = new ArrayList<>();
        for (Video v : videos) {
            if (v.isEnviado()) {
                enviados.add(v);
            }
        }
        for (Video v : enviados) {
            apagarArquivos(v.getId());
        }
        videos.removeAll(enviados);
        estado = EstadoUsuario.padrao();
        salvar();
    }

    // ------------------------------------------------------ gravação e leitura em disco

    private void salvar() {
        if (arquivoBanco == null) {
            return;
        }
        Map<String, Object> raiz = new LinkedHashMap<>();
        raiz.put("versao", 1);

        List<Object> cats = new ArrayList<>();
        for (Categoria c : categorias) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nome", c.nome());
            m.put("icone", c.icone());
            cats.add(m);
        }
        raiz.put("categorias", cats);

        List<Object> cans = new ArrayList<>();
        for (Canal c : canais) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("chave", c.chave());
            m.put("nome", c.nome());
            m.put("handle", c.handle());
            m.put("inicial", c.inicial());
            m.put("cor", c.cor());
            m.put("seguidores", c.seguidores());
            m.put("entrou", c.entrou());
            m.put("sobre", c.sobre());
            cans.add(m);
        }
        raiz.put("canais", cans);

        List<Object> vids = new ArrayList<>();
        for (Video v : videos) {
            vids.add(v.paraMapa());
        }
        raiz.put("videos", vids);

        List<Object> coms = new ArrayList<>();
        for (ComentarioExemplo c : comentarios) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nome", c.nome());
            m.put("inicial", c.inicial());
            m.put("cor", c.cor());
            m.put("texto", c.texto());
            m.put("curtidas", c.curtidas());
            m.put("dias", c.dias());
            coms.add(m);
        }
        raiz.put("comentarios", coms);
        raiz.put("estado", estado.paraMapa());

        try {
            // Grava num arquivo temporário e troca de nome: se o computador desligar no meio, o banco antigo continua inteiro
            Path temporario = arquivoBanco.resolveSibling("banco.json.tmp");
            Files.writeString(temporario, Json.escreverBonito(raiz), StandardCharsets.UTF_8);
            try {
                Files.move(temporario, arquivoBanco, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temporario, arquivoBanco, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível gravar " + arquivoBanco, e);
        }
    }

    private void carregar() {
        try {
            Map<String, Object> raiz = Json.lerObjeto(Files.readString(arquivoBanco, StandardCharsets.UTF_8));

            categorias = new ArrayList<>();
            for (Map<String, Object> m : Json.listaDeObjetos(raiz, "categorias")) {
                categorias.add(new Categoria(Json.texto(m, "nome"), Json.texto(m, "icone")));
            }

            canais = new ArrayList<>();
            for (Map<String, Object> m : Json.listaDeObjetos(raiz, "canais")) {
                canais.add(new Canal(Json.texto(m, "chave"), Json.texto(m, "nome"), Json.texto(m, "handle"),
                        Json.texto(m, "inicial"), Json.texto(m, "cor"), (long) Json.numero(m, "seguidores", 0),
                        Json.texto(m, "entrou"), Json.texto(m, "sobre")));
            }

            videos.clear();
            for (Map<String, Object> m : Json.listaDeObjetos(raiz, "videos")) {
                videos.add(Video.deMapa(m));
            }

            comentarios = new ArrayList<>();
            for (Map<String, Object> m : Json.listaDeObjetos(raiz, "comentarios")) {
                comentarios.add(new ComentarioExemplo(Json.texto(m, "nome"), Json.texto(m, "inicial"),
                        Json.texto(m, "cor"), Json.texto(m, "texto"), (int) Json.numero(m, "curtidas", 0),
                        (int) Json.numero(m, "dias", 0)));
            }

            estado = EstadoUsuario.deMapa(Json.objeto(raiz, "estado"));
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível ler " + arquivoBanco, e);
        } catch (Json.JsonInvalido e) {
            throw new IllegalStateException("O arquivo " + arquivoBanco + " está com JSON inválido (" + e.getMessage()
                    + "). Corrija o arquivo ou apague-o para recriar o banco com os dados iniciais.", e);
        }
    }
}
