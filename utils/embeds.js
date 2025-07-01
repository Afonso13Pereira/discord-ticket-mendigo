// utils/embeds.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, ICONS } = require('../config/constants');

class EmbedFactory {
  static success(description, title = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setDescription(`${EMOJIS.SUCCESS} ${description}`)
      .setTimestamp();
    
    if (title) embed.setTitle(title);
    return embed;
  }

  static error(description, title = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setDescription(`${EMOJIS.ERROR} ${description}`)
      .setTimestamp();
    
    if (title) embed.setTitle(title);
    return embed;
  }

  static warning(description, title = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setDescription(`${EMOJIS.WARNING} ${description}`)
      .setTimestamp();
    
    if (title) embed.setTitle(title);
    return embed;
  }

  static info(description, title = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setDescription(`${EMOJIS.INFO} ${description}`)
      .setTimestamp();
    
    if (title) embed.setTitle(title);
    return embed;
  }

  static primary(description, title = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setDescription(description)
      .setTimestamp();
    
    if (title) embed.setTitle(title);
    return embed;
  }

  static casino(title, description, thumbnail = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.GOLD)
      .setTitle(`${EMOJIS.CASINO} ${title}`)
      .setDescription(description)
      .setTimestamp();
    
    if (thumbnail) embed.setThumbnail(thumbnail);
    return embed;
  }

  static ticket(title, description, color = COLORS.PRIMARY) {
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`${EMOJIS.TICKET} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: 'Sistema de Tickets • Suporte 24/7' });
  }

  static giveaway(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.GOLD)
      .setTitle(`${EMOJIS.GIFT} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: 'Sistema de Giveaways' });
  }

  static vip(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.VIP} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: 'Sistema VIP' });
  }

  static question(title, description) {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.QUESTION} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: 'Sistema de Dúvidas' });
  }

  static promo(promo) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.FIRE} ${promo.name}`)
      .setDescription(`**Casino:** ${promo.casino}\n**Termina:** <t:${Math.floor(new Date(promo.end)/1000)}:R>`)
      .setTimestamp()
      .setFooter({ text: 'Promoção Limitada' });
    
    if (promo.emoji) embed.setTitle(`${promo.emoji} ${promo.name}`);
    return embed;
  }

  static welcome() {
    return new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.ROBOT} Olá! Eu sou o seu assistente`)
      .setDescription([
        '**Bem-vindo ao sistema de suporte!**',
        '',
        `${EMOJIS.STAR} Siga as instruções abaixo para continuar`,
        `${EMOJIS.SHIELD} Todas as suas informações estão seguras`,
        `${EMOJIS.DIAMOND} Suporte disponível 24/7`
      ].join('\n'))
      .setImage('https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif')
      .setTimestamp()
      .setFooter({ text: 'Sistema Automatizado de Suporte' });
  }

  static confirmation() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} Confirmação de Elegibilidade`)
      .setDescription([
        '**Para continuar, confirme que:**',
        '',
        `${EMOJIS.SHIELD} Tenho mais de 18 anos`,
        `${EMOJIS.GIFT} Desejo reclamar o prémio`,
        `${EMOJIS.STAR} Assumo responsabilidade pelas minhas apostas`,
        `${EMOJIS.WARNING} Reconheço o risco de dependência`,
        '',
        '**Digite exatamente:** `Sim, eu confirmo`'
      ].join('\n'))
      .setThumbnail('https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif')
      .setTimestamp()
      .setFooter({ text: 'Confirmação Obrigatória +18' });
  }

  static vipCasinoSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.VIP} Seleção de Casino VIP`)
      .setDescription([
        '**Escolha o casino onde deseja reclamar o VIP:**',
        '',
        `${EMOJIS.DIAMOND} Casinos VIP disponíveis`,
        `${EMOJIS.SHIELD} Suporte especializado`,
        `${EMOJIS.STAR} Benefícios exclusivos`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema VIP' });
  }

  static vipTypeSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.VIP} Tipo de VIP`)
      .setDescription([
        '**Escolha o tipo de VIP que deseja reclamar:**',
        '',
        `${EMOJIS.STAR} **Semanal** - VIP por uma semana`,
        `${EMOJIS.CROWN} **Leaderboard** - VIP por posição no ranking`,
        '',
        `${EMOJIS.INFO} Cada tipo tem requisitos diferentes`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema VIP' });
  }

  static vipChecklist(step, total, description, type) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.VIP} VIP ${type.toUpperCase()} - Passo ${step}/${total}`)
      .setDescription(`**${description}**`)
      .setTimestamp()
      .setFooter({ text: `Progresso VIP: ${step}/${total} passos concluídos` });
    
    return embed;
  }

  static questionDescription() {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.QUESTION} Descreva a sua Dúvida`)
      .setDescription([
        '**Por favor, descreva o seu problema da melhor forma possível:**',
        '',
        `${EMOJIS.INFO} Seja específico e detalhado`,
        `${EMOJIS.STAR} Inclua capturas de ecrã se necessário`,
        `${EMOJIS.SHIELD} A nossa equipa irá ajudá-lo`,
        '',
        '**Digite a sua dúvida abaixo:**'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Dúvidas' });
  }

  static otherHelp() {
    return new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle(`${EMOJIS.INFO} Como Podemos Ajudar?`)
      .setDescription([
        '**Em que podemos ajudá-lo hoje?**',
        '',
        `${EMOJIS.STAR} Descreva o que precisa`,
        `${EMOJIS.SHIELD} A nossa equipa está aqui para ajudar`,
        `${EMOJIS.DIAMOND} Suporte personalizado`,
        '',
        '**Digite a sua solicitação abaixo:**'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Suporte Geral' });
  }

  static checklist(step, total, description, image = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.LOADING} Passo ${step}/${total}`)
      .setDescription(`**${description}**`)
      .setTimestamp()
      .setFooter({ text: `Progresso: ${step}/${total} passos concluídos` });
    
    if (image) embed.setImage(image);
    return embed;
  }

  static ticketClose() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} Fechar Ticket`)
      .setDescription([
        '**Como deseja proceder com este ticket?**',
        '',
        '📋 **Fechar com Transcript** - Salva todas as mensagens por 2 semanas',
        '🗑️ **Eliminar Ticket** - Remove o canal permanentemente',
        '',
        `${EMOJIS.INFO} Transcripts expiram automaticamente após 2 semanas`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Escolha uma opção abaixo' });
  }

  static transcriptCreated(transcriptId, channelName, ticketNumber, ownerTag, category) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Transcript Criado`)
      .setDescription([
        `**Transcript do ticket #${ticketNumber} foi salvo com sucesso!**`,
        '',
        `📋 **ID:** \`${transcriptId}\``,
        `🎫 **Ticket:** #${ticketNumber} (${channelName})`,
        `👤 **Usuário:** ${ownerTag}`,
        `📂 **Categoria:** ${category}`,
        `⏰ **Expira em:** <t:${Math.floor((Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000)}:R>`,
        `🔒 **Acesso:** Apenas staff autorizado`,
        '',
        `${EMOJIS.INFO} Use os botões abaixo para visualizar ou fazer download`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Transcript • Expira em 2 semanas' });
  }

  static transcriptView(transcript) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`📋 Transcript: Ticket #${transcript.ticketNumber}`)
      .setDescription([
        `**Canal:** #${transcript.channelName}`,
        `**Usuário:** ${transcript.ownerTag}`,
        `**Categoria:** ${transcript.category}`,
        `**Criado:** <t:${Math.floor(transcript.createdAt.getTime() / 1000)}:F>`,
        `**Expira:** <t:${Math.floor(transcript.expiresAt.getTime() / 1000)}:R>`,
        '',
        `**Prévia do conteúdo:**`,
        '```',
        transcript.content.substring(0, 1000) + (transcript.content.length > 1000 ? '...' : ''),
        '```'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: `ID: ${transcript.transcriptId}` });
    
    return embed;
  }

  // === SUBMISSION EMBEDS ===
  static submissionReady(ticketNumber, userTag, channelId) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.GIFT} Ticket Pronto para Aprovação`)
      .setDescription([
        `**Ticket #${ticketNumber} pronto para ser aprovado**`,
        '',
        `👤 **Usuário:** ${userTag}`,
        `🎫 **Ticket:** #${ticketNumber}`,
        '',
        `${EMOJIS.INFO} Use o botão abaixo para ir ao ticket`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Submissões' });
  }

  // === APPROVAL EMBEDS ===
  static approvalFinal(casino, prize, userTag, ticketNumber, ltcAddress) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.GIFT} Giveaway Aprovado`)
      .setDescription([
        '**Casino**',
        casino || 'N/A',
        '',
        '**Prenda**',
        prize || 'N/A',
        '',
        '**Utilizador**',
        userTag,
        '',
        '**Ticket**',
        `ticket-${ticketNumber}`,
        '',
        '**Endereço LTC**',
        ltcAddress || 'N/A'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Aprovações' });
  }

  static giveawayPaid() {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Giveaway Pago!`)
      .setDescription([
        '**Foi enviado <3**',
        '',
        'Assim que conseguires confirma que recebeste!',
        'Sempre com juízo no casino!',
        '',
        'Se não tiveres mais questões podes fechar o ticket'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Parabéns pelo seu prémio!' });
  }

  static rejectionReason(reason) {
    return new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle(`${EMOJIS.ERROR} Giveaway Rejeitado`)
      .setDescription([
        '**O seu giveaway foi rejeitado pelo seguinte motivo:**',
        '',
        `📝 **Motivo:** ${reason}`,
        '',
        `${EMOJIS.INFO} Pode reenviar corrigindo o problema`,
        `${EMOJIS.SHIELD} Entre em contacto com o suporte se tiver dúvidas`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Aprovações' });
  }

  static reviewRequest(reason, ticketNumber, userTag) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} Solicitação de Revisão`)
      .setDescription([
        `**Ticket #${ticketNumber} precisa de revisão**`,
        '',
        `👤 **Usuário:** ${userTag}`,
        `📝 **Motivo:** ${reason}`,
        '',
        `${EMOJIS.SHIELD} Suporte humano necessário`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Revisões' });
  }
}

module.exports = EmbedFactory;