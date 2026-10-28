package Youtube_Archives;

/**
 * Canal de vídeos. A "chave" é o identificador curto usado nas rotas do site (#/c/pipoca).
 * A chave "me" é o canal do próprio usuário (vídeos enviados por ele).
 */
public record Canal(String chave, String nome, String handle, String inicial, String cor,
                    long seguidores, String entrou, String sobre) {
}
