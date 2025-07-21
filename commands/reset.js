const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const { EMOJIS } = require('../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reset da base de dados (ADMIN ONLY)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('database')
        .setDescription('Limpa todas as collections da base de dados')
        .addStringOption(option =>
          option
            .setName('confirmacao')
            .setDescription('Digite "CONFIRMAR" para confirmar o reset')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('tickets')
        .setDescription('Limpa apenas tickets, submissões e approvals')
        .addStringOption(option =>
          option
            .setName('confirmacao')
            .setDescription('Digite "CONFIRMAR" para confirmar o reset')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'database') {
      const confirmacao = interaction.options.getString('confirmacao');
      
      if (confirmacao !== 'CONFIRMAR') {
        return interaction.reply({
          embeds: [EmbedFactory.error('❌ **Confirmação inválida!**\n\nPara resetar a base de dados, você deve digitar exatamente "CONFIRMAR"')],
          flags: 64
        });
      }
      
      // Confirmar com o usuário
      const confirmEmbed = EmbedFactory.warning([
        '⚠️ **ATENÇÃO: RESET DA BASE DE DADOS**',
        '',
        'Você está prestes a **APAGAR TODOS OS DADOS** da base de dados:',
        '',
        '🗑️ **Serão apagados:**',
        '• Todos os tickets ativos',
        '• Todas as categorias',
        '• Todas as promoções',
        '• Todas as submissões',
        '• Todos os approvals',
        '• Todos os transcripts',
        '• Todos os logs de ações',
        '• Todos os códigos Telegram',
        '• Todos os redeems',
        '',
        '❌ **Esta ação é IRREVERSÍVEL!**',
        '',
        'Digite "SIM, APAGAR TUDO" para confirmar:'
      ].join('\n'));
      
      await interaction.reply({
        embeds: [confirmEmbed],
        flags: 64
      });
      
      // Aguardar confirmação final
      const filter = m => m.author.id === interaction.user.id && m.content === 'SIM, APAGAR TUDO';
      const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
      
      collector.on('collect', async (message) => {
        try {
          // Executar reset
          const success = await client.db.resetDatabase();
          
          if (success) {
            // Limpar cache em memória
            client.ticketStates.clear();
            
            const successEmbed = EmbedFactory.success([
              '✅ **Base de dados resetada com sucesso!**',
              '',
              '🗑️ Todos os dados foram apagados:',
              '• Tickets ativos',
              '• Categorias',
              '• Promoções',
              '• Submissões',
              '• Approvals',
              '• Transcripts',
              '• Logs',
              '• Códigos Telegram',
              '• Redeems',
              '',
              '🔄 O bot foi resetado e está pronto para uso.'
            ].join('\n'));
            
            await message.reply({ embeds: [successEmbed] });
          } else {
            await message.reply({
              embeds: [EmbedFactory.error('❌ Erro ao resetar a base de dados. Verifique os logs.')]
            });
          }
        } catch (error) {
          console.error('Error during database reset:', error);
          await message.reply({
            embeds: [EmbedFactory.error('❌ Erro inesperado durante o reset da base de dados.')]
          });
        }
      });
      
      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({
            embeds: [EmbedFactory.error('⏰ Tempo esgotado. Reset da base de dados cancelado.')],
            flags: 64
          });
        }
      });
    }
    
    if (subcommand === 'tickets') {
      const confirmacao = interaction.options.getString('confirmacao');
      
      if (confirmacao !== 'CONFIRMAR') {
        return interaction.reply({
          embeds: [EmbedFactory.error('❌ **Confirmação inválida!**\n\nPara limpar os tickets, você deve digitar exatamente "CONFIRMAR"')],
          flags: 64
        });
      }
      
      // Confirmar com o usuário
      const confirmEmbed = EmbedFactory.warning([
        '⚠️ **ATENÇÃO: LIMPEZA DE TICKETS**',
        '',
        'Você está prestes a **APAGAR TODOS OS TICKETS** da base de dados:',
        '',
        '🗑️ **Serão apagados:**',
        '• Todos os tickets ativos',
        '• Todas as submissões',
        '• Todos os approvals',
        '• Todos os transcripts',
        '',
        '✅ **Serão mantidos:**',
        '• Categorias',
        '• Promoções',
        '• Logs de ações',
        '• Códigos Telegram',
        '• Redeems',
        '',
        '❌ **Esta ação é IRREVERSÍVEL!**',
        '',
        'Digite "SIM, APAGAR TICKETS" para confirmar:'
      ].join('\n'));
      
      await interaction.reply({
        embeds: [confirmEmbed],
        flags: 64
      });
      
      // Aguardar confirmação final
      const filter = m => m.author.id === interaction.user.id && m.content === 'SIM, APAGAR TICKETS';
      const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
      
      collector.on('collect', async (message) => {
        try {
          // Executar limpeza de tickets
          const success = await client.db.cleanTicketsOnly();
          
          if (success) {
            // Limpar cache em memória
            client.ticketStates.clear();
            
            const successEmbed = EmbedFactory.success([
              '✅ **Tickets limpos com sucesso!**',
              '',
              '🗑️ Dados apagados:',
              '• Tickets ativos',
              '• Submissões',
              '• Approvals',
              '• Transcripts',
              '',
              '✅ Dados mantidos:',
              '• Categorias',
              '• Promoções',
              '• Logs',
              '• Códigos Telegram',
              '• Redeems',
              '',
              '🔄 O bot foi resetado e está pronto para uso.'
            ].join('\n'));
            
            await message.reply({ embeds: [successEmbed] });
          } else {
            await message.reply({
              embeds: [EmbedFactory.error('❌ Erro ao limpar tickets. Verifique os logs.')]
            });
          }
        } catch (error) {
          console.error('Error during tickets cleanup:', error);
          await message.reply({
            embeds: [EmbedFactory.error('❌ Erro inesperado durante a limpeza de tickets.')]
          });
        }
      });
      
      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({
            embeds: [EmbedFactory.error('⏰ Tempo esgotado. Limpeza de tickets cancelada.')],
            flags: 64
          });
        }
      });
    }
  }
}; 