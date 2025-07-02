// events/casinos/bcgame.js
module.exports = {
  id: 'BCGame',
  cargoafiliado: '1390070910995927070', // NOVO: Cargo de afiliado verificado
  label: 'BC.Game',
  emoji: '🎲',
  default: false,

  checklist: [
    "📧 Envie **screenshot** do email de registro no BC.Game **e** o **ID da BCGame em texto**", // MODIFICADO: Agora pede ID obrigatoriamente
    "👤 Envie **screenshot** do seu perfil BC.Game com email visível",
    "💰 Envie **screenshot** da página de depósito LTC (com QR-code)",
    "📥 Envie **screenshot** do depósito realizado **e** cole o **endereço LTC** em texto"
  ],

  images: [
    "https://images.pexels.com/photos/5980856/pexels-photo-5980856.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/5717455/pexels-photo-5717455.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/8369648/pexels-photo-8369648.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=600"
  ]
};