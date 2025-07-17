// events/casinos/bcgame.js
module.exports = {
  id: 'BCGame',
  cargoafiliado: '1390070910995927070', // NOVO: Cargo de afiliado verificado
  label: 'BC.Game',
  emoji: '💚',
  default: false,


  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na BCGame? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://bit.ly/_BCGame',
      type: [],
      image: 'https://mendigotv.com/assets/bcgame-59FBzNPj.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do perfil da BC.Game **e** coloque o **ID da BCGame em texto**',
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