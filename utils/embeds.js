// utils/embeds.js
const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, ICONS } = require('../config/constants');
const MESSAGES = require('../config/messages');

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
      .setTitle(`${EMOJIS.ROBOT} ${MESSAGES.TICKETS.WELCOME_TITLE}`)
      .setDescription(MESSAGES.TICKETS.WELCOME_DESCRIPTION)
      .setImage('https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif')
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.AUTOMATED_SUPPORT });
  }

  static confirmation() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} ${MESSAGES.CONFIRMATION.TITLE}`)
      .setDescription(MESSAGES.CONFIRMATION.DESCRIPTION)
      .setThumbnail('https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif')
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.MANDATORY_18 });
  }

  // === WEBSITE EMBEDS ===
  static websiteTypeSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`🌐 ${MESSAGES.WEBSITE.TYPE_SELECTION_TITLE}`)
      .setDescription(MESSAGES.WEBSITE.TYPE_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.WEBSITE_SUPPORT });
  }

  static websiteBugReport() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`🐛 ${MESSAGES.WEBSITE.BUG_REPORT_TITLE}`)
      .setDescription(MESSAGES.WEBSITE.BUG_REPORT_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.WEBSITE.BUG_REPORT_TITLE });
  }

  static websiteRedeemNick() {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`🎁 ${MESSAGES.WEBSITE.REDEEM_NICK_TITLE}`)
      .setDescription(MESSAGES.WEBSITE.REDEEM_NICK_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.REDEEM_SYSTEM });
  }

  static websiteNoRedeems(twitchNick) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} ${MESSAGES.WEBSITE.REDEEM_NO_REDEEMS_TITLE}`)
      .setDescription(MESSAGES.WEBSITE.REDEEM_NO_REDEEMS_DESCRIPTION.replace('{nick}', twitchNick))
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.REDEEM_SYSTEM });
  }

  static websiteRedeemList(twitchNick, redeems) {
    const redeemList = redeems.map((redeem, index) => 
      `${index + 1}. **${redeem.itemName}** (${new Date(redeem.createdAt).toLocaleDateString('pt-PT')})`
    ).join('\n');

    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`🎁 ${MESSAGES.WEBSITE.REDEEM_LIST_TITLE.replace('{nick}', twitchNick)}`)
      .setDescription(MESSAGES.WEBSITE.REDEEM_LIST_DESCRIPTION
        .replace('{count}', redeems.length)
        .replace('{list}', redeemList))
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.REDEEM_SYSTEM });
  }

  static websiteRedeemSelected(redeem) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`✅ ${MESSAGES.WEBSITE.REDEEM_SELECTED_TITLE}`)
      .setDescription(MESSAGES.WEBSITE.REDEEM_SELECTED_DESCRIPTION
        .replace('{item}', redeem.itemName)
        .replace('{nick}', redeem.twitchName)
        .replace('{date}', new Date(redeem.createdAt).toLocaleDateString('pt-PT')))
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.REDEEM_PROCESSING });
  }

  static vipCasinoSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.VIP} ${MESSAGES.VIP.CASINO_SELECTION_TITLE}`)
      .setDescription(MESSAGES.VIP.CASINO_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.VIP_SYSTEM });
  }

  static vipTypeSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(`${EMOJIS.VIP} ${MESSAGES.VIP.TYPE_SELECTION_TITLE}`)
      .setDescription(MESSAGES.VIP.TYPE_SELECTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.VIP_SYSTEM });
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
      .setTitle(`${EMOJIS.QUESTION} ${MESSAGES.QUESTIONS.DESCRIPTION_TITLE}`)
      .setDescription(MESSAGES.QUESTIONS.DESCRIPTION_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.QUESTIONS_SYSTEM });
  }

  static otherHelp() {
    return new EmbedBuilder()
      .setColor(COLORS.SECONDARY)
      .setTitle(`${EMOJIS.INFO} ${MESSAGES.OTHER.HELP_TITLE}`)
      .setDescription(MESSAGES.OTHER.HELP_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.AUTOMATED_SUPPORT });
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
    
    if (image) embed.setImage(image);
    return embed;
  }

  static ticketClose() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} ${MESSAGES.TICKETS.CLOSE_TITLE}`)
      .setDescription(MESSAGES.TICKETS.CLOSE_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.GENERAL.PLEASE_WAIT });
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
      .setFooter({ text: MESSAGES.FOOTERS.TRANSCRIPT_EXPIRES });
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
      .setFooter({ text: MESSAGES.FOOTERS.SUBMISSIONS_SYSTEM });
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
      .setFooter({ text: MESSAGES.FOOTERS.APPROVALS_SYSTEM });
    
    // NOVO: Adicionar imagem do perfil BCGame se disponível, exceto se for afiliado
    if (casino === 'BCGame' && bcGameProfileImage && !isVerified) {
      embed.setImage(bcGameProfileImage);
    }
    
    return embed;
  }

  static giveawayPaid() {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} ${MESSAGES.APPROVALS.PAID_TITLE}`)
      .setDescription(MESSAGES.APPROVALS.PAID_DESCRIPTION)
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.CONGRATULATIONS });
  }

  static rejectionReason(reason) {
    return new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle(`${EMOJIS.ERROR} ${MESSAGES.APPROVALS.REJECTION_TITLE}`)
      .setDescription(MESSAGES.APPROVALS.REJECTION_DESCRIPTION.replace('{reason}', reason))
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.APPROVALS_SYSTEM });
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
      .setFooter({ text: MESSAGES.FOOTERS.REVIEWS_SYSTEM });
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
      .setFooter({ text: MESSAGES.FOOTERS.SUPPORT_SYSTEM });
  }

  static duplicateCodeAlert(originalTicket, currentTicket, code) {
    return new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle(`🚨 ${MESSAGES.DUPLICATE_CODES.ALERT_TITLE}`)
      .setDescription(MESSAGES.DUPLICATE_CODES.ALERT_DESCRIPTION
        .replace('{code}', code)
        .replace('{originalTicket}', originalTicket.ticketNumber)
        .replace('{originalUser}', originalTicket.userTag)
        .replace('{originalCasino}', originalTicket.casino || 'N/A')
        .replace('{originalDate}', new Date(originalTicket.usedAt).toLocaleString('pt-PT'))
        .replace('{currentTicket}', currentTicket.ticketNumber)
        .replace('{currentUser}', currentTicket.userTag)
        .replace('{currentChannel}', `<#${currentTicket.channelId}>`))
      .setTimestamp()
      .setFooter({ text: MESSAGES.FOOTERS.ANTI_FRAUD });
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
      .setFooter({ text: MESSAGES.FOOTERS.STATS_AUTO_UPDATE });

    return embed;
  }
}

module.exports = EmbedFactory;