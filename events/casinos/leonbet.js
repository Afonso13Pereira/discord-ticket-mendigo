// events/casinos/
module.exports = {
  id: 'Leon Bet',
  cargoafiliado: '1437395454898864260', // NOVO: Cargo de afiliado verificado
  label: 'Leon Bet',
  emoji: '🖤',
  default: false,


  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na Leon Bet? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://playinwel.com/omendigotv e usa o codigo "mendigo"',
      type: [],
      image: 'https://mendigotv.com/assets/leon-D2bkfTbU.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do email de registro no  com as informações visiveis',
      type: ['image'],
      image: 'https://i.imgur.com/gIqAqCz.png'
    },
    {
      title: 'Passo 3',
      description: '👤 Envia **screenshot** do perfil da Leon Bet com email visível',
      type: ['image'],
      image: 'https://i.imgur.com/9aDYhdg.png'
    }, 

    {
      title: 'Passo 4',
      description: '📥 Envia **screenshot** do depósito em LTC **e** cola o **endereço LTC** em texto',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/UjbqadS.png'
    }
  ]
};