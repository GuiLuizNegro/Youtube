package Youtube_Archives;

public class Video {

    private String id;
    private String titulo;
    private String urlThumbnail;
    private String nomeCanal;

    public Video(String id, String titulo, String urlThumbnail, String nomeCanal) {
        this.id = id;
        this.titulo = titulo;
        this.urlThumbnail = urlThumbnail;
        this.nomeCanal = nomeCanal;
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

    public void exibirVideo() {
        System.out.println("ID: " + id);
        System.out.println("Thumbnail: " + urlThumbnail);
        System.out.println("Título: " + titulo);
        System.out.println("Canal: " + nomeCanal);
    }

}
