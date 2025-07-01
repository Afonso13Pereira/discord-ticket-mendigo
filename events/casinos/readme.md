# Como adicionar (ou remover) um casino

1. Cria um ficheiro dentro de `events/casinos/` com o nome que quiseres
   (ex.: `bcgame.js`).

2. Exporta um objeto no formato:

   module.exports = {
     id      : 'BCGame',        // deve ser único
     label   : 'BC.Game',       // aparece no SelectMenu
     emoji   : '🎲',            // opcional
     default : false,           // apenas 1 casino pode ter `default: true`
     checklist: [ 'Passo 1', 'Passo 2', ... ],
     images   : [ 'urlPasso1', 'urlPasso2', ... ]
   };

3. Reinicia o bot (`node index.js`).  
   O novo casino surge automaticamente na lista.  
   Para retirar um casino basta apagar o ficheiro respectivo.
