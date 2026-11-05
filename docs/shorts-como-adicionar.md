# Como adicionar um Short de exemplo

1. Prepare uma foto vertical (9:16), por exemplo 720x1280, e salve em `vocetube/img/shorts/` (ex.: `s17.jpg`).
2. Em `vocetube/js/shorts-data.js`, acrescente uma linha na lista `SHORTS`:
   `{ id: 's17', ch: 'mamao', title: 'Título do Short', tags: ['receita'], dur: 30, likes: 1200, days: 2, img: 'img/shorts/s17.jpg', focus: '50% 50%' }`
3. Use uma chave de canal que exista (`mamao`, `nuvem`, `tigre`, `bruxo`, `panda`, `lhama`, `pipoca`, `pixel`, `cacto`, `gato`).
4. Se a foto tiver licença Creative Commons, anote o autor em `vocetube/img/shorts/CREDITOS.txt`.
5. Recarregue o site com Ctrl + F5.

A duração (`dur`) deve ser de no máximo 60 segundos.
