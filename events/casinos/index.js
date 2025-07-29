// events/casinos/index.js
const fs   = require('fs');
const path = require('path');

const casinos = {};

fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && f !== 'index.js')
  .forEach(f => {
    const mod = require(path.join(__dirname, f));
    casinos[mod.id] = mod;
  });

// Adicionar casino genérico para Telegram
casinos['Telegram'] = {
  id: 'Telegram',
  label: 'Telegram',
  emoji: '📲',
  checklist: [
    {
      title: 'Passo 1',
      description: 'Envie o código e o print da mensagem do bot Telegram.',
      type: ['image', 'text'],
      image: null
    }
  ]
};
// Adicionar casino genérico para Todos, se necessário
casinos['Todos'] = {
  id: 'Todos',
  label: 'Todos',
  emoji: '🎲',
  checklist: [
    {
      title: 'Passo 1',
      description: 'Envie o print e o código do casino correspondente.',
      type: ['image', 'text'],
      image: null
    }
  ]
};

module.exports = casinos;
