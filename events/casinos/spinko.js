// events/casinos/
module.exports = {
    id: 'spinko',
    cargoafiliado: '1446511538511937648', // NOVO: Cargo de afiliado verificado
    label: 'Spinko',
    emoji: '🟩',
    default: false,
  
    checklist: [
      {
        title: 'Passo 1',
        description: '👋 Hello, já tens conta na Spinko? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://record.joinaff.com/_F_RDCswXQfk-Eb7UkIbDPGNd7ZgqdRLk/1/',
        type: [],
        image: 'https://api_cdn.mendigotv.com/uploads/spinko_7a7f73f6-bae3-47c7-a624-7a7bd3c25942_7c536961.webp'
      },
      {
        title: 'Passo 2',
        description: '📧 Envia screenshot do email de registro no Spinko com as informações visiveis.',
        type: ['image'],
        image: 'https://api_cdn.mendigotv.com/uploads/EmailSpink_669128e5-3311-425c-856d-f7055d031b55_16349f3f.webp'
      },
      {
        title: 'Passo 3',
        description: '👤 Envia GRAVAÇÃO DE ECRA do perfil da Spinko com email visível e GRAVAÇÃO DE ECRA do depósito em LTC e cola o endereço LTC em texto',
        type: ['image', "text"],
        image: 'https://api_cdn.mendigotv.com/uploads/1205_4b8ffc97-5fbf-4732-b066-4110daa63660.gif'
      }
    ]
  };