package Youtube_Archives;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Tudo o que pertence ao usuário (e antes ficava no localStorage do navegador):
 * preferências, canais seguidos, curtidas, salvos, histórico, comentários e visualizações.
 *
 * Os nomes dos campos no JSON são os mesmos que o site já usava (theme, following, liked...),
 * por isso o front-end continua lendo o estado do mesmo jeito.
 */
public class EstadoUsuario {

    private static final int MAX_HISTORICO = 200;
    private static final int MAX_LISTA = 5000;
    private static final int MAX_TEXTO_COMENTARIO = 10000;

    /** Item do histórico: vídeo, posição (segundos) e quando foi assistido. */
    public record ItemHistorico(String id, double pos, long at) {
    }

    /** Comentário escrito pelo usuário. */
    public record ComentarioUsuario(String id, String text, long at) {
    }

    /** Só aceita imagens enviadas como data URL (o site as reduz antes de enviar). */
    private static final Pattern IMAGEM = Pattern.compile(
            "^(data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|img/profile/[a-z0-9_-]+\\.(svg|png|jpg|webp))$");
    private static final int MAX_IMAGEM_AVATAR = 150_000;
    private static final int MAX_IMAGEM_BANNER = 600_000;
    private static final Pattern COR = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    /** Perfil do canal do usuário ("Meu canal"): nome, @handle, sobre, cor, avatar e banner. Vazio = usa o padrão. */
    public static class Perfil {
        // Perfil padrão: canal de games (as imagens ficam em vocetube/img/profile/)
        public String name = "Leonam Games";
        public String handle = "@euleonam";
        public String about = "Gameplays, zeradas e muita resenha de console. Aperte START e bora jogar! Vídeo novo toda semana.";
        public String color = "#A78BFA";
        public String avatar = "img/profile/avatar.svg";
        public String banner = "img/profile/banner.svg";
    }

    public Perfil profile = new Perfil();

    public String theme = null;                       // "dark" | "light" | null (segue o sistema)
    public List<String> following = new ArrayList<>(List.of("pipoca", "gato"));
    public List<String> liked = new ArrayList<>();
    public List<String> disliked = new ArrayList<>();
    public List<String> saved = new ArrayList<>();
    public List<ItemHistorico> history = new ArrayList<>();
    public Map<String, List<ComentarioUsuario>> comments = new LinkedHashMap<>();
    public List<String> commentLikes = new ArrayList<>();
    public Map<String, Long> views = new LinkedHashMap<>();
    public boolean theater = false;
    public boolean autoplay = true;
    public double volume = 1;
    public boolean muted = false;
    public double speed = 1;
    public boolean sidebarMini = false;
    public long notifSeenAt = 0;

    /** Estado de quem acabou de chegar (ou depois de "apagar todos os dados"). */
    public static EstadoUsuario padrao() {
        return new EstadoUsuario();
    }

    public Map<String, Object> paraMapa() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("theme", theme);
        m.put("following", following);
        m.put("liked", liked);
        m.put("disliked", disliked);
        m.put("saved", saved);

