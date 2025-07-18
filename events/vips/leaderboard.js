// events/vips/leaderboard.js
module.exports = {
  id: 'leaderboard',
  label: 'Leaderboard',
  emoji: '🏆',
  default: false,

  // NOVO: Seção de casino - define quais casinos estão disponíveis para este VIP
  casinos: ['BCGame'],

  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Olá! Para participar no Leaderboard VIP, confirma que tens conta no casino selecionado.',
      type: [],
      image: 'https://mendigotv.com/assets/leaderboard-step1.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do perfil do casino **e** coloque o **ID do casino em texto**',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/8O63A5R.png'
    },
    {
      title: 'Passo 3',
      description: '📥 Envia **screenshot** do depósito em LTC **e** cola o **endereço LTC** em texto',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/iTeiS5c.png'
    }
  ]
}; 