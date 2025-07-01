# 🤖 Enhanced Discord Bot

Um bot Discord moderno e elegante para gerenciamento de tickets, promoções e giveaways com interface visual aprimorada.

## ✨ Características

### 🎨 Interface Visual Moderna
- **Embeds coloridos** com esquema de cores consistente
- **Emojis e ícones** para melhor experiência visual
- **Componentes interativos** (botões e menus) bem organizados
- **Animações e GIFs** para engajamento

### 🎫 Sistema de Tickets
- **Categorias dinâmicas** e estáticas
- **Criação automática** de canais privados
- **Permissões personalizadas** por ticket
- **Suporte 24/7** com notificações para staff

### 🎁 Sistema de Giveaways
- **Verificação de idade** (+18) obrigatória
- **Múltiplos tipos** (Telegram, GTB, Promoções)
- **Validação automática** de códigos
- **Checklist interativo** por casino

### 🎰 Gestão de Casinos
- **Sistema modular** - fácil adicionar/remover casinos
- **Configuração individual** por casino
- **Imagens de apoio** para cada passo
- **Validação de provas** automatizada

### 🔥 Promoções Flash
- **Criação dinâmica** de promoções
- **Expiração automática** baseada em tempo
- **Botões personalizados** com cores e emojis
- **Gestão completa** via comandos slash

## 🚀 Comandos

### `/setup-tickets`
Configura a mensagem principal do sistema de tickets com todas as categorias disponíveis.

### `/promos`
- `create` - Criar nova promoção flash
- `activelist` - Listar promoções ativas
- `close <id>` - Fechar promoção específica

### `/tickets`
- `create` - Criar nova categoria de ticket
- `activelist` - Listar categorias ativas
- `close <id>` - Fechar categoria específica

## 📁 Estrutura do Projeto

```
├── config/
│   └── constants.js          # Configurações globais
├── utils/
│   ├── embeds.js            # Factory para embeds
│   ├── components.js        # Factory para componentes
│   ├── categories.js        # Gestão de categorias
│   ├── promotions.js        # Gestão de promoções
│   └── store.js             # Sistema de armazenamento
├── commands/                # Comandos slash
├── events/                  # Eventos do Discord
│   └── casinos/            # Configurações de casinos
└── index.js                # Arquivo principal
```

## 🎨 Melhorias Visuais

### Cores Consistentes
- **Primary**: Discord Blurple (#5865f2)
- **Success**: Verde (#00d26a)
- **Warning**: Laranja (#faa61a)
- **Danger**: Vermelho (#ed4245)
- **Info**: Azul claro (#00b0f4)

### Emojis Padronizados
- ✅ Sucesso
- ❌ Erro
- ⚠️ Aviso
- ℹ️ Informação
- 🎁 Giveaway
- 🎫 Ticket
- 🎰 Casino
- 🔥 Promoção

### Componentes Interativos
- **Botões estilizados** com cores apropriadas
- **Menus de seleção** com descrições claras
- **Modais organizados** para entrada de dados
- **Embeds informativos** com timestamps

## 🔧 Configuração

1. Configure as variáveis de ambiente no `.env`
2. Execute `npm install` para instalar dependências
3. Execute `node deploy-commands.js` para registrar comandos
4. Execute `node index.js` para iniciar o bot

## 📝 Adicionando Novos Casinos

1. Crie um arquivo em `events/casinos/novocasino.js`
2. Exporte um objeto com a estrutura:
```javascript
module.exports = {
  id: 'NovoCasino',
  label: 'Novo Casino',
  emoji: '🎲',
  default: false,
  checklist: [...],
  images: [...]
};
```
3. Reinicie o bot

O sistema é totalmente modular e permite fácil expansão e customização!