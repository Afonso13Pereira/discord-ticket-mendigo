const { SlashCommandBuilder, PermissionFlagsBits,
        ModalBuilder, TextInputBuilder, TextInputStyle,
        ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { promos, create, close, list } = require('../utils/promotions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promos')
    .setDescription('Gerir promo-flashes')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s=>s.setName('create').setDescription('Criar promoção'))
    .addSubcommand(s=>s.setName('activelist').setDescription('Listar promoções'))
    .addSubcommand(s=>s.setName('close')
        .setDescription('Fechar promoção')
        .addStringOption(o=>o.setName('id').setDescription('ID').setRequired(true))),

  async execute(inter){
    const sub=inter.options.getSubcommand();
    if(sub==='create'){
      const modal=new ModalBuilder().setCustomId('promo_create')
        .setTitle('Criar promoção')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pname').setLabel('Nome').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pend').setLabel('Termina (AAAA-MM-DD HH:MM)').setStyle(TextInputStyle.Short)
              .setPlaceholder('2025-12-31 23:30').setRequired(true)),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pcasino').setLabel('Casino ("todos" ou nome)').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pcolor').setLabel('Cor (blue|grey|green|red)').setStyle(TextInputStyle.Short).setRequired(false)),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pemoji').setLabel('Emoji (opcional)').setStyle(TextInputStyle.Short).setRequired(false))
        );
      return inter.showModal(modal);
    }

    if(sub==='activelist'){
      const arr=list();
      if(!arr.length) return inter.reply({content:'(nenhuma)',flags:64});
      const lines=arr.slice(0,15).map(([id,p])=>{
        const s=p.active?'🟢':'🔴';
        return `${s} ${p.emoji||''} **${p.name}** \`${id}\` (fecha <t:${Math.floor(new Date(p.end)/1000)}:R>)`;
      }).join('\n');
      return inter.reply({embeds:[ new EmbedBuilder().setColor(0x3498db).setTitle('Promoções').setDescription(lines) ], flags:64});
    }

    if(sub==='close'){
      const id=inter.options.getString('id'); if(!promos[id]) return inter.reply({content:'ID inválido',flags:64});
      close(id); return inter.reply({content:`Promo ${id} fechada.`,flags:64});
    }
  }
};
