package Youtube_Archives;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * BE-02 — API de listagem (Java puro, sem frameworks).
 * GET /api/videos -> retorna a lista de vídeos publicados em JSON.
 * BE-03 — Os dados vêm do VideoRepository.
 *
 * Este servidor também entrega o site (pasta "vocetube"):
 * abra http://localhost:8080 no navegador.
 */
public class ServidorVideos {

    // Pasta do site, relativa à raiz do projeto (onde fica a pasta src)
    private static final String PASTA_SITE = "vocetube";

    // Para testar a lista vazia, troque por: new VideoRepository(List.of())
    private static final VideoRepository REPOSITORIO = VideoRepository.DadosTeste();

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

    public static void main(String[] args) throws IOException {
        HttpServer servidor = HttpServer.create(new InetSocketAddress(8080), 0);

        // API: GET /api/videos
        servidor.createContext("/api/videos", troca -> {
            List<Video> videos = REPOSITORIO.listarPublicados();
            byte[] resposta = montarJson(videos).getBytes(StandardCharsets.UTF_8);

            troca.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            // Permite que o front-end (outra porta/origem) acesse a API
            troca.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            troca.sendResponseHeaders(200, resposta.length);

            try (OutputStream saida = troca.getResponseBody()) {
                saida.write(resposta);
            }
        });

        // Site: entrega os arquivos da pasta vocetube (index.html, css, js...)
        Path pastaSite = Path.of(PASTA_SITE).toAbsolutePath().normalize();
        servidor.createContext("/", troca -> entregarArquivo(troca, pastaSite));

        servidor.start();
        System.out.println("API:  http://localhost:8080/api/videos");
        System.out.println("Site: http://localhost:8080");
        if (!Files.isDirectory(pastaSite)) {
            System.out.println("ATENÇÃO: pasta do site não encontrada em " + pastaSite);
            System.out.println("Coloque a pasta '" + PASTA_SITE + "' na raiz do projeto (ao lado da src).");
        }
    }

    // Lê um arquivo da pasta do site e envia para o navegador
    private static void entregarArquivo(HttpExchange troca, Path pastaSite) throws IOException {
        String caminho = troca.getRequestURI().getPath();
        if (caminho.equals("/")) {
            caminho = "/index.html";
        }

        // Resolve o arquivo e garante que ele está dentro da pasta do site
        Path arquivo = pastaSite.resolve(caminho.substring(1)).normalize();
        if (!arquivo.startsWith(pastaSite) || !Files.isRegularFile(arquivo)) {
            byte[] msg = "Arquivo não encontrado".getBytes(StandardCharsets.UTF_8);
            troca.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
            troca.sendResponseHeaders(404, msg.length);
            try (OutputStream saida = troca.getResponseBody()) {
                saida.write(msg);
            }
            return;
        }

        String nome = arquivo.getFileName().toString();
        String extensao = nome.contains(".") ? nome.substring(nome.lastIndexOf('.') + 1).toLowerCase() : "";
        byte[] conteudo = Files.readAllBytes(arquivo);

        troca.getResponseHeaders().set("Content-Type", TIPOS.getOrDefault(extensao, "application/octet-stream"));
        troca.sendResponseHeaders(200, conteudo.length);
        try (OutputStream saida = troca.getResponseBody()) {
            saida.write(conteudo);
        }
    }

    // Transforma a lista de vídeos em texto JSON (lista vazia vira "[]")
    private static String montarJson(List<Video> videos) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < videos.size(); i++) {
            Video v = videos.get(i);
            json.append("{")
                    .append("\"id\":\"").append(escapar(v.getId())).append("\",")
                    .append("\"titulo\":\"").append(escapar(v.getTitulo())).append("\",")
                    .append("\"urlThumbnail\":\"").append(escapar(v.getUrlThumbnail())).append("\",")
                    .append("\"nomeCanal\":\"").append(escapar(v.getNomeCanal())).append("\"")
                    .append("}");
            if (i < videos.size() - 1) {
                json.append(",");
            }
        }
        return json.append("]").toString();
    }

    // Evita quebrar o JSON se o texto tiver aspas ou barras
    private static String escapar(String texto) {
        return texto.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
