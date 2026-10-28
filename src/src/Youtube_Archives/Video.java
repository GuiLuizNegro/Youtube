package Youtube_Archives;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Vídeo do catálogo. Os 4 primeiros campos (id, titulo, urlThumbnail, nomeCanal)
 * são os que o GET /api/videos entrega; os demais completam a página do site.
 * Vídeos enviados pelo usuário têm enviado = true e um arquivo guardado no servidor.
 */
public class Video {

    private final String id;
    private final String titulo;
    private final String urlThumbnail;
    private final String nomeCanal;

    private String canal = "me";          // chave do canal (ver Canal)
    private String categoria = "Geral";
    private String descricao = "";
    private double duracao = 600;         // segundos
    private long visualizacoes = 0;
    private int dias = 1;                 // publicado há N dias (vídeos de exemplo)
    private long curtidas = 0;
    private String cor1 = "#1E3A5F";      // cores da miniatura sem imagem
    private String cor2 = "#0B1A2B";

    // Só para vídeos enviados pelo usuário
    private boolean enviado = false;
    private String nomeArquivo = "";
    private String tipoMime = "";
    private long criadoEm = 0;            // milissegundos (epoch)
    private boolean publicado = true;     // enviado fica false até o arquivo chegar

    public Video(String id, String titulo, String urlThumbnail, String nomeCanal) {
        this.id = id;
        this.titulo = titulo;
        this.urlThumbnail = urlThumbnail;
        this.nomeCanal = nomeCanal;
    }

    /** Vídeo de exemplo completo (dados que antes ficavam no data.js do site). */
    public Video(String id, String canal, String nomeCanal, String categoria, String titulo,
                 String descricao, double duracao, long visualizacoes, int dias, long curtidas,
                 String cor1, String cor2) {
        this(id, titulo, "", nomeCanal);
        this.canal = canal;
        this.categoria = categoria;
        this.descricao = descricao;
        this.duracao = duracao;
        this.visualizacoes = visualizacoes;
        this.dias = dias;
        this.curtidas = curtidas;
        this.cor1 = cor1;
        this.cor2 = cor2;
    }

    /** Cria um vídeo enviado pelo usuário (ainda sem arquivo: não aparece nas listas). */
    public static Video novoEnvio(String id, String titulo, String descricao, String categoria,
                                  double duracao, String urlThumbnail, String nomeArquivo) {
        Video v = new Video(id, titulo, urlThumbnail, "Meu canal");
        v.canal = "me";
        v.categoria = categoria;
        v.descricao = descricao;
        v.duracao = duracao;
        v.enviado = true;
        v.nomeArquivo = nomeArquivo;
        v.criadoEm = System.currentTimeMillis();
        v.publicado = false;
        return v;
    }

    public void publicar(String tipoMime) {
        this.tipoMime = tipoMime;
        this.publicado = true;
    }

    public String getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getUrlThumbnail() {
        return urlThumbnail;
    }

    public String getNomeCanal() {
        return nomeCanal;
    }

    public String getCanal() {
        return canal;
    }

    public String getCategoria() {
        return categoria;
    }

    public String getDescricao() {
        return descricao;
    }

    public double getDuracao() {
        return duracao;
    }

    public long getVisualizacoes() {
        return visualizacoes;
    }

    public int getDias() {
        return dias;
    }

    public long getCurtidas() {
        return curtidas;
    }

    public String getCor1() {
        return cor1;
    }

    public String getCor2() {
        return cor2;
    }

    public boolean isEnviado() {
        return enviado;
    }

    public String getNomeArquivo() {
        return nomeArquivo;
    }

    public String getTipoMime() {
        return tipoMime;
    }

    public long getCriadoEm() {
        return criadoEm;
    }

    public boolean isPublicado() {
        return publicado;
    }

    public void exibirVideo() {
        System.out.println("ID: " + id);
        System.out.println("Thumbnail: " + urlThumbnail);
        System.out.println("Título: " + titulo);
        System.out.println("Canal: " + nomeCanal);
    }

    /** Versão resumida (contrato do GET /api/videos): id, titulo, urlThumbnail, nomeCanal. */
    public Map<String, Object> paraResumo() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("titulo", titulo);
        m.put("urlThumbnail", urlThumbnail);
        m.put("nomeCanal", nomeCanal);
        return m;
    }

    /** Versão completa, usada pelo site e gravada no banco. */
    public Map<String, Object> paraMapa() {
        Map<String, Object> m = paraResumo();
        m.put("canal", canal);
        m.put("categoria", categoria);
        m.put("descricao", descricao);
        m.put("duracao", duracao);
        m.put("visualizacoes", visualizacoes);
        m.put("dias", dias);
        m.put("curtidas", curtidas);
        m.put("cor1", cor1);
        m.put("cor2", cor2);
        m.put("enviado", enviado);
        m.put("nomeArquivo", nomeArquivo);
        m.put("tipoMime", tipoMime);
        m.put("criadoEm", criadoEm);
        m.put("publicado", publicado);
        return m;
    }

    public static Video deMapa(Map<String, Object> m) {
        Video v = new Video(Json.texto(m, "id"), Json.texto(m, "titulo"),
                Json.texto(m, "urlThumbnail"), Json.texto(m, "nomeCanal"));
        v.canal = Json.texto(m, "canal", "me");
        v.categoria = Json.texto(m, "categoria", "Geral");
        v.descricao = Json.texto(m, "descricao");
        v.duracao = Json.numero(m, "duracao", 600);
        v.visualizacoes = (long) Json.numero(m, "visualizacoes", 0);
        v.dias = (int) Json.numero(m, "dias", 1);
        v.curtidas = (long) Json.numero(m, "curtidas", 0);
        v.cor1 = Json.texto(m, "cor1", "#1E3A5F");
        v.cor2 = Json.texto(m, "cor2", "#0B1A2B");
        v.enviado = Boolean.TRUE.equals(m.get("enviado"));
        v.nomeArquivo = Json.texto(m, "nomeArquivo");
        v.tipoMime = Json.texto(m, "tipoMime");
        v.criadoEm = (long) Json.numero(m, "criadoEm", 0);
        v.publicado = !Boolean.FALSE.equals(m.get("publicado"));
        return v;
    }
}
