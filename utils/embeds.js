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

  static transcriptCreated(transcriptId, channelName) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} Transcript Criado`)
      .setDescription([
        `**Transcript do canal #${channelName} foi salvo com sucesso!**`,
        '',
        `📋 **ID:** \`${transcriptId}\``,
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
      .setTitle(`📋 Transcript: #${transcript.channelName}`)
      .setDescription([
        `**Usuário:** ${transcript.ownerTag}`,
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
}

module.exports = EmbedFactory;