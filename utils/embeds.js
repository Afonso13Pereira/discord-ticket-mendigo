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

  // NOVO: Confirmação para usuários verificados
  static verifiedUserConfirmation(casino, verifications) {
    const verificationList = verifications.map(v => 
      `${EMOJIS.VERIFIED} **${v.casino}** - Verificado em ${new Date(v.verifiedAt).toLocaleDateString('pt-PT')}`
    ).join('\n');

    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.VERIFIED} Utilizador Verificado`)
      .setDescription([
        `**Detectámos que já é um utilizador verificado!**`,
        '',
        `🎯 **Casino selecionado:** ${casino}`,
        `${EMOJIS.STAR} **Status:** Verificado`,
        '',
        `**As suas verificações:**`,
        verificationList,
        '',
        `${EMOJIS.INFO} **Como utilizador verificado, apenas precisa de:**`,
        `• Confirmar que tem +18 anos`,
        `• Fornecer o endereço LTC para pagamento`,
        '',
        '**Digite exatamente:** `Sim, eu confirmo`'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Utilizador Verificado • Processo Simplificado' });
  }

  static verifiedUserLtcRequest() {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.VERIFIED} Endereço LTC`)
      .setDescription([
        '**Como utilizador verificado, apenas precisa de fornecer:**',
        '',
        `💰 **Endereço LTC** para receber o pagamento`,
        '',
        `${EMOJIS.INFO} Digite o seu endereço LTC abaixo`,
        `${EMOJIS.SHIELD} Verifique cuidadosamente o endereço antes de enviar`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Processo Simplificado para Verificados' });
  }

  // === WEBSITE EMBEDS ===
  static websiteTypeSelection() {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`🌐 Suporte do Website`)
      .setDescription([
        '**Como podemos ajudá-lo com o website?**',
        '',
        `🐛 **Reportar Bug** - Relatar um problema no site`,
        `🎁 **Resgatar Redeem** - Reclamar itens que resgatou`,
        '',
        `${EMOJIS.INFO} Escolha uma opção abaixo`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Suporte do Website' });
  }

  static websiteBugReport() {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`🐛 Reportar Bug`)
      .setDescription([
        '**Descreva o bug que encontrou:**',
        '',
        `${EMOJIS.INFO} Seja específico sobre o problema`,
        `${EMOJIS.STAR} Inclua passos para reproduzir o bug`,
        `${EMOJIS.SHIELD} Adicione capturas de ecrã se possível`,
        '',
        '**Digite a descrição do bug abaixo:**'
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Reportar Bug' });
  }

  static websiteRedeemNick() {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`🎁 Resgatar Redeem`)
      .setDescription([
        '**Para verificar os seus redeems disponíveis:**',
        '',
        `📱 **Digite o seu nickname da Twitch**`,
        `📸 **Envie uma captura de ecrã** que comprove a sua identidade`,
        '',
        `${EMOJIS.INFO} Iremos verificar os redeems disponíveis para o seu nickname`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Redeems' });
  }

  static websiteNoRedeems(twitchNick) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING} Nenhum Redeem Disponível`)
      .setDescription([
        `**Não foram encontrados redeems para: ${twitchNick}**`,
        '',
        `${EMOJIS.INFO} Possíveis motivos:`,
        `• Nickname incorreto`,
        `• Todos os redeems já foram resgatados`,
        `• Nenhum redeem foi feito com este nickname`,
        '',
        `${EMOJIS.SHIELD} Entre em contacto com o suporte se acha que isto é um erro`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Redeems' });
  }

  static websiteRedeemList(twitchNick, redeems) {
    const redeemList = redeems.map((redeem, index) => 
      `${index + 1}. **${redeem.itemName}** (${new Date(redeem.createdAt).toLocaleDateString('pt-PT')})`
    ).join('\n');

    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`🎁 Redeems Disponíveis para ${twitchNick}`)
      .setDescription([
        `**Encontrados ${redeems.length} redeem(s) disponível(is):**`,
        '',
        redeemList,
        '',
        `${EMOJIS.INFO} Escolha o número do item que deseja resgatar`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Sistema de Redeems' });
  }

  static websiteRedeemSelected(redeem) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`✅ Redeem Selecionado`)
      .setDescription([
        `**Item:** ${redeem.itemName}`,
        `**Nickname:** ${redeem.twitchName}`,
        `**Data do Redeem:** ${new Date(redeem.createdAt).toLocaleDateString('pt-PT')}`,
        '',
        `${EMOJIS.SHIELD} **A nossa equipa irá processar o seu pedido**`,
        `${EMOJIS.CLOCK} Aguarde enquanto verificamos os detalhes`,
        `${EMOJIS.DIAMOND} Será contactado em breve`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'Redeem em Processamento' });
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

  // === STATISTICS EMBED ===
  static ticketStatistics(stats) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${EMOJIS.CHART} Estatísticas dos Tickets`)
      .setDescription([
        `${EMOJIS.CALENDAR} **Tickets Criados por Período:**`,
        `${EMOJIS.CLOCK} **Último dia:** ${stats.ticketsPeriod.last1Day}`,
        `${EMOJIS.CLOCK} **Últimos 2 dias:** ${stats.ticketsPeriod.last2Days}`,
        `${EMOJIS.CLOCK} **Últimos 7 dias:** ${stats.ticketsPeriod.last7Days}`,
        `${EMOJIS.CLOCK} **Últimos 30 dias:** ${stats.ticketsPeriod.last30Days}`,
        '',
        `${EMOJIS.TICKET} **Tickets Ativos:** ${stats.activeTickets}`,
        '',
        `${EMOJIS.LOADING} **Submissões:**`,
        `⏳ **Pendentes:** ${stats.submissions.pending}`,
        `✅ **Aprovadas:** ${stats.submissions.approved}`,
        `❌ **Rejeitadas:** ${stats.submissions.rejected}`,
        `📊 **Total:** ${stats.submissions.total}`,
        '',
        `${EMOJIS.MONEY} **Aprovações:**`,
        `⏳ **Pendentes:** ${stats.approvals.pending}`,
        `💰 **Pagas:** ${stats.approvals.paid}`,
        `🔍 **Em Revisão:** ${stats.approvals.review}`,
        `📊 **Total:** ${stats.approvals.total}`,
        '',
        `📋 **Transcripts Criados (30 dias):** ${stats.transcriptsCreated}`,
        `${EMOJIS.VERIFIED} **Utilizadores Verificados:** ${stats.verifications?.total || 0}`
      ].join('\n'))
      .addFields(
        {
          name: `${EMOJIS.STAR} Tickets por Categoria (30 dias)`,
          value: stats.ticketsByCategory.length > 0 
            ? stats.ticketsByCategory.map(cat => `**${cat._id}:** ${cat.count}`).join('\n')
            : 'Nenhum ticket encontrado',
          inline: true
        },
        {
          name: `${EMOJIS.DIAMOND} Contadores por Categoria`,
          value: stats.categoryCounters.length > 0
            ? stats.categoryCounters.map(cat => `**${cat.category}:** ${cat.count}`).join('\n')
            : 'Nenhum contador encontrado',
          inline: true
        }
      );

    // Add verification statistics if available
    if (stats.verifications && stats.verifications.byCasino.length > 0) {
      embed.addFields({
        name: `${EMOJIS.VERIFIED} Verificações por Casino`,
        value: stats.verifications.byCasino.map(v => `**${v.casino}:** ${v.count}`).join('\n'),
        inline: true
      });
    }

    embed.setTimestamp()
      .setFooter({ text: 'Estatísticas atualizadas automaticamente' });

    return embed;
  }
}

module.exports = EmbedFactory;