        List<Object> hist = new ArrayList<>();
        for (ItemHistorico h : history) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", h.id());
            item.put("pos", h.pos());
            item.put("at", h.at());
            hist.add(item);
        }
        m.put("history", hist);

        Map<String, Object> coment = new LinkedHashMap<>();
        for (Map.Entry<String, List<ComentarioUsuario>> e : comments.entrySet()) {
            List<Object> lista = new ArrayList<>();
            for (ComentarioUsuario c : e.getValue()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", c.id());
                item.put("text", c.text());
                item.put("at", c.at());
                lista.add(item);
            }
            coment.put(e.getKey(), lista);
        }
        m.put("comments", coment);

        m.put("commentLikes", commentLikes);
        m.put("views", views);
        m.put("theater", theater);
        m.put("autoplay", autoplay);
        m.put("volume", volume);
        m.put("muted", muted);
        m.put("speed", speed);
        m.put("sidebarMini", sidebarMini);
        m.put("notifSeenAt", notifSeenAt);

        Map<String, Object> perfil = new LinkedHashMap<>();
        perfil.put("name", profile.name);
        perfil.put("handle", profile.handle);
        perfil.put("about", profile.about);
        perfil.put("color", profile.color);
        perfil.put("avatar", profile.avatar);
        perfil.put("banner", profile.banner);
        m.put("profile", perfil);
        return m;
    }

    /**
     * Monta o estado a partir de um JSON recebido (do arquivo ou do navegador).
     * Campos ausentes ficam com o valor padrão e valores fora do esperado são ajustados.
     */
    public static EstadoUsuario deMapa(Map<String, Object> m) {
        EstadoUsuario e = padrao();

        String tema = Json.texto(m, "theme", "");
        e.theme = tema.equals("dark") || tema.equals("light") ? tema : null;

        if (m.containsKey("following")) {
            e.following = limitar(Json.listaDeTextos(m, "following"));
        }
        e.liked = limitar(Json.listaDeTextos(m, "liked"));
        e.disliked = limitar(Json.listaDeTextos(m, "disliked"));
        e.saved = limitar(Json.listaDeTextos(m, "saved"));
        e.commentLikes = limitar(Json.listaDeTextos(m, "commentLikes"));

        for (Map<String, Object> h : Json.listaDeObjetos(m, "history")) {
            String id = Json.texto(h, "id");
            if (!id.isEmpty() && e.history.size() < MAX_HISTORICO) {
                e.history.add(new ItemHistorico(id, Json.numero(h, "pos", 0), (long) Json.numero(h, "at", 0)));
            }
        }

        for (Map.Entry<String, Object> entrada : Json.objeto(m, "comments").entrySet()) {
            if (!(entrada.getValue() instanceof List)) {
                continue;
            }
            List<ComentarioUsuario> lista = new ArrayList<>();
            for (Object o : (List<?>) entrada.getValue()) {
                if (o instanceof Map && lista.size() < MAX_LISTA) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> c = (Map<String, Object>) o;
                    String texto = Json.texto(c, "text");
                    if (texto.length() > MAX_TEXTO_COMENTARIO) {
                        texto = texto.substring(0, MAX_TEXTO_COMENTARIO);
                    }
                    lista.add(new ComentarioUsuario(Json.texto(c, "id"), texto, (long) Json.numero(c, "at", 0)));
                }
            }
            e.comments.put(entrada.getKey(), lista);
        }

        for (Map.Entry<String, Object> entrada : Json.objeto(m, "views").entrySet()) {
            if (entrada.getValue() instanceof Number) {
                e.views.put(entrada.getKey(), ((Number) entrada.getValue()).longValue());
            }
        }

        e.theater = Json.booleano(m, "theater", false);
        e.autoplay = Json.booleano(m, "autoplay", true);
        e.volume = Math.max(0, Math.min(1, Json.numero(m, "volume", 1)));
        e.muted = Json.booleano(m, "muted", false);
        e.speed = Math.max(0.25, Math.min(4, Json.numero(m, "speed", 1)));
        e.sidebarMini = Json.booleano(m, "sidebarMini", false);
        e.notifSeenAt = (long) Json.numero(m, "notifSeenAt", 0);

        // Estado antigo, sem perfil: mantém o perfil padrão. Se o perfil existe, vale o que o usuário salvou.
        Map<String, Object> p = Json.objeto(m, "profile");
        if (!m.containsKey("profile")) {
            return e;
        }
        e.profile.name = cortar(Json.texto(p, "name", "").trim(), 40);
        e.profile.handle = cortar(Json.texto(p, "handle", "").trim(), 31);
        e.profile.about = cortar(Json.texto(p, "about", "").trim(), 500);
        String cor = Json.texto(p, "color", "");
        e.profile.color = COR.matcher(cor).matches() ? cor : "";
        e.profile.avatar = imagem(Json.texto(p, "avatar", ""), MAX_IMAGEM_AVATAR);
        e.profile.banner = imagem(Json.texto(p, "banner", ""), MAX_IMAGEM_BANNER);
        return e;
    }

    /** Tira de todas as listas/mapas as referências a um vídeo que foi apagado. */
    public void esquecerVideo(String id) {
        saved.remove(id);
        liked.remove(id);
        disliked.remove(id);
        history.removeIf(h -> h.id().equals(id));
        comments.remove(id);
        views.remove(id);
    }

    private static String cortar(String texto, int max) {
        return texto.length() > max ? texto.substring(0, max) : texto;
    }

    /** Devolve a imagem se for um data URL válido e pequeno; senão, vazio. */
    private static String imagem(String url, int max) {
        return url.length() <= max && IMAGEM.matcher(url).matches() ? url : "";
    }

    private static List<String> limitar(List<String> lista) {
        return lista.size() > MAX_LISTA ? new ArrayList<>(lista.subList(0, MAX_LISTA)) : lista;
    }
}
