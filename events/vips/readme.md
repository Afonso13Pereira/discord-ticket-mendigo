# Como adicionar (ou remover) um VIP

1. Cria um ficheiro dentro de `events/vips/` com o nome que quiseres
   (ex.: `leaderboard.js`).

2. Exporta um objeto no formato:

   module.exports = {
     id      : 'leaderboard',    // deve ser único
     label   : 'Leaderboard',    // aparece no SelectMenu
     emoji   : '🏆',             // opcional
     default : false,            // apenas 1 VIP pode ter `default: true`
     checklist: [ 'Passo 1', 'Passo 2', ... ],
     images   : [ 'urlPasso1', 'urlPasso2', ... ]
   };

3. Reinicia o bot (`node index.js`).  
   O novo VIP surge automaticamente na lista.  
   Para retirar um VIP basta apagar o ficheiro respectivo. 