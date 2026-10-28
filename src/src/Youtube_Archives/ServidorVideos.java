package Youtube_Archives;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.channels.Channels;
import java.nio.channels.SeekableByteChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Executors;

/**
 * Servidor do VoceTube (Java puro, sem frameworks).
 *
 * BE-02 — GET /api/videos -> lista de vídeos publicados em JSON (id, titulo, urlThumbnail, nomeCanal).
 * BE-04 — Métodos diferentes de GET em /api/videos retornam 405.
 * BE-03 — Os dados vêm do VideoRepository / BancoDeDados (arquivo dados/banco.json).
 *
 * Rotas da API:
 *   GET    /api/videos                     lista resumida (contrato do BE-02/BE-04)
 *   GET    /api/videos/detalhes            vídeos completos (categoria, duração, curtidas, cores...)
 *   GET    /api/categorias                 categorias e ícones
 *   GET    /api/canais                     canais
 *   GET    /api/comentarios                comentários de exemplo
 *   GET    /api/estado                     estado do usuário (curtidas, histórico, preferências...)
 *   PUT    /api/estado                     grava o estado do usuário
 *   DELETE /api/estado                     apaga todos os dados do usuário (inclusive vídeos enviados)
 *   POST   /api/uploads                    cria um vídeo enviado (dados do vídeo em JSON)
 *   PUT    /api/uploads/{id}/arquivo       envia o arquivo do vídeo (corpo = bytes do vídeo)
 *   GET    /api/uploads/{id}/arquivo       toca/baixa o vídeo (aceita Range, para avançar no player)
 *   GET    /api/uploads/{id}/miniatura     miniatura do vídeo enviado
 *   DELETE /api/uploads/{id}               apaga um vídeo enviado
 *
 * Este servidor também entrega o site (pasta "vocetube"):
 * abra http://localhost:8080 no navegador.
 *
 * Opções (variáveis de ambiente, todas opcionais): PORTA, PASTA_SITE, PASTA_DADOS.
 */
public class ServidorVideos {

    private static final int PORTA_PADRAO = 8080;
    private static final int LIMITE_JSON = 5 * 1024 * 1024;               // 5 MB para corpos JSON
    private static final long LIMITE_VIDEO = 2L * 1024 * 1024 * 1024;     // 2 GB por vídeo
    private static final int LIMITE_MINIATURA = 2 * 1024 * 1024;          // 2 MB
    private static final String MARCA_TEMA = "<!--VOCETUBE_TEMA-->";

    // Tipos de arquivo que o site usa
    private static final Map<String, String> TIPOS = Map.ofEntries(
            Map.entry("html", "text/html; charset=utf-8"),
            Map.entry("css", "text/css; charset=utf-8"),
            Map.entry("js", "text/javascript; charset=utf-8"),
            Map.entry("json", "application/json; charset=utf-8"),
            Map.entry("txt", "text/plain; charset=utf-8"),
            Map.entry("svg", "image/svg+xml"),
            Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("webp", "image/webp"),
            Map.entry("ico", "image/x-icon"),
            Map.entry("woff2", "font/woff2")
    );

    private final VideoRepository repositorio;
    private final BancoDeDados banco;
    private final Path pastaSite;

    public ServidorVideos(VideoRepository repositorio, Path pastaSite) {
        this.repositorio = repositorio;
        this.banco = repositorio.getBanco();
        this.pastaSite = pastaSite;
    }

    public static void main(String[] args) throws IOException {
        int porta = Integer.parseInt(valorDe("PORTA", String.valueOf(PORTA_PADRAO)));
        Path raiz = descobrirRaizDoProjeto();
        Path pastaSite = Path.of(valorDe("PASTA_SITE", raiz.resolve("vocetube").toString())).toAbsolutePath().normalize();
        Path pastaDados = Path.of(valorDe("PASTA_DADOS", raiz.resolve("dados").toString())).toAbsolutePath().normalize();

        VideoRepository repositorio = VideoRepository.abrir(pastaDados);
        ServidorVideos servidor = new ServidorVideos(repositorio, pastaSite);

        HttpServer http = HttpServer.create(new InetSocketAddress(porta), 0);
        // Vários pedidos ao mesmo tempo (o player pede pedaços do vídeo enquanto a página carrega outras coisas)
        http.setExecutor(Executors.newCachedThreadPool());
        http.createContext("/api", servidor::tratarApi);
        http.createContext("/", servidor::entregarArquivo);
        http.start();

        System.out.println("API:   http://localhost:" + porta + "/api/videos");
        System.out.println("Site:  http://localhost:" + porta);
        System.out.println("Banco: " + pastaDados.resolve("banco.json"));
        if (!Files.isDirectory(pastaSite)) {
            System.out.println("ATENÇÃO: pasta do site não encontrada em " + pastaSite);
            System.out.println("Coloque a pasta 'vocetube' na raiz do projeto (ao lado da src).");
        }
    }

