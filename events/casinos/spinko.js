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
      image: "https://i.imgur.com/5QX3r8n.png"
    },
    {
      title: 'Passo 2',
      description: '📧 Envia screenshot do email de registro no Spinko com as informações visiveis.',
      type: ['image'],
      image: "https://i.imgur.com/gCugja7.png"
    },
    {
      title: 'Passo 3',
      description: '👤 Envia GRAVAÇÃO DE ECRA do perfil da Spinko com email visível e GRAVAÇÃO DE ECRA do depósito em LTC e cola o endereço LTC em texto | Se não souberes como fazer a gravação de ecrã, faz o comando /gravacaoecra',
      type: ['image', "text"],
      image: "https://i.imgur.com/A7BArwj.gif"
    }
  ]
};