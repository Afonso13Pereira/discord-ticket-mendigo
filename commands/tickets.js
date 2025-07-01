const { SlashCommandBuilder, PermissionFlagsBits,
        ModalBuilder, TextInputBuilder, TextInputStyle,
        ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { cats, create, close, list } = require('../utils/categories');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Gerir categorias de ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s=>s.setName('create').setDescription('Nova categoria'))
    .addSubcommand(s=>s.setName('activelist').setDescription('Listar categorias'))
    .addSubcommand(s=>s.setName('close')
        .setDescription('Fechar categoria')
        .addStringOption(o=>o.setName('id').setDescription('ID').setRequired(true))),

  async execute(inter){
    const sub=inter.options.getSubcommand();
    if(sub==='create'){
      const modal=new ModalBuilder().setCustomId('cat_create')
        .setTitle('Nova categoria')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cname').setLabel('Nome').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('ccolor').setLabel('Cor (blue|grey|green|red)').setStyle(TextInputStyle.Short).setRequired(false)),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('cemoji').setLabel('Emoji (opcional)').setStyle(TextInputStyle.Short).setRequired(false))
        );
      return inter.showModal(modal);
    }

    if(sub==='activelist'){
      const arr=list();
      if(!arr.length) return inter.reply({content:'(nenhuma)',flags:64});
      const lines=arr.slice(0,15).map(([id,c])=>{
        const s=c.active?'🟢':'🔴';
        return `${s} ${c.emoji||''} **${c.name}** \`${id}\``;
      }).join('\n');
      return inter.reply({embeds:[ new EmbedBuilder().setColor(0x5865f2).setTitle('Categorias').setDescription(lines) ], flags:64});
    }

    if(sub==='close'){
      const id=inter.options.getString('id'); if(!cats[id]) return inter.reply({content:'ID inválido',flags:64});
      close(id); return inter.reply({content:`Categoria ${id} fechada.`,flags:64});
    }
  }
};
