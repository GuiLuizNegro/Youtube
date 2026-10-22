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

    @Override
    public String toString() {
        return "Video{id='" + id + "', titulo='" + titulo
                + "', urlThumbnail='" + urlThumbnail
                + "', nomeCanal='" + nomeCanal + "'}";
    }
}
