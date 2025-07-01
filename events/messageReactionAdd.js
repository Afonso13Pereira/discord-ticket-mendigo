// events/messageReactionAdd.js
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const { EMOJIS } = require('../config/constants');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user, client) {
    // Ignore bot reactions
    if (user.bot) return;

    // Fetch partial reactions
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching reaction:', error);
        return;
      }
    }

    // Check if this is an approval reaction
    const approval = await client.db.getApproval(reaction.message.id);
    if (!approval) return;

    // Handle approval reactions
    if (reaction.emoji.name === '👍' && !approval.approved) {
      try {
        // Update approval status
        await client.db.updateApproval(reaction.message.id, true);

        // Get the ticket channel
        const ticketChannel = await client.channels.fetch(approval.ticketChannelId);
        if (ticketChannel) {
          // Send approval message to ticket
          await ticketChannel.send({
            embeds: [EmbedFactory.giveawayApproved()]
          });
        }

        // Update the approval message
        const updatedEmbed = EmbedFactory.approvalApproved(approval.ticketNumber, approval.userTag);
        const linkButton = ComponentFactory.createButtonRow(
          ComponentFactory.createButton(
            'goto_ticket',
            `Ir para Ticket #${approval.ticketNumber}`,
            'Link',
            '🎫'
          ).setURL(`https://discord.com/channels/${reaction.message.guild.id}/${approval.ticketChannelId}`)
        );

        await reaction.message.edit({
          embeds: [updatedEmbed],
          components: [linkButton]
        });

        // Log approval
        await client.db.logAction(approval.ticketChannelId, user.id, 'giveaway_approved', `Ticket #${approval.ticketNumber}`);

      } catch (error) {
        console.error('Error processing approval:', error);
      }
    }

    if (reaction.emoji.name === '❌' && !approval.approved) {
      try {
        // Update approval status to rejected
        await client.db.updateApproval(reaction.message.id, false);

        // Get the ticket channel
        const ticketChannel = await client.channels.fetch(approval.ticketChannelId);
        if (ticketChannel) {
          // Send rejection message to ticket
          await ticketChannel.send({
            embeds: [EmbedFactory.error('O seu giveaway foi rejeitado. Entre em contacto com o suporte para mais informações.')]
          });
        }

        // Update the approval message
        const rejectedEmbed = EmbedFactory.error(
          `**Ticket #${approval.ticketNumber} foi rejeitado**\n\n` +
          `👤 **Usuário:** ${approval.userTag}\n` +
          `❌ **Status:** Rejeitado\n` +
          `👤 **Rejeitado por:** ${user.tag}`,
          `${EMOJIS.ERROR} Giveaway Rejeitado`
        );

        await reaction.message.edit({
          embeds: [rejectedEmbed],
          components: []
        });

        // Log rejection
        await client.db.logAction(approval.ticketChannelId, user.id, 'giveaway_rejected', `Ticket #${approval.ticketNumber}`);

      } catch (error) {
        console.error('Error processing rejection:', error);
      }
    }
  }
};