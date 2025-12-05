// utils/embeds.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, ICONS } = require('../config/constants');
const MESSAGES = require('../config/messages');

// Função auxiliar para validar e sanitizar URLs de imagem
function validateImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Remover espaços e quebras de linha
  url = url.trim();
  
  // Verificar se é uma URL válida
  try {
    const urlObj = new URL(url);
    
    // Verificar se o protocolo é http ou https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // O Discord rejeita hostnames com underscores (ex: api_cdn)
    // Substituir underscore por hífen no hostname
    if (urlObj.hostname.includes('_')) {
      urlObj.hostname = urlObj.hostname.replace(/_/g, '-');
    }
    
    // Garantir que a URL está bem formada
    // O Discord aceita webp, então não precisamos filtrar por extensão
    return urlObj.href;
  } catch (error) {
    // Se não for uma URL válida, retornar null
    console.warn('[EMBED] URL de imagem inválida:', url, error.message);
    return null;
  }
}

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

  static ticket(color = COLORS.PRIMARY) {
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(MESSAGES.TICKETS.SYSTEM_TITLE)
      .setDescription(MESSAGES.TICKETS.SYSTEM_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static giveaway() {
    return new EmbedBuilder()
      .setColor(COLORS.GOLD)
      .setTitle(MESSAGES.GIVEAWAYS.TYPE_SELECTION_TITLE)
      .setDescription(MESSAGES.GIVEAWAYS.TYPE_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static vip() {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(MESSAGES.VIP.TYPE_SELECTION_TITLE)
      .setDescription(MESSAGES.VIP.TYPE_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static question() {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(MESSAGES.QUESTIONS.DESCRIPTION_TITLE)
      .setDescription(MESSAGES.QUESTIONS.DESCRIPTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static welcome() {
    return new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(MESSAGES.TICKETS.WELCOME_TITLE)
      .setDescription(MESSAGES.TICKETS.WELCOME_DESCRIPTION)
      .setImage('https://i.imgur.com/Zkymy68.png')
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static confirmation() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(MESSAGES.CONFIRMATION.TITLE)
      .setDescription(MESSAGES.CONFIRMATION.DESCRIPTION)
      .setThumbnail('https://www.stokestaffslep.org.uk/wp-content/uploads/2025/03/gambleaware-logo.png')
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  // === WEBSITE EMBEDS ===
  static websiteTypeSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(MESSAGES.WEBSITE.TYPE_SELECTION_TITLE)
      .setDescription(MESSAGES.WEBSITE.TYPE_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static websiteBugReport() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(MESSAGES.WEBSITE.BUG_REPORT_TITLE)
      .setDescription(MESSAGES.WEBSITE.BUG_REPORT_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static websiteRedeemNick() {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(MESSAGES.WEBSITE.REDEEM_NICK_TITLE)
      .setDescription(MESSAGES.WEBSITE.REDEEM_NICK_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static websiteNoRedeems(twitchNick) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(MESSAGES.WEBSITE.REDEEM_NO_REDEEMS_TITLE)
      .setDescription(MESSAGES.WEBSITE.REDEEM_NO_REDEEMS_DESCRIPTION.replace('{nick}', twitchNick))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static websiteRedeemList(twitchNick, redeems) {
    const redeemList = redeems.map((redeem, index) => 
      `${index + 1}. **${redeem.itemName}** (${new Date(redeem.createdAt).toLocaleDateString('pt-PT')})`
    ).join('\n');

    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(MESSAGES.WEBSITE.REDEEM_LIST_TITLE.replace('{nick}', twitchNick))
      .setDescription(MESSAGES.WEBSITE.REDEEM_LIST_DESCRIPTION
        .replace('{count}', redeems.length)
        .replace('{list}', redeemList))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static websiteRedeemSelected(redeem) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(MESSAGES.WEBSITE.REDEEM_SELECTED_TITLE)
      .setDescription(MESSAGES.WEBSITE.REDEEM_SELECTED_DESCRIPTION
        .replace('{item}', redeem.itemName)
        .replace('{nick}', redeem.twitchName)
        .replace('{date}', new Date(redeem.createdAt).toLocaleDateString('pt-PT')))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static vipCasinoSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(MESSAGES.VIP.CASINO_SELECTION_TITLE)
      .setDescription(MESSAGES.VIP.CASINO_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static vipTypeSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(MESSAGES.VIP.TYPE_SELECTION_TITLE)
      .setDescription(MESSAGES.VIP.TYPE_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static vipChecklist(step, total, description, type) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.VIP} ${MESSAGES.VIP.CHECKLIST_TITLE
        .replace('{type}', type.toUpperCase())
        .replace('{current}', step)
        .replace('{total}', total)}`)
      .setDescription(`**${description}**`)
      .setTimestamp()
      .setFooter({ text: MESSAGES.VIP.CHECKLIST_FOOTER
        .replace('{current}', step)
        .replace('{total}', total) });
    
    return embed;
  }

  static questionDescription() {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(MESSAGES.QUESTIONS.DESCRIPTION_TITLE)
      .setDescription(MESSAGES.QUESTIONS.DESCRIPTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static otherHelp() {
    return new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle(MESSAGES.OTHER.HELP_TITLE)
      .setDescription(MESSAGES.OTHER.HELP_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static checklist(step, total, description, image = null) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`${EMOJIS.LOADING} ${MESSAGES.CHECKLIST.STEP_TITLE
        .replace('{current}', step)
        .replace('{total}', total)}`)
      .setDescription(`**${description}**`)
      .setTimestamp()
      .setFooter({ text: MESSAGES.CHECKLIST.PROGRESS_FOOTER
        .replace('{current}', step)
        .replace('{total}', total) });
    
    if (image) {
      // Validar URL básica (apenas verificar se é uma string válida e tem protocolo)
      const validatedUrl = validateImageUrl(image);
      if (validatedUrl) {
        // Passar a URL diretamente para o Discord (aceita webp, png, jpg, gif, etc.)
        embed.setImage(validatedUrl);
      } else {
        console.warn('[EMBED] URL de imagem inválida ou não validada:', image);
      }
    }
    return embed;
  }

  static ticketClose() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(MESSAGES.TICKETS.CLOSE_TITLE)
      .setDescription(MESSAGES.TICKETS.CLOSE_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static transcriptCreated(transcriptId, channelName, ticketNumber, ownerTag, category) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} ${MESSAGES.TRANSCRIPTS.CREATED_TITLE}`)
      .setDescription(MESSAGES.TRANSCRIPTS.CREATED_DESCRIPTION
        .replace('{id}', transcriptId)
        .replace('{number}', ticketNumber)
        .replace('{channel}', channelName)
        .replace('{user}', ownerTag)
        .replace('{category}', category)
        .replace('{expires}', Math.floor((Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000)))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static transcriptView(transcript) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`📋 ${MESSAGES.TRANSCRIPTS.VIEW_TITLE.replace('{number}', transcript.ticketNumber)}`)
      .setDescription(MESSAGES.TRANSCRIPTS.VIEW_DESCRIPTION
        .replace('{channel}', transcript.channelName)
        .replace('{user}', transcript.ownerTag)
        .replace('{category}', transcript.category)
        .replace('{created}', Math.floor(transcript.createdAt.getTime() / 1000))
        .replace('{expires}', Math.floor(transcript.expiresAt.getTime() / 1000))
        .replace('{preview}', transcript.content.substring(0, 1000) + (transcript.content.length > 1000 ? '...' : '')))
      .setTimestamp()
      .setFooter({ text: `ID: ${transcript.transcriptId}` });
    
    return embed;
  }

  static userTranscriptsList(user, transcripts, page, totalPages, total) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`📋 ${MESSAGES.TRANSCRIPTS.USER_LIST_TITLE.replace('{user}', user.tag)}`)
      .setDescription(MESSAGES.TRANSCRIPTS.USER_LIST_DESCRIPTION
        .replace('{total}', total)
        .replace('{page}', page)
        .replace('{totalPages}', totalPages))
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: `Página ${page}/${totalPages} • Total: ${total} transcripts` });

    transcripts.forEach((transcript, index) => {
      const number = (page - 1) * 10 + index + 1;
      const isExpired = transcript.expiresAt < new Date();
      const status = isExpired ? '🔴 Expirado' : '🟢 Ativo';
      
      embed.addFields({
        name: `${number}. Ticket #${transcript.ticketNumber} (${transcript.category})`,
        value: [
          `**ID:** \`${transcript.transcriptId}\``,
          `**Canal:** #${transcript.channelName}`,
          `**Criado:** <t:${Math.floor(transcript.createdAt.getTime() / 1000)}:R>`,
          `**Expira:** <t:${Math.floor(transcript.expiresAt.getTime() / 1000)}:R>`,
          `**Status:** ${status}`
        ].join('\n'),
        inline: false
      });
    });

    return embed;
  }

  static allTranscriptsList(transcripts, page, totalPages, total, category = null) {
    const title = category 
      ? `📋 ${MESSAGES.TRANSCRIPTS.CATEGORY_LIST_TITLE.replace('{category}', category)}`
      : `📋 ${MESSAGES.TRANSCRIPTS.ALL_LIST_TITLE}`;
      
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(title)
      .setDescription(MESSAGES.TRANSCRIPTS.ALL_LIST_DESCRIPTION
        .replace('{total}', total)
        .replace('{page}', page)
        .replace('{totalPages}', totalPages)
        .replace('{category}', category || 'todas as categorias'))
      .setTimestamp()
      .setFooter({ text: `Página ${page}/${totalPages} • Total: ${total} transcripts` });

    transcripts.forEach((transcript, index) => {
      const number = (page - 1) * 20 + index + 1;
      const isExpired = transcript.expiresAt < new Date();
      const status = isExpired ? '🔴 Expirado' : '🟢 Ativo';
      
      embed.addFields({
        name: `${number}. #${transcript.ticketNumber} - ${transcript.ownerTag} (${transcript.category})`,
        value: [
          `**ID:** \`${transcript.transcriptId}\``,
          `**Canal:** #${transcript.channelName}`,
          `**Criado:** <t:${Math.floor(transcript.createdAt.getTime() / 1000)}:R>`,
          `**Status:** ${status}`
        ].join('\n'),
        inline: true
      });
    });

    return embed;
  }

  // === SUBMISSION EMBEDS ===
  static submissionReady(ticketNumber, userTag, channelId) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.GIFT} ${MESSAGES.APPROVALS.READY_TITLE}`)
      .setDescription(MESSAGES.APPROVALS.READY_DESCRIPTION
        .replace(/{number}/g, ticketNumber)
        .replace('{user}', userTag))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  // === APPROVAL EMBEDS ===
  static approvalFinal(casino, prize, userTag, ticketNumber, ltcAddress, bcGameId = null, isVerified = false, bcGameProfileImage = null) {
    let description;
    
    console.log('[EMBED][DEBUG] approvalFinal chamado com:', {
      casino,
      bcGameId,
      isVerified,
      bcGameProfileImage
    });

    // NOVO: Para BCGame verificado, mostrar status especial
    if (casino === 'BCGame' && isVerified) {
      console.log('[EMBED][DEBUG] Usando FINAL_DESCRIPTION_VERIFIED');
      description = MESSAGES.APPROVALS.FINAL_DESCRIPTION_VERIFIED
        .replace('{casino}', casino || 'N/A')
        .replace('{prize}', prize || 'N/A')
        .replace('{user}', userTag)
        .replace('{number}', ticketNumber)
        .replace('{ltc}', ltcAddress || 'N/A');
    } else if (casino === 'BCGame' && bcGameId && !isVerified) {
      console.log('[EMBED][DEBUG] Usando FINAL_DESCRIPTION_WITH_ID com bcGameId:', bcGameId);
      description = MESSAGES.APPROVALS.FINAL_DESCRIPTION_WITH_ID
        .replace('{casino}', casino || 'N/A')
        .replace('{prize}', prize || 'N/A')
        .replace('{user}', userTag)
        .replace('{number}', ticketNumber)
        .replace('{id}', bcGameId)
        .replace('{ltc}', ltcAddress || 'N/A');
    } else {
      console.log('[EMBED][DEBUG] Usando FINAL_DESCRIPTION_NORMAL');
      description = MESSAGES.APPROVALS.FINAL_DESCRIPTION_NORMAL
        .replace('{casino}', casino || 'N/A')
        .replace('{prize}', prize || 'N/A')
        .replace('{user}', userTag)
        .replace('{number}', ticketNumber)
        .replace('{ltc}', ltcAddress || 'N/A');
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.GIFT} ${MESSAGES.APPROVALS.FINAL_TITLE}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
    
    // NOVO: Adicionar imagem do perfil BCGame se disponível, exceto se for afiliado
    if (casino === 'BCGame' && bcGameProfileImage && !isVerified) {
      const validatedUrl = validateImageUrl(bcGameProfileImage);
      if (validatedUrl) {
        embed.setImage(validatedUrl);
      }
    }
    
    return embed;
  }

  static giveawayPaid() {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} ${MESSAGES.APPROVALS.PAID_TITLE}`)
      .setDescription(MESSAGES.APPROVALS.PAID_DESCRIPTION)
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static rejectionReason(reason) {
    return new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle(`${EMOJIS.ERROR} ${MESSAGES.APPROVALS.REJECTION_TITLE}`)
      .setDescription(MESSAGES.APPROVALS.REJECTION_DESCRIPTION.replace('{reason}', reason))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static duplicateCodeAlert(code, originalTicket, originalUser, originalCasino, originalDate, currentTicket, currentUser, currentChannel) {
    return new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle(`${EMOJIS.ERROR} CÓDIGO TELEGRAM DUPLICADO DETECTADO`)
      .setDescription([
        `🔴 **Código:** \`${code}\``,
        '',
        '📋 **Uso Original:**',
        `• Ticket: #${originalTicket || 'Não encontrado'}`,
        `• Usuário: ${originalUser || 'Não encontrado'}`,
        `• Casino: ${originalCasino || 'Não definido'}`,
        `• Data: ${originalDate || 'Não disponível'}`,
        '',
        '🆕 **Tentativa Atual:**',
        `• Ticket: #${currentTicket || 'Não encontrado'}`,
        `• Usuário: ${currentUser || 'Não encontrado'}`,
        `• Canal: <#${currentChannel || 'Não encontrado'}>`,
        '',
        '⚠️ **AMBOS os tickets foram pausados para revisão manual**'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  static reviewRequest(reason, ticketNumber, userTag) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} ${MESSAGES.APPROVALS.REVIEW_TITLE}`)
      .setDescription(MESSAGES.APPROVALS.REVIEW_DESCRIPTION
        .replace('{number}', ticketNumber)
        .replace('{user}', userTag)
        .replace('{reason}', reason))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }

  // NOVO: Support request with completion button
  static supportRequest(reason, ticketNumber, userTag, channelId) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.SHIELD} ${MESSAGES.SUPPORT.REQUEST_TITLE}`)
      .setDescription(MESSAGES.SUPPORT.REQUEST_DESCRIPTION
        .replace('{number}', ticketNumber)
        .replace('{user}', userTag)
        .replace('{channel}', channelId)
        .replace('{reason}', reason || 'Suporte geral'))
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });
  }
  // === STATISTICS EMBED ===
  static ticketStatistics(stats) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.CHART} ${MESSAGES.STATISTICS.TITLE}`)
      .setDescription(MESSAGES.STATISTICS.DESCRIPTION
        .replace('{last1Day}', stats.ticketsPeriod.last1Day)
        .replace('{last2Days}', stats.ticketsPeriod.last2Days)
        .replace('{last7Days}', stats.ticketsPeriod.last7Days)
        .replace('{last30Days}', stats.ticketsPeriod.last30Days)
        .replace('{activeTickets}', stats.activeTickets)
        .replace('{submissionsPending}', stats.submissions.pending)
        .replace('{submissionsApproved}', stats.submissions.approved)
        .replace('{submissionsRejected}', stats.submissions.rejected)
        .replace('{submissionsTotal}', stats.submissions.total)
        .replace('{approvalsPending}', stats.approvals.pending)
        .replace('{approvalsPaid}', stats.approvals.paid)
        .replace('{approvalsReview}', stats.approvals.review)
        .replace('{approvalsTotal}', stats.approvals.total)
        .replace('{transcriptsCreated}', stats.transcriptsCreated))
      .addFields(
        {
          name: `${EMOJIS.STAR} ${MESSAGES.STATISTICS.CATEGORIES_FIELD}`,
          value: stats.ticketsByCategory.length > 0 
            ? stats.ticketsByCategory.map(cat => `**${cat._id}:** ${cat.count}`).join('\n')
            : MESSAGES.STATISTICS.NO_DATA,
          inline: true
        },
        {
          name: `${EMOJIS.DIAMOND} ${MESSAGES.STATISTICS.COUNTERS_FIELD}`,
          value: stats.categoryCounters.length > 0
            ? stats.categoryCounters.map(cat => `**${cat.category}:** ${cat.count}`).join('\n')
            : MESSAGES.STATISTICS.NO_DATA,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ 
        text: 'MENDIGOTV.COM | 18+ GAMBLEAWARE',
        iconURL: 'https://i.imgur.com/Zkymy68.png'
      });

    return embed;
  }
}

module.exports = EmbedFactory;