// events/casinos/
module.exports = {
  id: 'RioAce',
  cargoafiliado: '1417887803718631556', // NOVO: Cargo de afiliado verificado
  label: 'RioAce',
  emoji: '💙',
  default: false,



  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na Rioace? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://record.joinaff.com/_F_RDCswXQflZNvOoThXn9GNd7ZgqdRLk/1/',
      type: [],
      image: 'https://mendigotv.com/assets/rioace-Cz6Ep1Fm.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do email de registro no Rioace com as informações visiveis.',
      type: ['image'],
      image: 'https://i.imgur.com/aai6JTW.png'
    },
    {
      title: 'Passo 3',
      description: '👤 Envia **screenshot** do perfil da Rioace com email visível',
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