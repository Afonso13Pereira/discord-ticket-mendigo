// events/casinos/rioace.js
module.exports = {
  id     : 'RioAce',
  label  : 'RioAce',
  emoji  : '🎰',
  default: false,               // ⚠️  agora nenhum casino real tem default:true

  checklist: [
    "📨 Envia **print** do email de registo.",
    "👤 Envia **print** do teu perfil *RioAce* com email visível.",
    "💰 Envia **print** da página de depósito LTC (QR-code).",
    "📥 Envia **print** do depósito **e** cola o **endereço LTC** em texto."
  ],

  images: [
    "https://via.placeholder.com/600x300?text=RioAce+Passo+0",
    "https://via.placeholder.com/600x300?text=RioAce+Passo+1",
    "https://via.placeholder.com/600x300?text=RioAce+Passo+2",
    "https://via.placeholder.com/600x300?text=RioAce+Passo+3"
  ]
};
