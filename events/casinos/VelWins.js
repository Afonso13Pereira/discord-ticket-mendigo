// events/casinos/
module.exports = {
  id: 'VelWins',
  cargoafiliado: '1438972236210901093', // NOVO: Cargo de afiliado verificado
  label: 'VelWins',
  emoji: '🟩',
  default: false,


  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na VelWins? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://record.hexaffiliates.io/_Mdjdx-5aVJHjiPWJ9pQO92Nd7ZgqdRLk/1/?pg=1 e usa o codigo "40FS"',
      type: [],
      image: 'https://i.imgur.com/ICCNl95.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do email de registro no  com as informações visiveis',
      type: ['image'],
      image: 'https://i.imgur.com/Pglkpos.png'
    },
    {
      title: 'Passo 3',
      description: '👤 Envia **screenshot** do perfil da VelWins com email visível',
      type: ['image'],
      image: 'https://i.imgur.com/UmBJ3JA.png'
    }, 
    {
      title: 'Passo 4',
      description: '🎁 Envia **screenshot** dos freespins da VelWins na secção presentes e bonus | https://velwins.com/pt/account/bonus',
      type: ['image'],
      image: 'https://i.imgur.com/ntYoB1o.png'
    },
    {
      title: 'Passo 5',
      description: '📥 Envia **screenshot** do depósito em LTC **e** cola o **endereço LTC** em texto',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/Z0N11nw.png'
    }
  ]
};