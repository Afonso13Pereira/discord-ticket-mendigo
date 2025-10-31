// events/casinos/
module.exports = {
  id: 'Lollyspins',
  cargoafiliado: '1433182126135709717', // NOVO: Cargo de afiliado verificado
  label: 'Lollyspins',
  emoji: '🍭',
  default: false,



  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na LollySpins? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://record.joinaff.com/_F_RDCswXQfmBYt4A521OEWNd7ZgqdRLk/1/',
      type: [],
      image: 'https://i.imgur.com/pUUeKRO.png'
    },
    {
      title: 'Passo 2',
      description: '📧 Envia **screenshot** do email de registro no LollySpins com as informações visiveis.',
      type: ['image'],
      image: 'https://i.imgur.com/yz6hIkQ.png'
    },
    {
      title: 'Passo 3',
      description: '👤 Envia **screenshot** do perfil da LollySpins com email visível',
      type: ['image'],
      image: 'https://i.imgur.com/bLrdkOt.png'
    },
    {
      title: 'Passo 4',
      description: '📥 Envia **screenshot** do depósito em LTC **e** cola o **endereço LTC** em texto',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/KMfOPhU.png'
    }
  ]


};