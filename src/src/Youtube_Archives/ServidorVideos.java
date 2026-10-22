package Youtube_Archives;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * BE-02 — API de listagem (Java puro, sem frameworks).
 * GET /api/videos -> retorna a lista de vídeos publicados em JSON.
 * BE-03 — Os dados vêm do VideoRepository.
 * BE-04 — Métodos diferentes de GET retornam 405.
 */
public class ServidorVideos {

    // Para testar a lista vazia, troque por: new VideoRepository(List.of())
    private static final VideoRepository REPOSITORIO = VideoRepository.DadosTeste();

    public static void main(String[] args) throws IOException {
        HttpServer servidor = HttpServer.create(new InetSocketAddress(8080), 0);

        servidor.createContext("/api/videos", troca -> {

            // Só aceita GET
            if (!"GET".equalsIgnoreCase(troca.getRequestMethod())) {
                byte[] erro = "{\"erro\":\"Metodo nao permitido\"}".getBytes(StandardCharsets.UTF_8);
                troca.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
                troca.getResponseHeaders().set("Allow", "GET");
                troca.sendResponseHeaders(405, erro.length);
                try (OutputStream saida = troca.getResponseBody()) {
                    saida.write(erro);
                }
                return;
            }

            List<Video> videos = REPOSITORIO.listarPublicados();
            byte[] resposta = montarJson(videos).getBytes(StandardCharsets.UTF_8);

            troca.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            troca.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            troca.sendResponseHeaders(200, resposta.length);

            try (OutputStream saida = troca.getResponseBody()) {
                saida.write(resposta);
            }
        });

        servidor.start();
        System.out.println("Servidor rodando em http://localhost:8080/api/videos");
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