    private static String valorDe(String nome, String padrao) {
        String v = System.getenv(nome);
        return v == null || v.isBlank() ? padrao : v;
    }

    // A pasta "vocetube" fica na raiz do projeto. Normalmente o IntelliJ roda a partir da raiz,
    // mas se rodar de dentro da pasta src, sobe um nível.
    private static Path descobrirRaizDoProjeto() {
        Path atual = Path.of("").toAbsolutePath().normalize();
        for (Path p = atual; p != null && atual.relativize(p).getNameCount() <= 3; p = p.getParent()) {
            if (Files.isDirectory(p.resolve("vocetube"))) {
                return p;
            }
        }
        return atual;
    }

    // ================================================================== API

    private void tratarApi(HttpExchange troca) throws IOException {
        try {
            cabecalhosCors(troca);
            if (troca.getRequestMethod().equals("OPTIONS")) {       // pré-verificação de CORS do navegador
                responderSemCorpo(troca, 204);
                return;
            }
            rotear(troca);
        } catch (ErroHttp e) {
            responderErro(troca, e);
        } catch (Json.JsonInvalido e) {
            responderErro(troca, new ErroHttp(400, "JSON inválido: " + e.getMessage()));
        } catch (Throwable e) {
            e.printStackTrace();
            responderErro(troca, new ErroHttp(500, "Erro interno no servidor"));
        } finally {
            troca.close();
        }
    }

    private void rotear(HttpExchange troca) throws IOException {
        String metodo = troca.getRequestMethod();
        String caminho = troca.getRequestURI().getPath();
        if (caminho.length() > 1 && caminho.endsWith("/")) {
            caminho = caminho.substring(0, caminho.length() - 1);
        }
        String[] partes = caminho.split("/");           // ["", "api", "recurso", ...]

        if (partes.length >= 3 && partes[1].equals("api")) {
            switch (partes[2]) {
                case "videos":
                    if (partes.length == 3) {
                        exigirMetodo(metodo, "GET");
                        listarVideos(troca);
                        return;
                    }
                    if (partes.length == 4 && partes[3].equals("detalhes")) {
                        exigirMetodo(metodo, "GET");
                        listarVideosDetalhados(troca);
                        return;
                    }
                    break;
                case "categorias":
                    if (partes.length == 3) {
                        exigirMetodo(metodo, "GET");
                        listarCategorias(troca);
                        return;
                    }
                    break;
                case "canais":
                    if (partes.length == 3) {
                        exigirMetodo(metodo, "GET");
                        listarCanais(troca);
                        return;
                    }
                    break;
                case "comentarios":
                    if (partes.length == 3) {
                        exigirMetodo(metodo, "GET");
                        listarComentarios(troca);
                        return;
                    }
                    break;
                case "estado":
                    if (partes.length == 3) {
                        estado(troca, metodo);
                        return;
                    }
                    break;
                case "uploads":
                    if (partes.length == 3) {
                        exigirMetodo(metodo, "POST");
                        criarUpload(troca);
                        return;
                    }
                    if (partes.length == 4) {
                        exigirMetodo(metodo, "DELETE");
                        apagarUpload(troca, partes[3]);
                        return;
                    }
                    if (partes.length == 5 && partes[4].equals("arquivo")) {
                        if (metodo.equals("PUT")) {
                            receberArquivo(troca, partes[3]);
                        } else {
                            exigirMetodo(metodo, "GET");
                            entregarVideo(troca, partes[3]);
                        }
                        return;
                    }
                    if (partes.length == 5 && partes[4].equals("miniatura")) {
                        exigirMetodo(metodo, "GET");
                        entregarMiniatura(troca, partes[3]);
                        return;
                    }
                    break;
                default:
                    break;
            }
        }
        throw new ErroHttp(404, "Rota não encontrada");
    }

    // BE-04: qualquer método diferente do permitido responde 405 com o cabeçalho Allow
    private static void exigirMetodo(String metodo, String permitido) {
        if (!metodo.equals(permitido)) {
            ErroHttp e = new ErroHttp(405, "Método não permitido");
            e.allow = permitido;
            throw e;
        }
    }

