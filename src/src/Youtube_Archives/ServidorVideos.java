package Youtube_Archives;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * BE-02 — API de listagem (Java puro, sem frameworks).
 * GET /api/videos -> retorna a lista de vídeos em JSON.
 */
public class ServidorVideos {

    // Dados mocados (sem banco de dados)
    private static final List<Video> VIDEOS = List.of(
            new Video("v001", "Construindo um castelo gigante no Minecraft",
                    "https://exemplo.com/thumbs/v001.jpg", "Rezendolas"),
            new Video("v002", "Aventura no Nether com shaders pesados",
                    "https://exemplo.com/thumbs/v002.jpg", "Leonam Edson"),
            new Video("v003", "Tutorial de Java para iniciantes",
                    "https://exemplo.com/thumbs/v003.jpg", "Canal Dev")
    );

    public static void main(String[] args) throws IOException {
        HttpServer servidor = HttpServer.create(new InetSocketAddress(8080), 0);

        servidor.createContext("/api/videos", troca -> {
            byte[] resposta = montarJson().getBytes(StandardCharsets.UTF_8);

            troca.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            // Permite que o front-end (outra porta/origem) acesse a API
            troca.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            troca.sendResponseHeaders(200, resposta.length);

            try (OutputStream saida = troca.getResponseBody()) {
                saida.write(resposta);
            }
        });

        servidor.start();
        System.out.println("Servidor rodando em http://localhost:8080/api/videos");
    }

    // Transforma a lista de vídeos em texto JSON
    private static String montarJson() {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < VIDEOS.size(); i++) {
            Video v = VIDEOS.get(i);
            json.append("{")
                    .append("\"id\":\"").append(escapar(v.getId())).append("\",")
                    .append("\"titulo\":\"").append(escapar(v.getTitulo())).append("\",")
                    .append("\"urlThumbnail\":\"").append(escapar(v.getUrlThumbnail())).append("\",")
                    .append("\"nomeCanal\":\"").append(escapar(v.getNomeCanal())).append("\"")
                    .append("}");
            if (i < VIDEOS.size() - 1) {
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
