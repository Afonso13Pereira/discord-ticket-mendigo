const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifications')
    .setDescription('Gerir verificações de casino')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => 
      sub.setName('list')
        .setDescription('Listar todas as verificações')
    )
    .addSubcommand(sub =>
      sub.setName('user')
        .setDescription('Ver verificações de um utilizador')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Utilizador para verificar')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remover verificação de um utilizador')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Utilizador')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('casino')
            .setDescription('Casino')
            .setRequired(true)
            .addChoices(
              { name: 'BC.Game', value: 'BCGame' },
              { name: 'RioAce', value: 'RioAce' },
              { name: 'Stake', value: 'Stake' }
            )
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      try {
        const verifications = await client.db.getAllVerifications();
        
        if (verifications.length === 0) {
          return interaction.reply({
            embeds: [EmbedFactory.info('Nenhuma verificação encontrada', 'Lista de Verificações')],
            flags: 64
          });
        }

        // Group by casino
        const byCasino = {};
        verifications.forEach(v => {
          if (!byCasino[v.casino]) byCasino[v.casino] = [];
          byCasino[v.casino].push(v);
        });

        const description = Object.entries(byCasino).map(([casino, users]) => {
          const userList = users.slice(0, 10).map(u => 
            `• **${u.userTag}** (Ticket #${u.ticketNumber}) - ${new Date(u.verifiedAt).toLocaleDateString('pt-PT')}`
          ).join('\n');
          
          const extra = users.length > 10 ? `\n... e mais ${users.length - 10} utilizadores` : '';
          
          return `**${EMOJIS.CASINO} ${casino} (${users.length})**\n${userList}${extra}`;
        }).join('\n\n');

        const embed = EmbedFactory.primary(description, `${EMOJIS.VERIFIED} Verificações de Casino (${verifications.length})`);
        
        return interaction.reply({ embeds: [embed], flags: 64 });
        
      } catch (error) {
        console.error('Error in verifications list:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao obter lista de verificações')],
          flags: 64
        });
      }
    }

    if (subcommand === 'user') {
      try {
        const user = interaction.options.getUser('user');
        const verifications = await client.db.getUserVerifications(user.id);
        
        if (verifications.length === 0) {
          return interaction.reply({
            embeds: [EmbedFactory.warning(`Utilizador **${user.tag}** não tem verificações`)],
            flags: 64
          });
        }

        const description = verifications.map(v => 
          `${EMOJIS.VERIFIED} **${v.casino}**\n` +
          `└ Verificado em: ${new Date(v.verifiedAt).toLocaleDateString('pt-PT')}\n` +
          `└ Ticket: #${v.ticketNumber}\n` +
          `└ Cargo: ${v.roleId ? `<@&${v.roleId}>` : 'N/A'}`
        ).join('\n\n');

        const embed = EmbedFactory.success(description, `${EMOJIS.VERIFIED} Verificações de ${user.tag}`);
        
        return interaction.reply({ embeds: [embed], flags: 64 });
        
      } catch (error) {
        console.error('Error in verifications user:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao obter verificações do utilizador')],
          flags: 64
        });
      }
    }

    if (subcommand === 'remove') {
      try {
        const user = interaction.options.getUser('user');
        const casino = interaction.options.getString('casino');
        
        // Check if user is verified for this casino
        const isVerified = await client.db.isUserVerifiedForCasino(user.id, casino);
        
        if (!isVerified) {
          return interaction.reply({
            embeds: [EmbedFactory.warning(`Utilizador **${user.tag}** não está verificado para **${casino}**`)],
            flags: 64
          });
        }

        // Remove verification
        const success = await client.db.removeUserVerification(user.id, casino);
        
        if (success) {
          // Try to remove role from user
          try {
            const member = await interaction.guild.members.fetch(user.id);
            const CASINOS = require('../events/casinos');
            const casinoData = CASINOS[casino];
            
            if (member && casinoData?.cargoafiliado) {
              await member.roles.remove(casinoData.cargoafiliado);
            }
          } catch (roleError) {
            console.error('Error removing role:', roleError);
          }
          
          return interaction.reply({
            embeds: [EmbedFactory.success(`Verificação de **${user.tag}** para **${casino}** foi removida`)],
            flags: 64
          });
        } else {
          return interaction.reply({
            embeds: [EmbedFactory.error('Erro ao remover verificação')],
            flags: 64
          });
        }
        
      } catch (error) {
        console.error('Error in verifications remove:', error);
        return interaction.reply({
          embeds: [EmbedFactory.error('Erro ao remover verificação')],
          flags: 64
        });
      }
    }
  }
};