    // ----------------------------------------------------------- catálogo

    // GET /api/videos -> 4 campos por vídeo (contrato testado no BE-04)
    private void listarVideos(HttpExchange troca) throws IOException {
        String base = urlBase(troca);
        List<Object> lista = new ArrayList<>();
        for (Video v : repositorio.listarPublicados()) {
            Map<String, Object> m = v.paraResumo();
            m.put("urlThumbnail", urlAbsoluta(base, v.getUrlThumbnail()));
            lista.add(m);
        }
        responderJson(troca, 200, Json.escrever(lista));    // lista vazia vira "[]"
    }

    // GET /api/videos/detalhes -> todos os campos (usado pelo site)
    private void listarVideosDetalhados(HttpExchange troca) throws IOException {
        String base = urlBase(troca);
        List<Object> lista = new ArrayList<>();
        for (Video v : repositorio.listarPublicados()) {
            Map<String, Object> m = v.paraMapa();
            m.put("urlThumbnail", urlAbsoluta(base, v.getUrlThumbnail()));
            lista.add(m);
        }
        responderJson(troca, 200, Json.escrever(lista));
    }

    private void listarCategorias(HttpExchange troca) throws IOException {
        List<Object> lista = new ArrayList<>();
        for (Categoria c : banco.listarCategorias()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nome", c.nome());
            m.put("icone", c.icone());
            lista.add(m);
        }
        responderJson(troca, 200, Json.escrever(lista));
    }

    private void listarCanais(HttpExchange troca) throws IOException {
        List<Object> lista = new ArrayList<>();
        for (Canal c : banco.listarCanais()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("chave", c.chave());
            m.put("nome", c.nome());
            m.put("handle", c.handle());
            m.put("inicial", c.inicial());
            m.put("cor", c.cor());
            m.put("seguidores", c.seguidores());
            m.put("entrou", c.entrou());
            m.put("sobre", c.sobre());
            lista.add(m);
        }
        responderJson(troca, 200, Json.escrever(lista));
    }

    private void listarComentarios(HttpExchange troca) throws IOException {
        List<Object> lista = new ArrayList<>();
        for (ComentarioExemplo c : banco.listarComentarios()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nome", c.nome());
            m.put("inicial", c.inicial());
            m.put("cor", c.cor());
            m.put("texto", c.texto());
            m.put("curtidas", c.curtidas());
            m.put("dias", c.dias());
            lista.add(m);
        }
        responderJson(troca, 200, Json.escrever(lista));
    }

    // ----------------------------------------------------------- estado do usuário

    private void estado(HttpExchange troca, String metodo) throws IOException {
        switch (metodo) {
            case "GET":
                responderJson(troca, 200, banco.estadoComoJson());
                break;
            case "PUT":
                banco.salvarEstado(EstadoUsuario.deMapa(Json.lerObjeto(lerTexto(troca, LIMITE_JSON))));
                responderSemCorpo(troca, 204);
                break;
            case "DELETE":
                banco.resetarUsuario();
                responderJson(troca, 200, banco.estadoComoJson());
                break;
            default:
                ErroHttp e = new ErroHttp(405, "Método não permitido");
                e.allow = "GET, PUT, DELETE";
                throw e;
        }
    }

    // ----------------------------------------------------------- vídeos enviados

    // POST /api/uploads: registra o vídeo (título, descrição...). O arquivo vem depois, em PUT .../arquivo.
    private void criarUpload(HttpExchange troca) throws IOException {
        exigirArquivos();
        Map<String, Object> corpo = Json.lerObjeto(lerTexto(troca, LIMITE_JSON));

        String titulo = Json.texto(corpo, "titulo").trim();
        if (titulo.isEmpty()) {
            throw new ErroHttp(400, "Escreva um título para o vídeo");
        }
        if (titulo.length() > 100) {
            titulo = titulo.substring(0, 100);
        }
        String descricao = Json.texto(corpo, "descricao").trim();
        if (descricao.length() > 5000) {
            descricao = descricao.substring(0, 5000);
        }
        String categoria = Json.texto(corpo, "categoria");
        if (!banco.categoriaExiste(categoria)) {
            throw new ErroHttp(400, "Categoria inválida");
        }
        double duracao = Json.numero(corpo, "duracao", 0);
        if (Double.isNaN(duracao) || Double.isInfinite(duracao) || duracao < 0) {
            duracao = 0;
        }
        String nomeArquivo = Json.texto(corpo, "nomeArquivo").replaceAll("[\\\\/\\r\\n]", "_").trim();
        if (nomeArquivo.length() > 200) {
            nomeArquivo = nomeArquivo.substring(0, 200);
        }

        String id = banco.novoIdDeEnvio();
        String urlMiniatura = salvarMiniatura(id, Json.texto(corpo, "miniatura"))
                ? "/api/uploads/" + id + "/miniatura" : "";

        Video video = Video.novoEnvio(id, titulo, descricao, categoria, duracao, urlMiniatura, nomeArquivo);
        banco.adicionarEnvio(video);

        Map<String, Object> m = video.paraMapa();
        m.put("urlThumbnail", urlAbsoluta(urlBase(troca), video.getUrlThumbnail()));
        responderJson(troca, 201, Json.escrever(m));
    }

