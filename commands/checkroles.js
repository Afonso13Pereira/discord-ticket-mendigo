const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const casinos = require('../events/casinos');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkroles')
    .setDescription('Verificar configuração dos cargos de afiliado')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    try {
      const guild = interaction.guild;
      const roleChecks = [];

      // Verificar cargos de afiliado dos casinos
      for (const [casinoId, casino] of Object.entries(casinos)) {
        if (casino.cargoafiliado) {
          try {
            const role = await guild.roles.fetch(casino.cargoafiliado);
            if (role) {
              roleChecks.push(`✅ **${casino.label || casinoId}:** ${role.name} (${role.id})`);
            } else {
              roleChecks.push(`❌ **${casino.label || casinoId}:** Cargo não encontrado (${casino.cargoafiliado})`);
            }
          } catch (error) {
            roleChecks.push(`❌ **${casino.label || casinoId}:** Erro ao buscar cargo (${casino.cargoafiliado})`);
          }
        } else {
          roleChecks.push(`⚠️ **${casino.label || casinoId}:** Sem cargo de afiliado configurado`);
        }
      }

      const embed = EmbedFactory.info([
        '**🔍 Verificação de Cargos de Afiliado**\n',
        ...roleChecks,
        '\n**📝 Configuração:**',
        'Os cargos são configurados diretamente nos arquivos dos casinos:',
        '```',
        'events/casinos/bcgame.js',
        'events/casinos/1xbit.js',
        'events/casinos/hexabet.js',
        '```'
      ].join('\n'), 'Verificação de Cargos');

      return interaction.reply({
        embeds: [embed],
        flags: 64
      });

    } catch (error) {
      console.error('Error in checkroles:', error);
      return interaction.reply({
        embeds: [EmbedFactory.error('Erro ao verificar cargos')],
        flags: 64
      });
    }
  }
}; 