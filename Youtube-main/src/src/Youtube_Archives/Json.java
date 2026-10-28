package Youtube_Archives;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Leitor e escritor de JSON em Java puro (o projeto não usa bibliotecas externas).
 *
 * Tipos usados: Map (objeto), List (lista), String, Number, Boolean e null.
 * Números inteiros voltam como Long; os demais como Double.
 */
public final class Json {

    private Json() {
    }

    /** Erro de formato (JSON inválido). */
    public static class JsonInvalido extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public JsonInvalido(String mensagem) {
            super(mensagem);
        }
    }

    // ------------------------------------------------------------------ leitura

    public static Object ler(String texto) {
        Leitor leitor = new Leitor(texto);
        leitor.pularEspacos();
        Object valor = leitor.valor();
        leitor.pularEspacos();
        if (!leitor.fim()) {
            throw new JsonInvalido("Texto sobrando depois do JSON, posição " + leitor.pos);
        }
        return valor;
    }

    /** Lê um JSON que precisa ser um objeto {...}. */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> lerObjeto(String texto) {
        Object o = ler(texto);
        if (!(o instanceof Map)) {
            throw new JsonInvalido("Era esperado um objeto JSON");
        }
        return (Map<String, Object>) o;
    }

    private static final class Leitor {
        private final String s;
        private int pos = 0;

        Leitor(String s) {
            this.s = s;
        }

        boolean fim() {
            return pos >= s.length();
        }

        void pularEspacos() {
            while (pos < s.length() && Character.isWhitespace(s.charAt(pos))) {
                pos++;
            }
        }

        Object valor() {
            if (fim()) {
                throw new JsonInvalido("JSON terminou antes do esperado");
            }
            char c = s.charAt(pos);
            switch (c) {
                case '{':
                    return objeto();
                case '[':
                    return lista();
                case '"':
                    return texto();
                case 't':
                    return palavra("true", Boolean.TRUE);
                case 'f':
                    return palavra("false", Boolean.FALSE);
                case 'n':
                    return palavra("null", null);
                default:
                    return numero();
            }
        }

        Object palavra(String palavra, Object valor) {
            if (!s.startsWith(palavra, pos)) {
                throw new JsonInvalido("Valor inválido na posição " + pos);
            }
            pos += palavra.length();
            return valor;
        }

        Map<String, Object> objeto() {
            Map<String, Object> mapa = new LinkedHashMap<>();
            pos++; // {
            pularEspacos();
            if (!fim() && s.charAt(pos) == '}') {
                pos++;
                return mapa;
            }
            while (true) {
                pularEspacos();
                if (fim() || s.charAt(pos) != '"') {
                    throw new JsonInvalido("Era esperado um nome entre aspas na posição " + pos);
                }
                String chave = texto();
                pularEspacos();
                esperar(':');
                pularEspacos();
                mapa.put(chave, valor());
                pularEspacos();
                if (fim()) {
                    throw new JsonInvalido("Objeto não foi fechado");
                }
                char c = s.charAt(pos++);
                if (c == '}') {
                    return mapa;
                }
                if (c != ',') {
                    throw new JsonInvalido("Era esperado ',' ou '}' na posição " + (pos - 1));
                }
            }
        }

        List<Object> lista() {
            List<Object> itens = new ArrayList<>();
            pos++; // [
            pularEspacos();
            if (!fim() && s.charAt(pos) == ']') {
                pos++;
                return itens;
            }
            while (true) {
                pularEspacos();
                itens.add(valor());
                pularEspacos();
                if (fim()) {
                    throw new JsonInvalido("Lista não foi fechada");
                }
                char c = s.charAt(pos++);
                if (c == ']') {
                    return itens;
                }
                if (c != ',') {
                    throw new JsonInvalido("Era esperado ',' ou ']' na posição " + (pos - 1));
                }
            }
        }

        String texto() {
            StringBuilder sb = new StringBuilder();
            pos++; // aspas de abertura
            while (true) {
                if (fim()) {
                    throw new JsonInvalido("Texto não foi fechado");
                }
                char c = s.charAt(pos++);
                if (c == '"') {
                    return sb.toString();
                }
                if (c != '\\') {
                    sb.append(c);
                    continue;
                }
                if (fim()) {
                    throw new JsonInvalido("Escape incompleto");
                }
                char e = s.charAt(pos++);
                switch (e) {
                    case '"':
                        sb.append('"');
                        break;
                    case '\\':
                        sb.append('\\');
                        break;
                    case '/':
                        sb.append('/');
                        break;
                    case 'b':
                        sb.append('\b');
                        break;
                    case 'f':
                        sb.append('\f');
                        break;
                    case 'n':
                        sb.append('\n');
                        break;
                    case 'r':
                        sb.append('\r');
                        break;
                    case 't':
                        sb.append('\t');
                        break;
                    case 'u':
                        if (pos + 4 > s.length()) {
                            throw new JsonInvalido("Escape \\u incompleto");
                        }
                        try {
                            sb.append((char) Integer.parseInt(s.substring(pos, pos + 4), 16));
                        } catch (NumberFormatException ex) {
                            throw new JsonInvalido("Escape \\u inválido na posição " + pos);
                        }
                        pos += 4;
                        break;
                    default:
                        throw new JsonInvalido("Escape inválido: \\" + e);
                }
            }
        }

        Object numero() {
            int inicio = pos;
            while (pos < s.length() && "+-0123456789.eE".indexOf(s.charAt(pos)) >= 0) {
                pos++;
            }
            String t = s.substring(inicio, pos);
            if (t.isEmpty()) {
                throw new JsonInvalido("Valor inválido na posição " + inicio);
            }
            try {
                if (t.indexOf('.') < 0 && t.indexOf('e') < 0 && t.indexOf('E') < 0) {
                    return Long.parseLong(t);
                }
                return Double.parseDouble(t);
            } catch (NumberFormatException ex) {
                throw new JsonInvalido("Número inválido: " + t);
            }
        }

        void esperar(char c) {
            if (fim() || s.charAt(pos) != c) {
                throw new JsonInvalido("Era esperado '" + c + "' na posição " + pos);
            }
            pos++;
        }
    }

    // ----------------------------------------------------------------- escrita

    /** JSON compacto (usado nas respostas da API). */
    public static String escrever(Object valor) {
        StringBuilder sb = new StringBuilder();
        escrever(valor, sb, false, 0);
        return sb.toString();
    }

    /** JSON com recuos (usado no arquivo do banco, para ficar fácil de ler). */
    public static String escreverBonito(Object valor) {
        StringBuilder sb = new StringBuilder();
        escrever(valor, sb, true, 0);
        return sb.toString();
    }

    private static void escrever(Object v, StringBuilder sb, boolean bonito, int nivel) {
        if (v == null) {
            sb.append("null");
        } else if (v instanceof String) {
            escreverTexto((String) v, sb);
        } else if (v instanceof Boolean) {
            sb.append(v);
        } else if (v instanceof Number) {
            escreverNumero((Number) v, sb);
        } else if (v instanceof Map) {
            Map<?, ?> mapa = (Map<?, ?>) v;
            if (mapa.isEmpty()) {
                sb.append("{}");
                return;
            }
            sb.append('{');
            boolean primeiro = true;
            for (Map.Entry<?, ?> e : mapa.entrySet()) {
                if (!primeiro) {
                    sb.append(',');
                }
                primeiro = false;
                quebra(sb, bonito, nivel + 1);
                escreverTexto(String.valueOf(e.getKey()), sb);
                sb.append(bonito ? ": " : ":");
                escrever(e.getValue(), sb, bonito, nivel + 1);
            }
            quebra(sb, bonito, nivel);
            sb.append('}');
        } else if (v instanceof Collection) {
            Collection<?> itens = (Collection<?>) v;
            if (itens.isEmpty()) {
                sb.append("[]");
                return;
            }
            sb.append('[');
            boolean primeiro = true;
            for (Object item : itens) {
                if (!primeiro) {
                    sb.append(',');
                }
                primeiro = false;
                quebra(sb, bonito, nivel + 1);
                escrever(item, sb, bonito, nivel + 1);
            }
            quebra(sb, bonito, nivel);
            sb.append(']');
        } else {
            throw new IllegalArgumentException("Tipo não suportado no JSON: " + v.getClass());
        }
    }

    private static void quebra(StringBuilder sb, boolean bonito, int nivel) {
        if (!bonito) {
            return;
        }
        sb.append('\n');
        for (int i = 0; i < nivel; i++) {
            sb.append("  ");
        }
    }

    private static void escreverNumero(Number n, StringBuilder sb) {
        if (n instanceof Double || n instanceof Float) {
            double d = n.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d)) {
                sb.append('0');
            } else if (d == Math.rint(d) && Math.abs(d) < 1e15) {
                sb.append((long) d);
            } else {
                sb.append(d);
            }
        } else {
            sb.append(n.longValue());
        }
    }

    private static void escreverTexto(String t, StringBuilder sb) {
        sb.append('"');
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                case '\b':
                    sb.append("\\b");
                    break;
                case '\f':
                    sb.append("\\f");
                    break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append('"');
    }

    // ------------------------------------------------------ leitura de campos

    public static String texto(Map<String, Object> m, String chave) {
        return texto(m, chave, "");
    }

    public static String texto(Map<String, Object> m, String chave, String padrao) {
        Object o = m.get(chave);
        return o instanceof String ? (String) o : padrao;
    }

    public static double numero(Map<String, Object> m, String chave, double padrao) {
        Object o = m.get(chave);
        return o instanceof Number ? ((Number) o).doubleValue() : padrao;
    }

    public static boolean booleano(Map<String, Object> m, String chave, boolean padrao) {
        Object o = m.get(chave);
        return o instanceof Boolean ? (Boolean) o : padrao;
    }

    /** Lista de textos (ignora o que não for texto). */
    public static List<String> listaDeTextos(Map<String, Object> m, String chave) {
        List<String> saida = new ArrayList<>();
        if (m.get(chave) instanceof List) {
            for (Object o : (List<?>) m.get(chave)) {
                if (o instanceof String) {
                    saida.add((String) o);
                }
            }
        }
        return saida;
    }

    /** Lista de objetos {...} (ignora o que não for objeto). */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> listaDeObjetos(Map<String, Object> m, String chave) {
        List<Map<String, Object>> saida = new ArrayList<>();
        if (m.get(chave) instanceof List) {
            for (Object o : (List<?>) m.get(chave)) {
                if (o instanceof Map) {
                    saida.add((Map<String, Object>) o);
                }
            }
        }
        return saida;
    }

    /** Objeto {...} (vazio se não existir). */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> objeto(Map<String, Object> m, String chave) {
        return m.get(chave) instanceof Map ? (Map<String, Object>) m.get(chave) : new LinkedHashMap<>();
    }
}
