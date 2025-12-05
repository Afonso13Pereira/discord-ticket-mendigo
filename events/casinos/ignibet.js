// events/casinos/
module.exports = {
  id: 'Ignibet',
  cargoafiliado: '1443918227058200638', // NOVO: Cargo de afiliado verificado
  label: 'IgniBet',
  emoji: '🔥',
  default: false,

  checklist: [
    {
      title: 'Passo 1',
      description: '👋 Hello, já tens conta na IgniBet? Se sim podes avançar para o proximo passo. Se não, regista-te atraves do link: https://record.ignibet.partners/_3aA-jvo-zGcWqcfzuvZcQGNd7ZgqdRLk/1/',
      type: [],
      image: 'https://i.imgur.com/PewWNLU.png'
    },
    {
      title: 'Passo 2',
      description: '👤 Envia **screenshot** e **ID da conta** do perfil da IgniBet com email visível',
      type: ['image', "text"],
      image: 'https://i.imgur.com/ePCc9R5.png'
    },
    {
      title: 'Passo 3',
      description: '📥 Envia **screenshot** do depósito em **LTC** e cola o **endereço LTC** em texto',
      type: ['image', 'text'],
      image: 'https://i.imgur.com/tUdyJZ9.png'
    }
  ]
};