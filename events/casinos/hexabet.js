// events/casinos/
module.exports = {
  id: 'HexaBet',
  cargoafiliado: '1390070910995927070', // NOVO: Cargo de afiliado verificado
  label: 'HexaBet',
  emoji: '🍀',
  default: false,



  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na HexaBet? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://record.hexaffiliates.io/_Mdjdx-5aVJGu11z-n_bVh2Nd7ZgqdRLk/1/',
      type: [],
      image: 'https://mendigotv.com/assets/hexabet-59FBzNPj.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do email de registro no Hexabet com as informações visiveis',
      type: ['image'],
      image: 'https://i.imgur.com/aai6JTW.png'
    },
    {
      title: 'Passo 3',
      description: '👤 Envia **screenshot** do perfil da Hexabet com email visível',
      type: ['image'],
      image: 'https://i.imgur.com/F6TbNZr.png'
    },
    {
      title: 'Passo 4',
      description: '📥 Envia **screenshot** do depósito em LTC **e** cola o **endereço LTC** em texto',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/M59mixi.png'
    }
  ]


};