    // A miniatura chega como "data:image/jpeg;base64,...." e vira um arquivo no servidor
    private boolean salvarMiniatura(String id, String dataUrl) {
        String prefixo = "data:image/jpeg;base64,";
        if (!dataUrl.startsWith(prefixo)) {
            return false;
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(prefixo.length()));
            if (bytes.length == 0 || bytes.length > LIMITE_MINIATURA) {
                return false;
            }
            Files.write(banco.arquivoDaMiniatura(id), bytes);
            return true;
        } catch (IllegalArgumentException | IOException e) {
            return false;
        }
    }

    // PUT /api/uploads/{id}/arquivo: grava os bytes do vídeo e publica o vídeo
    private void receberArquivo(HttpExchange troca, String id) throws IOException {
        exigirArquivos();
        Video video = envioExistente(id);
        if (video.isPublicado()) {
            throw new ErroHttp(409, "Este vídeo já tem arquivo");
        }

        String tipo = troca.getRequestHeaders().getFirst("Content-Type");
        tipo = tipo == null ? "" : tipo.split(";")[0].trim().toLowerCase();
        if (!tipo.startsWith("video/")) {
            throw new ErroHttp(415, "Esse arquivo não é um vídeo. Envie MP4, WebM ou MOV");
        }

        Path destino = banco.arquivoDoVideo(id);
        Path parcial = destino.resolveSibling(id + ".bin.part");
        long total = 0;
        try (InputStream entrada = troca.getRequestBody();
             OutputStream saida = Files.newOutputStream(parcial, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
            byte[] bloco = new byte[64 * 1024];
            int lidos;
            while ((lidos = entrada.read(bloco)) != -1) {
                total += lidos;
                if (total > LIMITE_VIDEO) {
                    throw new ErroHttp(413, "Vídeo grande demais (limite de 2 GB)");
                }
                saida.write(bloco, 0, lidos);
            }
        } catch (ErroHttp | IOException e) {
            Files.deleteIfExists(parcial);
            throw e;
        }
        if (total == 0) {
            Files.deleteIfExists(parcial);
            throw new ErroHttp(400, "O arquivo está vazio");
        }

        Files.move(parcial, destino, StandardCopyOption.REPLACE_EXISTING);
        banco.publicarEnvio(id, tipo);

        Map<String, Object> m = video.paraMapa();
        m.put("urlThumbnail", urlAbsoluta(urlBase(troca), video.getUrlThumbnail()));
        responderJson(troca, 200, Json.escrever(m));
    }

    // GET /api/uploads/{id}/arquivo: entrega o vídeo. Aceita "Range" para o player conseguir avançar e voltar.
    private void entregarVideo(HttpExchange troca, String id) throws IOException {
        exigirArquivos();
        Video video = envioExistente(id);
        Path arquivo = banco.arquivoDoVideo(id);
        if (!video.isPublicado() || !Files.isRegularFile(arquivo)) {
            throw new ErroHttp(404, "O arquivo deste vídeo não foi encontrado");
        }

        long tamanho = Files.size(arquivo);
        long inicio = 0;
        long fim = tamanho - 1;
        int status = 200;

        String range = troca.getRequestHeaders().getFirst("Range");
        if (range != null && range.startsWith("bytes=") && !range.contains(",")) {
            long[] faixa = lerFaixa(range.substring(6).trim(), tamanho);
            if (faixa == null) {
                troca.getResponseHeaders().set("Content-Range", "bytes */" + tamanho);
                throw new ErroHttp(416, "Faixa solicitada fora do arquivo");
            }
            inicio = faixa[0];
            fim = faixa[1];
            status = 206;
        }

        long comprimento = fim - inicio + 1;
        String tipo = video.getTipoMime().isEmpty() ? "application/octet-stream" : video.getTipoMime();
        troca.getResponseHeaders().set("Content-Type", tipo);
        troca.getResponseHeaders().set("Accept-Ranges", "bytes");
        if (status == 206) {
            troca.getResponseHeaders().set("Content-Range", "bytes " + inicio + "-" + fim + "/" + tamanho);
        }
        troca.sendResponseHeaders(status, comprimento == 0 ? -1 : comprimento);

        try (SeekableByteChannel canal = Files.newByteChannel(arquivo, StandardOpenOption.READ);
             OutputStream saida = troca.getResponseBody()) {
            canal.position(inicio);
            InputStream entrada = Channels.newInputStream(canal);
            byte[] bloco = new byte[64 * 1024];
            long restante = comprimento;
            while (restante > 0) {
                int lidos = entrada.read(bloco, 0, (int) Math.min(bloco.length, restante));
                if (lidos == -1) {
                    break;
                }
                saida.write(bloco, 0, lidos);
                restante -= lidos;
            }
        } catch (IOException e) {
            // Normal: o navegador fecha a conexão quando o usuário avança o vídeo ou sai da página
        }
    }

    // "0-99", "100-" ou "-500" (últimos 500 bytes). Devolve {início, fim} ou null se for inválida.
    private static long[] lerFaixa(String texto, long tamanho) {
        try {
            int traco = texto.indexOf('-');
            if (traco < 0 || tamanho == 0) {
                return null;
            }
            String a = texto.substring(0, traco).trim();
            String b = texto.substring(traco + 1).trim();
            long inicio;
            long fim;
            if (a.isEmpty()) {
                long ultimos = Long.parseLong(b);
                if (ultimos <= 0) {
                    return null;
                }
                inicio = Math.max(0, tamanho - ultimos);
                fim = tamanho - 1;
            } else {
                inicio = Long.parseLong(a);
                fim = b.isEmpty() ? tamanho - 1 : Math.min(Long.parseLong(b), tamanho - 1);
            }
            if (inicio < 0 || inicio > fim || inicio >= tamanho) {
                return null;
            }
            return new long[]{inicio, fim};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void entregarMiniatura(HttpExchange troca, String id) throws IOException {
        exigirArquivos();
        envioExistente(id);
        Path arquivo = banco.arquivoDaMiniatura(id);
        if (!Files.isRegularFile(arquivo)) {
            throw new ErroHttp(404, "Este vídeo não tem miniatura");
        }
        byte[] bytes = Files.readAllBytes(arquivo);
        troca.getResponseHeaders().set("Content-Type", "image/jpeg");
        troca.getResponseHeaders().set("Cache-Control", "public, max-age=31536000, immutable");
        troca.sendResponseHeaders(200, bytes.length);
        try (OutputStream saida = troca.getResponseBody()) {
            saida.write(bytes);
        }
    }

    private void apagarUpload(HttpExchange troca, String id) throws IOException {
        exigirArquivos();
        if (!BancoDeDados.idValido(id) || !banco.removerEnvio(id)) {
            throw new ErroHttp(404, "Vídeo enviado não encontrado");
        }
        responderSemCorpo(troca, 204);
    }

    private Video envioExistente(String id) {
        if (!BancoDeDados.idValido(id)) {
            throw new ErroHttp(404, "Vídeo enviado não encontrado");
        }
        Optional<Video> v = banco.buscarVideo(id);
        if (v.isEmpty() || !v.get().isEnviado()) {
            throw new ErroHttp(404, "Vídeo enviado não encontrado");
        }
        return v.get();
    }

    private void exigirArquivos() {
        if (!banco.temArquivos()) {
            throw new ErroHttp(503, "Este servidor está sem pasta de arquivos");
        }
    }

    // ================================================================== Site

    // Lê um arquivo da pasta do site e envia para o navegador
    private void entregarArquivo(HttpExchange troca) throws IOException {
        try {
            String metodo = troca.getRequestMethod();
            if (!metodo.equals("GET") && !metodo.equals("HEAD")) {
                troca.getResponseHeaders().set("Allow", "GET, HEAD");
                enviarTexto(troca, 405, "Método não permitido");
                return;
            }

            String caminho = troca.getRequestURI().getPath();
            if (caminho.equals("/")) {
                caminho = "/index.html";
            }

            // Resolve o arquivo e garante que ele está dentro da pasta do site
            Path arquivo;
            try {
                arquivo = pastaSite.resolve(caminho.substring(1)).normalize();
            } catch (InvalidPathException e) {
                arquivo = null;
            }
            if (arquivo == null || !arquivo.startsWith(pastaSite) || !Files.isRegularFile(arquivo)) {
                enviarTexto(troca, 404, "Arquivo não encontrado");
                return;
            }

            String nome = arquivo.getFileName().toString();
            String extensao = nome.contains(".") ? nome.substring(nome.lastIndexOf('.') + 1).toLowerCase() : "";
            byte[] conteudo = Files.readAllBytes(arquivo);

            // O tema salvo no servidor vai direto na página, para ela não "piscar" claro/escuro ao abrir
            if (nome.equals("index.html")) {
                String tema = banco.temaSalvo();
                String script = tema == null ? "" : "<script>document.documentElement.dataset.theme=\"" + tema + "\";</script>";
                conteudo = new String(conteudo, StandardCharsets.UTF_8).replace(MARCA_TEMA, script).getBytes(StandardCharsets.UTF_8);
                troca.getResponseHeaders().set("Cache-Control", "no-cache");
            }

            troca.getResponseHeaders().set("Content-Type", TIPOS.getOrDefault(extensao, "application/octet-stream"));
            if (metodo.equals("HEAD")) {
                troca.sendResponseHeaders(200, -1);
            } else {
                troca.sendResponseHeaders(200, conteudo.length);
                try (OutputStream saida = troca.getResponseBody()) {
                    saida.write(conteudo);
                }
            }
        } finally {
            troca.close();
        }
    }

    // ================================================================== Utilitários de resposta

    /** Erro com código HTTP; vira {"erro": "..."} para o front-end. */
    private static class ErroHttp extends RuntimeException {
        private static final long serialVersionUID = 1L;

        final int status;
        String allow;

        ErroHttp(int status, String mensagem) {
            super(mensagem);
            this.status = status;
        }
    }

    private static void cabecalhosCors(HttpExchange troca) {
        // Permite que o front-end (outra porta/origem) acesse a API
        troca.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        troca.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        troca.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Range");
        troca.getResponseHeaders().set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
    }

    private static void responderJson(HttpExchange troca, int status, String json) throws IOException {
        byte[] resposta = json.getBytes(StandardCharsets.UTF_8);
        troca.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        troca.getResponseHeaders().set("Cache-Control", "no-store");
        troca.sendResponseHeaders(status, resposta.length);
        try (OutputStream saida = troca.getResponseBody()) {
            saida.write(resposta);
        }
    }

    private static void responderSemCorpo(HttpExchange troca, int status) throws IOException {
        troca.sendResponseHeaders(status, -1);
    }

    private static void responderErro(HttpExchange troca, ErroHttp erro) throws IOException {
        if (erro.allow != null) {
            troca.getResponseHeaders().set("Allow", erro.allow);
        }
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("erro", erro.getMessage());
        if (erro.allow != null) {
            corpo.put("permitido", erro.allow);
        }
        responderJson(troca, erro.status, Json.escrever(corpo));
    }

    private static void enviarTexto(HttpExchange troca, int status, String texto) throws IOException {
        byte[] msg = texto.getBytes(StandardCharsets.UTF_8);
        troca.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        troca.sendResponseHeaders(status, msg.length);
        try (OutputStream saida = troca.getResponseBody()) {
            saida.write(msg);
        }
    }

    // Lê o corpo do pedido como texto, recusando corpos grandes demais
    private static String lerTexto(HttpExchange troca, int limite) throws IOException {
        try (InputStream entrada = troca.getRequestBody()) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] bloco = new byte[8192];
            int lidos;
            while ((lidos = entrada.read(bloco)) != -1) {
                bytes.write(bloco, 0, lidos);
                if (bytes.size() > limite) {
                    throw new ErroHttp(413, "Corpo do pedido grande demais");
                }
            }
            return bytes.toString(StandardCharsets.UTF_8);
        }
    }

    private static String urlBase(HttpExchange troca) {
        String host = troca.getRequestHeaders().getFirst("Host");
        return "http://" + (host == null || host.isBlank() ? "localhost:" + PORTA_PADRAO : host);
    }

    // Caminhos relativos (ex.: /api/uploads/u1/miniatura) viram URL completa; URLs completas e vazias ficam como estão
    private static String urlAbsoluta(String base, String url) {
        return url != null && url.startsWith("/") ? base + url : url;
    }
}
