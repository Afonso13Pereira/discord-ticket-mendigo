// utils/components.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { EMOJIS } = require('../config/constants');
const VIPS = require('../events/vips');
const CASINOS = require('../events/casinos');
const MESSAGES = require('../config/messages');

class ComponentFactory {
  static styleMap = {
    blue: ButtonStyle.Primary,
    grey: ButtonStyle.Secondary,
    green: ButtonStyle.Success,
    red: ButtonStyle.Danger
  };

  static createButton(customId, label, style = ButtonStyle.Primary, emoji = null, disabled = false) {
    const button = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style)
      .setDisabled(disabled);
    
    if (emoji) button.setEmoji(emoji);
    return button;
  }

  static createLinkButton(url, label, emoji = null) {
    const button = new ButtonBuilder()
      .setURL(url)
      .setLabel(label)
      .setStyle(ButtonStyle.Link);
    
    if (emoji) button.setEmoji(emoji);
    return button;
  }

  static createButtonRow(...buttons) {
    return new ActionRowBuilder().addComponents(...buttons);
  }

  static nextStepButton() {
    return this.createButton('proof_next', MESSAGES.BUTTONS.NEXT_STEP, ButtonStyle.Primary, EMOJIS.STAR);
  }

  static finishButton() {
    return this.createButton('finish_ticket', MESSAGES.BUTTONS.FINISH, ButtonStyle.Success, EMOJIS.SUCCESS);
  }

  static supportButton() {
    return this.createButton('support_ticket', MESSAGES.BUTTONS.SUPPORT, ButtonStyle.Danger, EMOJIS.SHIELD);
  }

  static closeTicketButton() {
    return this.createButton('close_ticket_menu', MESSAGES.BUTTONS.CLOSE_TICKET, ButtonStyle.Secondary, '🔒');
  }

  // === WEBSITE BUTTONS ===
  static websiteTypeButtons() {
    return this.createButtonRow(
      this.createButton('website_bug', MESSAGES.BUTTONS.REPORT_BUG, ButtonStyle.Danger, '🐛'),
      this.createButton('website_redeem', MESSAGES.BUTTONS.REDEEM_ITEM, ButtonStyle.Success, '🎁'),
      this.supportButton(),
      this.closeTicketButton()
    );
  }

  static redeemSelectButtons(redeems) {
    const buttons = [];
    const maxButtons = Math.min(redeems.length, 3); // Máximo 3 botões para deixar espaço para suporte e fechar
    
    for (let i = 0; i < maxButtons; i++) {
      buttons.push(
        this.createButton(
          `select_redeem_${redeems[i].id}`,
          `${i + 1}. ${redeems[i].itemName.substring(0, 15)}${redeems[i].itemName.length > 15 ? '...' : ''}`,
          ButtonStyle.Primary,
          '🎁'
        )
      );
    }
    
    // Add support and close buttons
    buttons.push(this.supportButton());
    buttons.push(this.closeTicketButton());
    
    return this.createButtonRow(...buttons);
  }

  static markRedeemCompleteButton(redeemId) {
    return this.createButtonRow(
      this.createButton(`mark_redeem_complete_${redeemId}`, MESSAGES.BUTTONS.MARK_COMPLETE, ButtonStyle.Success, '✅'),
      this.createButton('close_with_transcript', MESSAGES.BUTTONS.CLOSE_WITH_TRANSCRIPT, ButtonStyle.Secondary, '📋'),
      this.createButton('close_delete_ticket', MESSAGES.BUTTONS.DELETE_TICKET, ButtonStyle.Danger, '🗑️')
    );
  }

  // === STEP BUTTONS WITH SUPPORT AND CLOSE ===
  static stepButtons() {
    return this.createButtonRow(
      this.nextStepButton(),
      this.supportButton(),
      this.closeTicketButton()
    );
  }

  static infoStepButtons() {
    return this.createButtonRow(
      this.nextStepButton(),
      this.supportButton(),
      this.closeTicketButton()
    );
  }

  static finishButtons() {
    return this.createButtonRow(
      this.finishButton(),
      this.supportButton(),
      this.closeTicketButton()
    );
  }

  static resubmitButtons() {
    return this.createButtonRow(
      this.createButton('rejection_resubmit', MESSAGES.BUTTONS.RESUBMIT, ButtonStyle.Primary, '🔄'),
      this.supportButton(),
      this.closeTicketButton()
    );
  }

  static closeTicketButtons() {
    return this.createButtonRow(
      this.createButton('confirm_close_ticket', 'Sim, Fechar Ticket', ButtonStyle.Danger, '✅'),
      this.createButton('cancel_close_ticket', 'Cancelar', ButtonStyle.Secondary, '❌')
    );
  }

  static transcriptButtons(transcriptId) {
    return this.createButtonRow(
      this.createButton(`view_transcript_${transcriptId}`, MESSAGES.BUTTONS.VIEW_TRANSCRIPT, ButtonStyle.Primary, '📋'),
      this.createButton(`download_transcript_${transcriptId}`, MESSAGES.BUTTONS.DOWNLOAD, ButtonStyle.Secondary, '💾')
    );
  }

  static transcriptPaginationButtons(userId, currentPage, totalPages) {
    const buttons = [];
    
    // Previous page button
    if (currentPage > 1) {
      buttons.push(
        this.createButton(
          `transcript_user_${userId}_page_${currentPage - 1}`,
          'Página Anterior',
          ButtonStyle.Secondary,
          '⬅️'
        )
      );
    }
    
    // Page info (disabled button)
    buttons.push(
      this.createButton(
        'page_info',
        `${currentPage}/${totalPages}`,
        ButtonStyle.Secondary,
        '📄',
        true // disabled
      )
    );
    
    // Next page button
    if (currentPage < totalPages) {
      buttons.push(
        this.createButton(
          `transcript_user_${userId}_page_${currentPage + 1}`,
          'Próxima Página',
          ButtonStyle.Secondary,
          '➡️'
        )
      );
    }
    
    return buttons.length > 1 ? this.createButtonRow(...buttons) : new ActionRowBuilder();
  }

  static allTranscriptsPaginationButtons(currentPage, totalPages, category = null) {
    const buttons = [];
    const baseId = category ? `transcript_category_${category}` : 'transcript_all';
    
    // Previous page button
    if (currentPage > 1) {
      buttons.push(
        this.createButton(
          `${baseId}_page_${currentPage - 1}`,
          'Página Anterior',
          ButtonStyle.Secondary,
          '⬅️'
        )
      );
    }
    
    // Page info (disabled button)
    buttons.push(
      this.createButton(
        'page_info',
        `${currentPage}/${totalPages}`,
        ButtonStyle.Secondary,
        '📄',
        true // disabled
      )
    );
    
    // Next page button
    if (currentPage < totalPages) {
      buttons.push(
        this.createButton(
          `${baseId}_page_${currentPage + 1}`,
          'Próxima Página',
          ButtonStyle.Secondary,
          '➡️'
        )
      );
    }
    
    return buttons.length > 1 ? this.createButtonRow(...buttons) : new ActionRowBuilder();
  }

  static giveawayTypeButtons() {
    return this.createButtonRow(
      this.createButton('gw_type_telegram', 'Telegram', ButtonStyle.Primary, '📱'),
      this.createButton('gw_type_gtb', 'GTB', ButtonStyle.Secondary, EMOJIS.STAR),
      this.createButton('gw_type_other', 'Outro', ButtonStyle.Secondary, EMOJIS.GIFT)
    );
  }

  static vipCasinoButtons(vipType = null) {
    let availableCasinos = Object.values(CASINOS);
    
    // Se um tipo de VIP foi especificado, filtrar apenas os casinos disponíveis
    if (vipType && VIPS[vipType] && VIPS[vipType].casinos) {
      availableCasinos = Object.values(CASINOS).filter(casino => 
        VIPS[vipType].casinos.includes(casino.id)
      );
    }
    
    const buttons = availableCasinos.map(casino => 
      this.createButton(`vip_casino_${casino.id}`, casino.label, ButtonStyle.Primary, casino.emoji)
    );
    
    return this.createButtonRow(...buttons);
  }

  static vipTypeButtons() {
    const buttons = Object.values(VIPS).map(vip => 
      this.createButton(`vip_type_${vip.id}`, vip.label, ButtonStyle.Primary, vip.emoji)
    );
    
    return this.createButtonRow(...buttons);
  }

  static casinoSelectMenu(casinos) {
    const options = [
      {
        label: '— Selecionar Casino —',
        value: 'none',
        emoji: '❓',
        description: 'Escolhe um casino da lista abaixo',
        default: true
      },
      ...Object.values(casinos).map(casino => ({
        label: casino.label,
        value: casino.id,
        emoji: casino.emoji || EMOJIS.CASINO,
        description: `Receber na ${casino.label}`
      }))
    ];

    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_casino')
        .setPlaceholder('🎰 Selecione o o casino onde pretendes receber o premio')
        .addOptions(options)
    );
  }

  static categoryButtons(staticCats, dynamicCats) {
    const rows = [];
    let currentRow = new ActionRowBuilder();

    // Add static categories
    for (const cat of staticCats) {
      if (currentRow.components.length === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }

      currentRow.addComponents(
        this.createButton(
          `category_${cat.id}`,
          cat.label,
          this.styleMap[cat.color] || ButtonStyle.Secondary,
          cat.emoji
        )
      );
    }

    // Add dynamic categories (verificar se estão ativos)
    const dynamicEntries = Object.entries(dynamicCats);
    
    for (const [id, cat] of dynamicEntries) {
      if (!cat.active) {
        continue;
      }

      if (currentRow.components.length === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }

      currentRow.addComponents(
        this.createButton(
          `category_${id}`,
          cat.name,
          this.styleMap[cat.color] || ButtonStyle.Secondary,
          cat.emoji
        )
      );
    }

    if (currentRow.components.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }

  static promoButtons(promos) {
    const rows = [];
    let currentRow = new ActionRowBuilder();

    for (const [pid, promo] of Object.entries(promos)) {
      if (!promo.active || Date.now() > new Date(promo.end)) {
        continue;
      }

      if (currentRow.components.length === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }

      currentRow.addComponents(
        this.createButton(
          `gw_promo_${pid}`,
          promo.name,
          this.styleMap[promo.color] || ButtonStyle.Success,
          promo.emoji || EMOJIS.FIRE
        )
      );
    }

    if (currentRow.components.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }

  // === SUBMISSION BUTTONS ===
  static submissionButtons(channelId, ticketNumber) {
    return this.createButtonRow(
      this.createLinkButton(
        `https://discord.com/channels/@me/${channelId}`,
        `${MESSAGES.BUTTONS.GOTO_TICKET} #${ticketNumber}`,
        '🎫'
      )
    );
  }

  // === MOD BUTTONS (apenas visíveis para mods) ===
  static modButtons(submissionId) {
    return this.createButtonRow(
      this.createButton(`mod_approve_${submissionId}`, MESSAGES.BUTTONS.APPROVE, ButtonStyle.Success, '✅'),
      this.createButton(`mod_reject_${submissionId}`, MESSAGES.BUTTONS.REJECT, ButtonStyle.Danger, '❌')
    );
  }

  // === APPROVAL BUTTONS ===
  static approvalButtons(approvalId, ticketChannelId) {
    return this.createButtonRow(
      this.createLinkButton(
        `https://discord.com/channels/${process.env.GUILD_ID || '@me'}/${ticketChannelId}`,
        MESSAGES.BUTTONS.GOTO_TICKET,
        '🎫'
      ),
      this.createButton(`approval_paid_${approvalId}`, MESSAGES.BUTTONS.PAID, ButtonStyle.Success, '💰'),
      this.createButton(`approval_review_${approvalId}`, 'Não Aprovar', ButtonStyle.Danger, '❌')
    );
  }

  // === SUPPORT COMPLETION BUTTON ===
  static supportCompletionButton(supportId) {
    // Extrair o channelId do supportId (formato: "type_channelId")
    const parts = supportId.split('_');
    const channelId = parts[parts.length - 1]; // Pega o último elemento
    
    return this.createButtonRow(
      this.createLinkButton(
        `https://discord.com/channels/${process.env.GUILD_ID || '@me'}/${channelId}`,
        'Ir para Ticket',
        '🎫'
      ),
      this.createButton(`support_complete_${supportId}`, MESSAGES.BUTTONS.MARK_COMPLETE, ButtonStyle.Success, '✅')
    );
  }

  // === REJECTION BUTTONS ===
  static rejectionButtons() {
    return this.resubmitButtons();
  }

  // NOVO: Botões para mensagem de "Giveaway Pago!"
  static giveawayPaidButtons() {
    return this.createButtonRow(
      this.createButton('received_close_ticket', 'Recebi, fechar ticket', ButtonStyle.Success, '✅'),
      this.createButton('not_received_support', 'Passaram 48h e ainda não recebi', ButtonStyle.Danger, '⏰')
    );
  }

  // === DUPLICATE CODE BUTTONS ===
  static duplicateCodeButtons(originalTicketId, currentTicketId, code) {
    const row1 = this.createButtonRow(
      this.createButton(`goto_original_${originalTicketId}`, 'Ir para Ticket Original', ButtonStyle.Primary, '🎫'),
      this.createButton(`goto_current_${currentTicketId}`, 'Ir para Ticket Atual', ButtonStyle.Primary, '🎫')
    );

    const row2 = this.createButtonRow(
      this.createButton(`release_original_${originalTicketId}_${code}`, 'Liberar Ticket Original', ButtonStyle.Success, '✅'),
      this.createButton(`release_current_${currentTicketId}_${code}`, 'Liberar Ticket Atual', ButtonStyle.Success, '✅'),
      this.createButton(`release_both_${originalTicketId}_${currentTicketId}_${code}`, 'Liberar Ambos', ButtonStyle.Success, '✅')
    );

    const row3 = this.createButtonRow(
      this.createButton(`mark_resolved_${originalTicketId}_${currentTicketId}_${code}`, 'Marcar como Resolvido', ButtonStyle.Danger, '🔒')
    );

    return [row1, row2, row3];
  }
}

module.exports = ComponentFactory;