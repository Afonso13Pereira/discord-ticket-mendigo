// events/casinos/
module.exports = {
  id: '1xBit',
  cargoafiliado: '1396652116872925284', // NOVO: Cargo de afiliado verificado
  label: '1xBit',
  emoji: '🧡',
  default: false,


  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na 1xBit? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://bit.ly/_1xBit e usa o codigo "MENDIGOTV"',
      type: [],
      image: 'https://mendigotv.com/assets/1xbit-59FBzNPj.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do email de registro no  com as informações visiveis',
      type: ['image'],
      image: 'https://i.imgur.com/oL3fLZz.png'
    },
    {
      title: 'Passo 3',
      description: '👤 Envia **screenshot** do perfil da 1xBit com email visível',
      type: ['image'],
      image: 'https://i.imgur.com/kJYiTgQ.png'
    }, 
    {
      title: 'Passo 4',
      description: '🎁 Envia **screenshot** dos freespins da 1xBit na secção presentes e bonus',
      type: ['image'],
      image: 'https://i.imgur.com/ntYoB1o.png'
    },
    {
      title: 'Passo 5',
      description: '📥 Envia **screenshot** do depósito em LTC **e** cola o **endereço LTC** em texto',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/wKjWS4x.png'
    }
  ]
};