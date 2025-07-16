// events/casinos/bcgame.js
module.exports = {
  id: 'BCGame',
  cargoafiliado: '1390070910995927070', // NOVO: Cargo de afiliado verificado
  label: 'BC.Game',
  emoji: '💚',
  default: false,

  checklist: [
    "👋 Hello, já tens conta na BCGame? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://bit.ly/_BCGame",
    "📧 Envia **screenshot** do perfil da BC.Game **e** coloque o **ID da BCGame em texto**", // MODIFICADO: Agora pede ID obrigatoriamente
    "📥 Envia **screenshot** do depósito em LTC **e** cola o **endereço LTC** em texto"
  ],

  images: [
    "https://mendigotv.com/assets/bcgame-59FBzNPj.png",
    "https://i.imgur.com/8O63A5R.png",
    "https://i.imgur.com/iTeiS5c.png"
  ]
};