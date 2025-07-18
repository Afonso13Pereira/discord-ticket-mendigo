// events/vips/semanal.js
module.exports = {
  id: 'semanal',
  label: 'Semanal',
  emoji: '📅',
  default: false,

  // NOVO: Seção de casino - define quais casinos estão disponíveis para este VIP
  casinos: ['BCGame'],

  checklist: [
    {
      title: 'Passo 1',
      description: '📱 Envia **print do perfil** com ID visível **e** o **ID em texto**',
      type: ['image', 'text'],
      image: 'https://mendigotv.com/assets/semanal-step1.png'
    },
    {
      title: 'Passo 2',
      description: '💰 Envia **prints dos depósitos**',
      type: ['image'],
      image: 'https://mendigotv.com/assets/semanal-step2.png'
    },
    {
      title: 'Passo 3',
      description: '💸 Envia **prints dos levantamentos**',
      type: ['image'],
      image: 'https://mendigotv.com/assets/semanal-step3.png'
    },
    {
      title: 'Passo 4',
      description: '🏦 Envia **prints dos cofres**',
      type: ['image'],
      image: 'https://mendigotv.com/assets/semanal-step4.png'
    },
    {
      title: 'Passo 5',
      description: '📥 Envia **print do depósito LTC** com QR visível **e** o **endereço LTC em texto**',
      type: ['image', 'text'],
      image: 'https://mendigotv.com/assets/semanal-step5.png'
    }
  ]
}; 