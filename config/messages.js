// config/messages.js - Configuração Centralizada de Todas as Mensagens do Bot

module.exports = {
  // === MENSAGENS GERAIS ===
  GENERAL: {
    LOADING: 'A carregar...',
    SUCCESS: 'Sucesso!',
    ERROR: 'Erro!',
    WARNING: 'Aviso!',
    INFO: 'Informação',
    CONFIRMATION_REQUIRED: 'Confirmação necessária',
    PLEASE_WAIT: 'Por favor aguarde...',
    PROCESSING: 'A processar...',
    COMPLETED: 'Concluído!',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
    INVALID: 'Inválido',
    NOT_FOUND: 'Não encontrado',
    PERMISSION_DENIED: 'Sem permissão',
    TRY_AGAIN: 'Tente novamente'
  },

  // === SISTEMA DE TICKETS ===
  TICKETS: {
    WELCOME_TITLE: 'Olá!',
    WELCOME_DESCRIPTION: [
      '**Bem-vindo ao sistema de suporte da tenda! Sou um bot e vou-te ajudar em tudo o que conseguir**',
      '',
      '⭐ Segue as instruções abaixo para continuar',
      '🛡️ Todas as tuas informações estão seguras'
    ].join('\n'),
    
    SYSTEM_TITLE: 'Sistema de Suporte',
    SYSTEM_DESCRIPTION: [
      '**Bem-vindo ao sistema de suporte da tenda! Sou um bot e vou-te ajudar em tudo o que conseguir**',
      '',
      '⭐ Clica no botão que melhor descreve o teu pedido',
      '💎 Resposta rápida e profissional',
      '',
      '*Escolhe uma categoria abaixo para começar:*'
    ].join('\n'),

    CREATED_SUCCESS: 'Ticket #{number} criado com sucesso: {channel}',
    CLOSE_TITLE: 'Confirmar Fecho de Ticket',
    CLOSE_DESCRIPTION: [
      '**Tem a certeza que deseja fechar este ticket?**',
      '',
      '📋 **O ticket será fechado com transcript automático**',
      '💾 **Todas as mensagens serão guardadas por 2 semanas**',
      '🗑️ **O canal será eliminado após criar o transcript**',
      '',
      '⚠️ **Esta ação não pode ser desfeita**'
    ].join('\n'),
    
    CLOSING_WITH_TRANSCRIPT: 'Transcript criado com ID: `{id}`\nCanal será eliminado em 10 segundos...',
    CLOSING_WITHOUT_TRANSCRIPT: 'Ticket será eliminado em 5 segundos...',
    ONLY_IN_TICKETS: 'Este comando só pode ser usado em canais de ticket',
    CLOSE_CANCELLED: 'Fecho de ticket cancelado.'
  },

  // === CONFIRMAÇÃO +18 ===
  CONFIRMATION: {
    TITLE: 'Confirmação de Elegibilidade',
    DESCRIPTION: [
      '**Para continuar, confirme que:**',
      '',
      '🛡️ Tenho mais de 18 anos',
      '🎁 Desejo reclamar o prémio',
      '⭐ Assumo responsabilidade pelas minhas apostas',
      '⚠️ Reconheço o risco de dependência',
      '',
      '**Digite exatamente:** `Sim, eu confirmo`'
    ].join('\n'),
    
    INVALID_RESPONSE: 'Digite exatamente **"Sim, eu confirmo"** para prosseguir',
    SUCCESS: 'Parabéns! Escolhe o tipo de giveaway:'
  },

  // === GIVEAWAYS ===
  GIVEAWAYS: {
    TYPE_SELECTION_TITLE: 'Tipo de Giveaway',
    TYPE_SELECTION_DESCRIPTION: [
      '⭐ **Parabéns!** Escolha o tipo de giveaway:',
      '',
      '🎁 **Tipos Disponíveis:**',
      '• Telegram - Giveaways do telegram',
      '• GTB - GTB da Stream',
      '• Outros giveaways'
    ].join('\n'),

    TELEGRAM_INSTRUCTIONS: '📱 Envia o **código** + **print** da mensagem do bot Telegram',
    TELEGRAM_CODE_VALIDATED: 'Código validado!',
    TELEGRAM_CODE_SPECIFIC_CASINO: 'Código validado!',
    TELEGRAM_CODE_NOT_FOUND: 'o Código não foi encontrado nos vencedores',
    TELEGRAM_CODE_EXPIRED: 'O código tem mais de 48 horas. Aguarda o suporte',
    TELEGRAM_CODE_MISSING: 'Ainda falta: {missing}',

    CASINO_SELECTION_TITLE: 'Seleção de Casino',
    CASINO_SELECTION_DESCRIPTION: [
      '⚠️ **Importante:** Seleciona o casino correto',
      '🛡️ Sujeito a perder o premio se não cumprires as regras'
    ].join('\n'),
    CASINO_SELECTION_ALL: '⭐ **Podes escolher qualquer casino!**\n⚠️ Seleciona o casino onde desejas receber o premio\n🛡️ Sujeito a BAN se não cumprires as regras',
    CASINO_SELECTED: 'Casino **{casino}** selecionado!',
    CASINO_INVALID_SELECTION: 'Por favor, seleciona um casino válido',
    CASINO_NOT_CONFIGURED: 'Entra em contacto com o suporte',

    PROMO_SELECTED: 'Promoção **{name}** selecionada!',
    PROMO_SELECTED_CASINO: 'Promoção **{name}** selecionada para **{casino}**!',
    PROMO_EXPIRED: 'Esta promoção já terminou ou não está disponível',
    PROMO_CHOOSE_CASINO: 'Promoção **{name}** selecionada! Agora escolhe o casino.',

    VERIFIED_USER_SKIP: '✅ **Utilizador verificado** - envia **imagem do depósito com QR visível** + **endereço LTC em texto**.',
    VERIFIED_USER_MISSING: 'Ainda falta: {missing}',
    VERIFIED_USER_COMPLETE: 'Depósito e endereço LTC recebidos! Clique em **Finalizar** para completar.',

    SUBMISSION_SENT: 'Solicitação enviada para aprovação! Aguarda a análise da equipa.',
    APPROVED: 'Giveaway aprovado com prémio de **{prize}** e enviado para aprovações finais!',
    REJECTED: 'Giveaway rejeitado. Motivo enviado ao User.',
    PAID: 'Giveaway marcado como pago! Mensagem enviada ao ticket #{number}.\n\n✅ User agora está verificado para **{casino}**!',

    DUPLICATE_CODE_TITLE: 'Código já foi utilizado anteriormente',
    DUPLICATE_CODE_DESCRIPTION: [
      '🚨 **Código já foi utilizado anteriormente**',
      '',
      'Este código foi usado no ticket #{originalTicket} por {originalUser}',
      '',
      '⏳ **Ambos os tickets estão revisão manual**',
      '🛡️ **A equipa foi notificada**',
      '',
      'Aguarda enquanto a nossa equipa verifica a situação.'
    ].join('\n')
  },

  // === CHECKLIST ===
  CHECKLIST: {
    STEP_TITLE: 'Passo {current}/{total}',
    PROGRESS_FOOTER: 'Progresso: {current}/{total} passos concluídos',
    COMPLETED: 'Checklist concluído com sucesso! Clique em **Finalizar** para completar.',
    RESUBMIT_STARTED: 'Reenvio iniciado! Por favor, completa novamente o checklist.',
    IMAGE_REQUIRED: 'Este passo requer o envio de uma **imagem**',
    MISSING_REQUIREMENTS: 'Ainda falta: {missing}',

    // BCGame específico
    BCGAME_STEP1: '📧 Envia **screenshot** do email de registro no BC.Game **e** o **ID da BCGame em texto**',
    BCGAME_MISSING_EMAIL: '**screenshot do email**',
    BCGAME_MISSING_ID: '**ID da BCGame em texto**',

    // Passo final (depósito + LTC)
    DEPOSIT_MISSING_IMAGE: '**imagem do depósito**',
    DEPOSIT_MISSING_ADDRESS: '**endereço LTC em texto**'
  },

  // === VIP SYSTEM ===
  VIP: {
    CASINO_SELECTION_TITLE: 'Seleção de Casino VIP',
    CASINO_SELECTION_DESCRIPTION: [
      '**Escolhe o casino onde desejas reclamar o VIP:**',
      '',
      '💎 Casinos VIP disponíveis',
      '🛡️ Suporte especializado',
      '⭐ Giveaways exclusivos'
    ].join('\n'),

    TYPE_SELECTION_TITLE: 'Tipo de VIP',
    TYPE_SELECTION_DESCRIPTION: [
      '**Escolha o tipo de VIP que deseja reclamar:**',
      '',
      '⭐ **Semanal** - VIP semanal',
      '👑 **Leaderboard** - VIP Leaderboard',
      '',
      'ℹ️ Cada tipo tem requisitos diferentes'
    ].join('\n'),

    CHECKLIST_TITLE: 'VIP {type} - Passo {current}/{total}',
    CHECKLIST_FOOTER: 'Progresso VIP: {current}/{total} passos concluídos',
    TYPE_SELECTED: 'Tipo VIP **{type}** selecionado para **{casino}**!',
    COMPLETED: 'Checklist VIP concluído com sucesso! Clique em **Finalizar** para completar.',
    TYPE_NOT_CONFIGURED: 'Tipo VIP não configurado no sistema'
  },

  // === WEBSITE ===
  WEBSITE: {
    TYPE_SELECTION_TITLE: 'Suporte do Website',
    TYPE_SELECTION_DESCRIPTION: [
      '**Como podemos ajudar com o website?**',
      '',
      '🐛 **Reportar Bug** - Relatar um problema no site',
      '🎁 **Resgatar Redeem** - Reclamar itens que resgatou',
      '',
      'ℹ️ Escolha uma opção abaixo'
    ].join('\n'),

    BUG_REPORT_TITLE: 'Reportar Bug',
    BUG_REPORT_DESCRIPTION: [
      '**Descreva o bug que encontrou:**',
      '',
      'ℹ️ Seja específico sobre o problema',
      '⭐ Explica como aconteceu o bug',
      '🛡️ Adiciona capturas de ecrã se possível',
      '',
      '**Descreve o bug:**'
    ].join('\n'),

    REDEEM_NICK_TITLE: 'Resgatar Redeem',
    REDEEM_NICK_DESCRIPTION: [
      '**Para verificar os seus redeems disponíveis:**',
      '',
      '📱 **Escreve o teu nickname da Twitch**',
      '📸 **Envia uma captura de ecrã** que comprova o teu nick',
      '',
      'ℹ️ Podes enviar em mensagens separadas'
    ].join('\n'),

    REDEEM_NO_REDEEMS_TITLE: 'Nenhum Redeem Disponível',
    REDEEM_NO_REDEEMS_DESCRIPTION: [
      '**Não foram encontrados redeems para: {nick}**',
      '',
      'ℹ️ Possíveis motivos:',
      '• Nickname incorreto',
      '• Todos os redeems já foram resgatados',
      '• Nenhum redeem foi feito com este nickname',
      '',
      '🛡️ Entra em contacto com o suporte se acha que isto é um erro'
    ].join('\n'),

    REDEEM_LIST_TITLE: 'Redeems Disponíveis para {nick}',
    REDEEM_LIST_DESCRIPTION: [
      '**Encontrados {count} redeem(s) disponível(is):**',
      '',
      '{list}',
      '',
      'ℹ️ Escolhe o número do item que deseja resgatar'
    ].join('\n'),

    REDEEM_SELECTED_TITLE: 'Redeem Selecionado',
    REDEEM_SELECTED_DESCRIPTION: [
      '**Item:** {item}',
      '**Nickname:** {nick}',
      '**Data do Redeem:** {date}',
      '',
      '🛡️ **A nossa equipa irá processar o seu pedido**',
      '🕐 Aguarda enquanto verificamos os detalhes',
      '💎 Será contactado em breve'
    ].join('\n'),

    REDEEM_COMPLETED: 'Redeem marcado como concluído! O user foi notificado.',
    REDEEM_ERROR: 'Erro ao marcar redeem como concluído',
    REDEEM_NOT_FOUND: 'Redeem não encontrado',

    NICK_IMAGE_RECEIVED: 'Imagem recebida! Agora envia o seu **nickname da Twitch**.',
    NICK_TEXT_RECEIVED: 'Nickname recebido! Agora envia uma **captura de ecrã** como prova.',

    BUG_NOTIFICATION: [
      '**Novo bug reportado no website**',
      '',
      '🎫 **Ticket:** #{number}',
      '👤 **User:** {user}',
      '🐛 **Tipo:** Bug Report',
      '📝 **Descrição:** {description}',
      '',
      '📍 **Canal:** {channel}'
    ].join('\n'),

    REDEEM_NOTIFICATION: [
      '**Novo pedido de redeem**',
      '',
      '🎫 **Ticket:** #{number}',
      '👤 **User:** {user}',
      '🎁 **Item:** {item}',
      '📱 **Twitch:** {twitch}',
      '📅 **Data do Redeem:** {date}',
      '',
      '📍 **Canal:** {channel}'
    ].join('\n')
  },

  // === DÚVIDAS E OUTROS ===
  QUESTIONS: {
    DESCRIPTION_TITLE: 'Descreva a sua Dúvida',
    DESCRIPTION_DESCRIPTION: [
      '**Por favor, descreva o teu problema da melhor forma possível:**',
      '',
      'ℹ️ Seja específico e detalhado',
      '⭐ Inclua capturas de ecrã se necessário',
      '🛡️ A nossa equipa irá ajudá-lo',
      '',
      '**Descreve a tua duvida:**'
    ].join('\n'),

    DESCRIPTION_TOO_SHORT: 'Por favor, fornece uma descrição mais detalhada (mínimo 10 caracteres)',
    DESCRIPTION_RECEIVED: 'Descrição recebida! A nossa equipa foi notificada e irá ajudá-lo em breve.',

    NOTIFICATION: [
      '**Novo ticket de {category}**',
      '',
      '🎫 **Ticket:** #{number}',
      '👤 **User:** {user}',
      '📂 **Categoria:** {category}',
      '📝 **Descrição:** {description}',
      '',
      '📍 **Canal:** {channel}'
    ].join('\n')
  },

  OTHER: {
    HELP_TITLE: 'Como Podemos Ajudar?',
    HELP_DESCRIPTION: [
      '**Em que podemos ajudá-lo?**',
      '',
      '⭐ Descreve o que precisas',
      '🛡️ A nossa equipa está aqui para ajudar',
      '💎 Suporte personalizado',
      '',
      '**Descreve como podemos ajudar:**'
    ].join('\n')
  },

  // === SUPORTE ===
  SUPPORT: {
    REQUEST_TITLE: 'Solicitação de Suporte',
    REQUEST_DESCRIPTION: [
      '**Suporte solicitado no ticket #{number}**',
      '',
      '👤 **User:** {user}',
      '📍 **Canal:** <#{channel}>',
      '📝 **Motivo:** {reason}',
      '',
      '🕐 Aguardando atendimento'
    ].join('\n'),

    TEAM_NOTIFIED: 'Equipe de suporte foi notificada! Aguarda um momento.',
    COMPLETED: 'Suporte marcado como concluído!',
    TICKET_PAUSED: '⚠️ **Ticket pausado para revisão**\n\nO código `{code}` foi usado novamente em outro ticket.\n\n🛡️ **A equipa foi notificada**\nAguarde enquanto a nossa equipa verifica a situação.',
    SITUATION_RESOLVED: '✅ **Situação resolvida pelo suporte**\n\nPode continuar com o seu ticket normalmente.'
  },

  // === APROVAÇÕES ===
  APPROVALS: {
    READY_TITLE: 'Ticket Pronto para Aprovação',
    READY_DESCRIPTION: [
      '**Ticket #{number} pronto para ser aprovado**',
      '',
      '👤 **User:** {user}',
      '🎫 **Ticket:** #{number}',
      '',
      'ℹ️ Use o botão abaixo para ir ao ticket'
    ].join('\n'),

    FINAL_TITLE: 'Giveaway Aprovado',
    FINAL_DESCRIPTION_VERIFIED: [
      '**Casino**',
      '{casino}',
      '',
      '**Prenda**',
      '{prize}',
      '',
      '**User**',
      '{user} (✅ **{casino} Afiliado Verificado**)',
      '',
      '**Ticket**',
      'ticket-{number}',
      '',
      '**Endereço LTC**',
      '{ltc}'
    ].join('\n'),

    FINAL_DESCRIPTION_WITH_ID: [
      '**Casino**',
      '{casino}',
      '',
      '**Prenda**',
      '{prize}',
      '',
      '**User**',
      '{user}',
      '',
      '**Ticket**',
      'ticket-{number}',
      '',
      '**ID {casino}**',
      '{id}',
      '',
      '**Endereço LTC**',
      '{ltc}'
    ].join('\n'),

    FINAL_DESCRIPTION_NORMAL: [
      '**Casino**',
      '{casino}',
      '',
      '**Prenda**',
      '{prize}',
      '',
      '**User**',
      '{user}',
      '',
      '**Ticket**',
      'ticket-{number}',
      '',
      '**Endereço LTC**',
      '{ltc}'
    ].join('\n'),

    PAID_TITLE: 'Giveaway Pago!',
    PAID_DESCRIPTION: [
      '**Foi enviado <3**',
      '',
      'Assim que conseguires confirma que recebeste!',
      'Sempre com juízo no casino!',
      '',
      'Se não tiveres mais questões podes fechar o ticket ❤️'
    ].join('\n'),

    REJECTION_TITLE: 'Giveaway Rejeitado',
    REJECTION_DESCRIPTION: [
      '**O seu giveaway foi rejeitado pelo seguinte motivo:**',
      '',
      '📝 **Motivo:** {reason}',
      '',
      'ℹ️ Podes reenviar depois de corrigires o problema',
      '🛡️ Entra em contacto com o suporte se tiver dúvidas'
    ].join('\n'),

    REVIEW_TITLE: 'Solicitação de Revisão',
    REVIEW_DESCRIPTION: [
      '**Ticket #{number} precisa de revisão**',
      '',
      '👤 **User:** {user}',
      '📝 **Motivo:** {reason}',
      '',
      '🛡️ Suporte da equipa necessário'
    ].join('\n'),

    REVIEW_SENT: 'Solicitação de revisão enviada para o equipa.'
  },

  // === CÓDIGOS TELEGRAM DUPLICADOS ===
  DUPLICATE_CODES: {
    ALERT_TITLE: 'CÓDIGO TELEGRAM DUPLICADO DETECTADO',
    ALERT_DESCRIPTION: [
      '**🚨 CÓDIGO TELEGRAM DUPLICADO DETECTADO**',
      '',
      '🔴 **Código:** `{code}`',
      '',
      '📋 **Uso Original:**',
      '• Ticket: #{originalTicket}',
      '• Usuário: {originalUser}',
      '• Casino: {originalCasino}',
      '• Data: {originalDate}',
      '',
      '🆕 **Tentativa Atual:**',
      '• Ticket: #{currentTicket}',
      '• Usuário: {currentUser}',
      '• Canal: {currentChannel}',
      '',
      '⚠️ **AMBOS os tickets foram pausados para revisão manual**'
    ].join('\n'),

    SITUATION_RESOLVED: 'Situação de código duplicado resolvida! Ambos os tickets foram reativados.',
    RESOLUTION_ERROR: 'Erro ao resolver situação de código duplicado'
  },

  // === TRANSCRIPTS ===
  TRANSCRIPTS: {
    CREATED_TITLE: 'Transcript Criado',
    CREATED_DESCRIPTION: [
      '**Transcript do ticket #{number} foi salvo com sucesso!**',
      '',
      '📋 **ID:** `{id}`',
      '🎫 **Ticket:** #{number} ({channel})',
      '👤 **User:** {user}',
      '📂 **Categoria:** {category}',
      '⏰ **Expira em:** <t:{expires}:R>',
      '🔒 **Acesso:** Apenas staff autorizado',
      '',
      'ℹ️ Use os botões abaixo para visualizar ou fazer download'
    ].join('\n'),

    VIEW_TITLE: 'Transcript: Ticket #{number}',
    VIEW_DESCRIPTION: [
      '**Canal:** #{channel}',
      '**User:** {user}',
      '**Categoria:** {category}',
      '**Criado:** <t:{created}:F>',
      '**Expira:** <t:{expires}:R>',
      '',
      '**Prévia do conteúdo:**',
      '```',
      '{preview}',
      '```'
    ].join('\n'),

    USER_LIST_TITLE: 'Transcripts de {user}',
    USER_LIST_DESCRIPTION: [
      '**Total de transcripts:** {total}',
      '**Página:** {page}/{totalPages}',
      '',
      'ℹ️ Use `/transcript id <ID>` para ver um transcript específico',
      '💾 Use os botões de paginação para navegar'
    ].join('\n'),

    USER_NO_TRANSCRIPTS: 'O usuário **{user}** não possui transcripts.',
    USER_NO_MORE_PAGES: 'Não há mais transcripts na página {page}.',

    ALL_LIST_TITLE: 'Todos os Transcripts',
    CATEGORY_LIST_TITLE: 'Transcripts da Categoria: {category}',
    ALL_LIST_DESCRIPTION: [
      '**Total de transcripts:** {total}',
      '**Página:** {page}/{totalPages}',
      '**Categoria:** {category}',
      '',
      'ℹ️ Use `/transcript id <ID>` para ver um transcript específico',
      '💾 Use os botões de paginação para navegar'
    ].join('\n'),
    DOWNLOAD_SUCCESS: 'Download do transcript **{channel}**',
    NOT_FOUND: 'Transcript não encontrado ou expirado',
    SENT_TO_CHANNEL: 'Transcript **{channel}** enviado para {channelMention}',
    SEND_ERROR: 'Erro ao enviar transcript para o canal',
    GET_ERROR: 'Erro ao obter transcripts'
  },

  // === ESTATÍSTICAS ===
  STATISTICS: {
    TITLE: 'Estatísticas dos Tickets',
    DESCRIPTION: [
      '📅 **Tickets Criados por Período:**',
      '🕐 **Último dia:** {last1Day}',
      '🕐 **Últimos 2 dias:** {last2Days}',
      '🕐 **Últimos 7 dias:** {last7Days}',
      '🕐 **Últimos 30 dias:** {last30Days}',
      '',
      '🎫 **Tickets Ativos:** {activeTickets}',
      '',
      '⏳ **Submissões:**',
      '⏳ **Pendentes:** {submissionsPending}',
      '✅ **Aprovadas:** {submissionsApproved}',
      '❌ **Rejeitadas:** {submissionsRejected}',
      '📊 **Total:** {submissionsTotal}',
      '',
      '💰 **Aprovações:**',
      '⏳ **Pendentes:** {approvalsPending}',
      '💰 **Pagas:** {approvalsPaid}',
      '🔍 **Em Revisão:** {approvalsReview}',
      '📊 **Total:** {approvalsTotal}',
      '',
      '📋 **Transcripts Criados (30 dias):** {transcriptsCreated}'
    ].join('\n'),

    CATEGORIES_FIELD: 'Tickets por Categoria (30 dias)',
    COUNTERS_FIELD: 'Contadores por Categoria',
    NO_DATA: 'Nenhum dado encontrado',
    UPDATED: 'Estatísticas atualizadas no canal {channel}',
    UPDATE_ERROR: 'Erro ao atualizar estatísticas no canal',
    GET_ERROR: 'Erro ao obter estatísticas'
  },

  // === COMANDOS ===
  COMMANDS: {
    TICKETS_UPDATED: 'Mensagem de tickets atualizada com sucesso!',
    TICKETS_UPDATE_ERROR: 'Erro ao atualizar mensagem de tickets',
    
    PROMO_CREATED: 'Promoção **{name}** criada com sucesso!\nID: `{id}`\n\nℹ️ Mensagem de tickets atualizada automaticamente.',
    CATEGORY_CREATED: 'Categoria **{name}** criada com sucesso!\nID: `{id}`\n\nℹ️ Mensagem de tickets atualizada automaticamente.',
    
    PROMO_CLOSED: 'Promoção `{name}` (ID: `{id}`) foi fechada com sucesso',
    CATEGORY_CLOSED: 'Categoria `{name}` (ID: `{id}`) foi fechada com sucesso',
    
    INVALID_PROMO_ID: 'ID de promoção inválido: `{id}`\n\nPromoções disponíveis: {available}',
    INVALID_CATEGORY_ID: 'ID de categoria inválido: `{id}`\n\nCategorias disponíveis: {available}',
    
    NO_PROMOS_FOUND: 'Nenhuma promoção encontrada',
    NO_CATEGORIES_FOUND: 'Nenhuma categoria encontrada',
    
    PROMO_CLOSE_ERROR: 'Erro ao fechar promoção',
    CATEGORY_CLOSE_ERROR: 'Erro ao fechar categoria',
    
    PROMO_LIST_ERROR: 'Erro ao obter lista de promoções',
    CATEGORY_LIST_ERROR: 'Erro ao obter lista de categorias'
  },

  // === BOTÕES ===
  BUTTONS: {
    NEXT_STEP: 'Próximo Passo',
    FINISH: 'Finalizar',
    SUPPORT: 'Falar com Suporte',
    CLOSE_TICKET: 'Fechar Ticket',
    CONFIRM_CLOSE: 'Sim, Fechar Ticket',
    CANCEL_CLOSE: 'Cancelar',
    RESUBMIT: 'Reenviar',
    APPROVE: 'Aprovar',
    REJECT: 'Não Aprovar',
    PAID: 'Pago',
    REVIEW: 'Rever',
    GOTO_TICKET: 'Ir para Ticket',
    VIEW_TRANSCRIPT: 'Ver Transcript',
    DOWNLOAD: 'Download',
    MARK_COMPLETE: 'Marcar como Concluído',
    MARK_RESOLVED: 'Marcar como Resolvido',
    REPORT_BUG: 'Reportar Bug',
    REDEEM_ITEM: 'Resgatar Redeem'
  },

  // === LABELS E PLACEHOLDERS ===
  LABELS: {
    PROMO_NAME: 'Nome da Promoção',
    PROMO_END_DATE: 'Data de Término (AAAA-MM-DD HH:MM)',
    PROMO_CASINO: 'Casino ("todos" ou nome específico)',
    PROMO_COLOR: 'Cor do Botão (blue|grey|green|red)',
    PROMO_EMOJI: 'Emoji (opcional)',
    
    CATEGORY_NAME: 'Nome da Categoria',
    CATEGORY_COLOR: 'Cor do Botão (blue|grey|green|red)',
    CATEGORY_EMOJI: 'Emoji (opcional)',
    
    PRIZE_VALUE: 'Valor da Prenda',
    REJECT_REASON: 'Motivo da Rejeição',
    REVIEW_REASON: 'Motivo da Revisão'
  },

  PLACEHOLDERS: {
    PROMO_NAME: 'Ex: Flash Promo Weekend',
    PROMO_END_DATE: '2025-12-31 23:30',
    PROMO_CASINO: 'Hexabet, BCGame, ou "todos"',
    PROMO_COLOR: 'blue',
    PROMO_EMOJI: '🔥',
    
    CATEGORY_NAME: 'Ex: Suporte Técnico',
    CATEGORY_COLOR: 'blue',
    CATEGORY_EMOJI: '🛠️',
    
    PRIZE_VALUE: 'Ex: 30',
    REJECT_REASON: 'Explique o motivo da rejeição...',
    REVIEW_REASON: 'Explique o motivo da revisão...'
  },

  // === FOOTERS ===
  FOOTERS: {
    TICKET_SYSTEM: 'Sistema de Tickets',
    GIVEAWAY_SYSTEM: 'Sistema de Giveaways',
    VIP_SYSTEM: 'Sistema VIP',
    QUESTIONS_SYSTEM: 'Sistema de Dúvidas',
    WEBSITE_SUPPORT: 'Suporte do Website',
    REDEEM_SYSTEM: 'Sistema de Redeems',
    REDEEM_PROCESSING: 'Redeem em Processamento',
    LIMITED_PROMO: 'Promoção Limitada',
    AUTOMATED_SUPPORT: 'Sistema Automatizado de Suporte',
    MANDATORY_18: 'Confirmação Obrigatória +18',
    SUBMISSIONS_SYSTEM: 'Sistema de Submissões',
    APPROVALS_SYSTEM: 'Sistema de Aprovações',
    REVIEWS_SYSTEM: 'Sistema de Revisões',
    SUPPORT_SYSTEM: 'Sistema de Suporte',
    ANTI_FRAUD: 'Sistema de Alerta',
    TRANSCRIPT_EXPIRES: 'Transcript • Expira em 2 semanas',
    STATS_AUTO_UPDATE: 'Estatísticas atualizadas automaticamente',
    CONGRATULATIONS: 'Parabéns pelo prémio!'
  },

  // === PERMISSÕES ===
  PERMISSIONS: {
    NO_PERMISSION: 'Naõ tens permissão para usar o botão',
    MOD_ONLY: 'Este comando requer permissões de moderador',
    ADMIN_ONLY: 'Este comando requer permissões de administrador'
  },

  // === MENSAGENS ADICIONAIS E SISTEMA DE ERROR HANDLING ===
  ADDITIONAL: {
    // Error Handling System
    ERROR_HANDLER: {
      SYSTEM_ERROR_TITLE: 'Erro do Sistema',
      CRITICAL_ERROR_TITLE: 'ERRO CRÍTICO',
      WARNING_TITLE: 'Aviso do Sistema',
      INFO_TITLE: 'Informação do Sistema',
      
      SYSTEM_ERROR_DESCRIPTION: [
        'Ocorreu um erro interno no sistema.',
        '',
        '🛡️ **A equipa técnica foi notificada**',
        '🔄 **Tente novamente em alguns momentos**',
        '💬 **Se persistir, contacte o suporte**'
      ].join('\n'),
      
      CRITICAL_ERROR_DETECTED: '@here **ERRO CRÍTICO DETECTADO**',
      ERROR_CONTEXT_FIELD: 'Contexto',
      ERROR_TIMESTAMP_FIELD: 'Timestamp',
      ERROR_SEVERITY_FIELD: 'Severidade',
      SEVERITY_CRITICAL: 'CRÍTICA',
      SEVERITY_NORMAL: 'Normal',
      
      GRACEFUL_SHUTDOWN_START: 'Starting graceful shutdown...',
      GRACEFUL_SHUTDOWN_COMPLETE: 'Graceful shutdown completed',
      DATABASE_CLOSED: 'Database connections closed',
      CLIENT_DESTROYED: 'Discord client destroyed',
      
      MONITORING_FOOTER: 'Sistema de Monitorização de Erros',
      RECOVERY_FOOTER: 'Sistema de Recuperação de Erros',
      LOGS_FOOTER: 'Sistema de Logs'
    },

    // Duplicate Telegram Codes
    DUPLICATE_TELEGRAM: {
      ALERT_TITLE: 'CÓDIGO TELEGRAM DUPLICADO DETECTADO',
      ALERT_DESCRIPTION: [
        '**🚨 CÓDIGO TELEGRAM DUPLICADO DETECTADO**',
        '',
        '🔴 **Código:** `{code}`',
        '',
        '📋 **Uso Original:**',
        '• Ticket: #{originalTicket}',
        '• Usuário: {originalUser}',
        '• Casino: {originalCasino}',
        '• Data: {originalDate}',
        '',
        '🆕 **Tentativa Atual:**',
        '• Ticket: #{currentTicket}',
        '• Usuário: {currentUser}',
        '• Canal: {currentChannel}',
        '',
        '⚠️ **AMBOS os tickets foram pausados para revisão manual**'
      ].join('\n'),
      
      USER_NOTIFICATION: [
        '🚨 **Código já foi utilizado anteriormente**',
        '',
        'Este código foi usado no ticket #{originalTicket} por {originalUser}',
        '',
        '⏳ **Ticket pausado para revisão manual**',
        '🛡️ **A equipa foi notificada**',
        '',
        'Aguarda enquanto a nossa equipa verifica a situação.'
      ].join('\n'),
      
      TICKET_PAUSED: [
        '⚠️ **Ticket pausado para revisão**',
        '',
        'O código `{code}` foi usado novamente em outro ticket.',
        '',
        '🛡️ **A equipa foi notificada**',
        'Aguarde enquanto a nossa equipa verifica a situação.'
      ].join('\n'),
      
      SITUATION_RESOLVED: 'Situação de código duplicado resolvida! Ambos os tickets foram reativados.',
      RESOLUTION_ERROR: 'Erro ao resolver situação de código duplicado',
      BOTH_TICKETS_REACTIVATED: '✅ **Situação resolvida pelo suporte**\n\nPode continuar com o seu ticket normalmente.',
      
      BUTTON_ORIGINAL_TICKET: 'Ticket Original #{number}',
      BUTTON_CURRENT_TICKET: 'Ticket Atual #{number}',
      BUTTON_MARK_RESOLVED: 'Marcar como Resolvido'
    },

    // BCGame Specific Messages
    BCGAME: {
      STEP1_DESCRIPTION: '📧 Envia **screenshot** do email de registro no BC.Game **e** o **ID da BCGame em texto**',
      MISSING_EMAIL: '**screenshot do email**',
      MISSING_ID: '**ID da BCGame em texto**',
      ID_RECEIVED: 'ID da BCGame recebido: {id}',
      VERIFICATION_ROLE_ADDED: 'Cargo de verificação BCGame adicionado ao usuário {user}'
    },

    // Verified Users System
    VERIFIED_USERS: {
      SKIP_CHECKLIST: '✅ **Utilizador verificado** - envia **imagem do depósito com QR visível** + **endereço LTC em texto**.',
      MISSING_REQUIREMENTS: 'Ainda falta: {missing}',
      DEPOSIT_COMPLETE: 'Depósito e endereço LTC recebidos! Clique em **Finalizar** para completar.',
      VERIFICATION_STATUS: 'Status de verificação: {status}',
      VERIFIED_FOR_CASINO: 'Verificado para {casino}',
      NOT_VERIFIED: 'Não verificado'
    },

    // Database and System Messages
    DATABASE: {
      CONNECTION_SUCCESS: 'Connected to MongoDB',
      CONNECTION_ERROR: 'MongoDB connection error',
      CONNECTION_CLOSED: 'MongoDB connection closed',
      CATEGORIES_LOADED: 'Loaded {count} categories from database',
      PROMOTIONS_LOADED: 'Loaded {count} promotions from database',
      TICKET_STATES_RESTORED: 'Restored {count} ticket states from MongoDB',
      CLEANUP_COMPLETED: 'Cleaned up {count} old records',
      SAVE_ERROR: 'Error saving to database',
      LOAD_ERROR: 'Error loading from database'
    },

    // Auto-Update Messages
    AUTO_UPDATE: {
      STATS_UPDATED: 'Statistics updated in stats channel',
      TICKET_MESSAGE_UPDATED: 'Ticket message updated automatically',
      PROMOTIONS_REFRESHED: 'Promotions refreshed from database',
      CATEGORIES_REFRESHED: 'Categories refreshed from database',
      EXPIRED_PROMOTIONS: 'Expired promotion: {name} (ID: {id})',
      UPDATE_ERROR: 'Error during automatic update'
    },

    // Logs and Monitoring
    LOGS: {
      TICKET_CREATED: 'Ticket created: #{number} by {user}',
      TICKET_CLOSED: 'Ticket closed: #{number}',
      CATEGORY_CREATED: 'Category created: {name} (ID: {id})',
      PROMOTION_CREATED: 'Promotion created: {name} (ID: {id})',
      USER_VERIFIED: 'User verified for {casino}: {user}',
      CODE_VALIDATED: 'Telegram code validated: {code}',
      DUPLICATE_CODE_DETECTED: 'Duplicate telegram code detected: {code}',
      SUPPORT_REQUESTED: 'Support requested in ticket #{number}',
      TRANSCRIPT_CREATED: 'Transcript created: {id}',
      SUBMISSION_APPROVED: 'Submission approved: ticket #{number}',
      SUBMISSION_REJECTED: 'Submission rejected: ticket #{number}',
      PAYMENT_COMPLETED: 'Payment completed: ticket #{number}'
    },

    // Debug and Development
    DEBUG: {
      FORCE_REFRESH_START: 'FORCE REFRESH: Starting...',
      FORCE_REFRESH_COMPLETE: 'FORCE REFRESH: Memory now has {count} items',
      MEMORY_STATE: 'Items in memory: {items}',
      DATABASE_STATE: 'Database returned {count} items',
      DIRECT_DB_QUERY: 'Direct DB query returned {count} items',
      REFRESH_COMPLETE: 'Refresh Completo Executado',
      INITIALIZATION_COMPLETE: 'System initialization complete',
      ERROR_HANDLER_READY: 'Error handlers initialized',
      BOT_READY: 'Bot online como {tag}'
    },

    // Casino Verification
    CASINO_VERIFICATION: {
      ROLE_ADDED: 'Verification role added for {casino}',
      ROLE_ADD_ERROR: 'Error adding verification role',
      USER_VERIFIED_FOR: 'User {user} verified for {casino}',
      VERIFICATION_CHECK: 'Checking verification for {casino}',
      NO_VERIFICATION_ROLE: 'No verification role configured for {casino}'
    },

    // Automatic Progression
    AUTO_PROGRESSION: {
      NEXT_STEP_AUTO: 'Avançando automaticamente para o próximo passo...',
      STEP_COMPLETED: 'Passo {step} concluído! Próximo passo:',
      CHECKLIST_AUTO_ADVANCE: 'Checklist avança automaticamente após validação',
      VIP_STEP_COMPLETED: 'Passo VIP {step} concluído',
      FINAL_STEP_REACHED: 'Último passo do checklist atingido'
    },

    // Category Overflow System
    CATEGORY_OVERFLOW: {
      CATEGORY_FULL: 'Categoria {name} está cheia ({count}/50 canais)',
      CREATING_OVERFLOW: 'Criando nova categoria: {name}',
      USING_EXISTING: 'Usando categoria existente: {name} ({count}/50 canais)',
      OVERFLOW_CREATED: 'Nova categoria criada devido a overflow: {name}',
      CHANNEL_LIMIT_REACHED: 'Limite de canais atingido na categoria {name}',
      AUTO_ORGANIZATION: 'Sistema de organização automática ativo'
    }
  },

  // === ERROS COMUNS ===
  ERRORS: {
    SUBMISSION_NOT_FOUND: 'Submissão não encontrada',
    APPROVAL_NOT_FOUND: 'Aprovação não encontrada',
    TICKET_STATE_NOT_FOUND: 'Estado do ticket não encontrado',
    CASINO_NOT_CONFIGURED: 'Casino não configurado no sistema',
    DATABASE_ERROR: 'Erro na base de dados',
    CHANNEL_NOT_FOUND: 'Canal não encontrado',
    USER_NOT_FOUND: 'Utilizador não encontrado',
    INVALID_INPUT: 'Entrada inválida',
    OPERATION_FAILED: 'Operação falhou',
    TIMEOUT: 'Operação expirou',
    NETWORK_ERROR: 'Erro de rede',
    UNKNOWN_ERROR: 'Erro desconhecido',
    INTERNAL_ERROR: 'Erro interno do sistema',
    SYSTEM_ERROR_TITLE: 'Erro Interno',
    SYSTEM_ERROR_DESCRIPTION: [
      'Ocorreu um erro interno no sistema.',
      '',
      '🛡️ **A equipa técnica foi notificada**',
      '🔄 **Tente novamente em alguns momentos**',
      '💬 **Se persistir, contacte o suporte**'
    ].join('\n'),
    CRITICAL_ERROR_ALERT: 'ERRO CRÍTICO DETECTADO',
    ERROR_RECOVERY_FOOTER: 'Sistema de Recuperação de Erros'
  },

  // === ERROS COMUNS ===
  ERRORS: {
    SUBMISSION_NOT_FOUND: 'Submissão não encontrada',
    APPROVAL_NOT_FOUND: 'Aprovação não encontrada',
    TICKET_STATE_NOT_FOUND: 'Estado do ticket não encontrado',
    CASINO_NOT_CONFIGURED: 'Casino não configurado no sistema',
    DATABASE_ERROR: 'Erro na base de dados',
    CHANNEL_NOT_FOUND: 'Canal não encontrado',
    USER_NOT_FOUND: 'Utilizador não encontrado',
    INVALID_INPUT: 'Entrada inválida',
    OPERATION_FAILED: 'Operação falhou',
    TIMEOUT: 'Operação expirou',
    NETWORK_ERROR: 'Erro de rede',
    UNKNOWN_ERROR: 'Erro desconhecido',
    INTERNAL_ERROR: 'Erro interno do sistema',
    SYSTEM_ERROR_TITLE: 'Erro Interno',
    SYSTEM_ERROR_DESCRIPTION: [
      'Ocorreu um erro interno no sistema.',
      '',
      '🛡️ **A equipa técnica foi notificada**',
      '🔄 **Tente novamente em alguns momentos**',
      '💬 **Se persistir, contacte o suporte**'
    ].join('\n'),
    CRITICAL_ERROR_ALERT: 'ERRO CRÍTICO DETECTADO',
    ERROR_RECOVERY_FOOTER: 'Sistema de Recuperação de Erros'
  }
};