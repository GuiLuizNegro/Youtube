# Shorts: como funciona

Vídeos curtos (até 60 s) na vertical, com rolagem infinita, na página `#/shorts`.

## Arquivos
- `vocetube/js/shorts.js`: lógica da página (rolagem, reprodução, curtir, comentários).
- `vocetube/js/shorts-data.js`: lista dos Shorts de exemplo.
- `vocetube/css/style.css`: seção "12. Shorts".
- `vocetube/img/shorts/`: fotos verticais (9:16) e `CREDITOS.txt`.

## Endereços
- `#/shorts`: abre pelo primeiro Short.
- `#/shorts/s08`: abre direto no Short indicado (serve de link para compartilhar).

## Rolagem infinita
- Quando o usuário chega perto do fim, mais Shorts são acrescentados.
- A primeira volta segue a ordem da lista; as seguintes são embaralhadas, sem repetir o mesmo Short em seguida.
- Depois de 60 Shorts na tela, os 20 mais antigos são removidos para poupar memória.

## Estado do usuário
Curtir, "não gostei", inscrição e comentários usam o mesmo `Store` do resto do site e ficam salvos no servidor.

## Vídeos enviados
Vídeos enviados com até 60 s entram no Shorts e tocam de verdade. Os de exemplo são fotos com movimento leve, marcadas como "Demonstração".
