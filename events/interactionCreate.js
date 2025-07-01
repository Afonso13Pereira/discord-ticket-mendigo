// events/interactionCreate.js
/* eslint-disable no-case-declarations */
require('dotenv').config();
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionsBitField,
  StringSelectMenuBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, InteractionType
} = require('discord.js');

const CASINOS                         = require('./casinos');
const { promos, create: createPromo,
        refreshExpired }              = require('../utils/promotions');
const { cats,   create: createCat   } = require('../utils/categories');

/* canais fixos */
const READY_CHANNEL_ID  = '1386488872799567902';
const RESULT_CHANNEL_ID = '1386489439680987218';

/* ícones */
const ICONS = {
  info  : 'https://i.imgur.com/9N6IwU6.png',
  ok    : 'https://i.imgur.com/Vy6XWOm.png',
  warn  : 'https://i.imgur.com/M8JAvLm.png',
  error : 'https://i.imgur.com/8yZ4G8p.png'
};
const WELCOME_GIF = 'https://cliply.co/wp-content/uploads/2019/05/371905140_MEET_ROBOT_400px.gif';

/* helpers */
const okE  = t => new EmbedBuilder().setColor(0x2ecc71).setThumbnail(ICONS.ok)   .setDescription(t);
const errE = t => new EmbedBuilder().setColor(0xe74c3c).setThumbnail(ICONS.error).setDescription(t);
const infoE= t => new EmbedBuilder().setColor(0x3498db).setThumbnail(ICONS.info) .setDescription(t);

const styleMap = { blue:ButtonStyle.Primary, grey:ButtonStyle.Secondary,
                   green:ButtonStyle.Success, red:ButtonStyle.Danger };
const findCasinoId = name =>
  Object.keys(CASINOS).find(id => id.toLowerCase() === name.toLowerCase()) || null;

/* embed 18+ */
const CONFIRM_EMBED = new EmbedBuilder()
  .setColor(0xf1c40f)
  .setThumbnail('https://gifmania.com.br/wp-content/uploads/2020/09/proibido_para_menores_gif.gif')
  .setTitle('Confirmação de elegibilidade')
  .setDescription([
    'Escreve **`Sim, eu confirmo`** para aceitar:',
    '• Tenho mais de 18 anos;',
    '• Desejo reclamar o prémio;',
    '• Assumo responsabilidade pelas minhas apostas;',
    '• Reconheço risco de dependência.\n',
    '*Apenas após a confirmação poderás continuar.*'
  ].join('\n'));

/* ═══════════════════════════════════════════════════════ */
module.exports = {
  name: 'interactionCreate',
  async execute(i, client) {

    refreshExpired();                         // promo expiradas → inativas

    /* Slash-commands */
    if (i.isChatInputCommand()) {
      const cmd = client.commands.get(i.commandName);
      if (cmd) return cmd.execute(i, client);
    }

    /* ───────── MODALS ───────── */

    if (i.type === InteractionType.ModalSubmit) {
      /* Promo create */
      if (i.customId === 'promo_create') {
        const name   = i.fields.getTextInputValue('pname').trim();
        const endISO = i.fields.getTextInputValue('pend').trim();
        const casino = i.fields.getTextInputValue('pcasino').trim();
        const color  = (i.fields.getTextInputValue('pcolor')?.trim().toLowerCase() || 'grey');
        const emoji  = (i.fields.getTextInputValue('pemoji')?.trim() || null);
        const id     = createPromo(name,endISO,casino,color,emoji);
        return i.reply({ content:`✅ Promo **${name}** criada (ID \`${id}\`).`, flags:64 });
      }

      /* Categoria create */
      if (i.customId === 'cat_create') {
        const name  = i.fields.getTextInputValue('cname').trim();
        const color = (i.fields.getTextInputValue('ccolor')?.trim().toLowerCase() || 'grey');
        const emoji = (i.fields.getTextInputValue('cemoji')?.trim() || null);
        const id    = createCat(name,color,emoji);
        return i.reply({ content:`✅ Categoria **${name}** criada (ID \`${id}\`).`, flags:64 });
      }
    }

    /* ───────── Abrir ticket (category_*) ───────── */
    if (i.isButton() && i.customId.startsWith('category_')) {
      const catId = i.customId.slice(9);
      const cat   = cats[catId] || { name: catId, color:'grey', emoji:null };

      /* cria canal ticket-N */
      const parent = i.guild.channels.cache
        .find(c => c.name === cat.name && c.type === ChannelType.GuildCategory);
      const num = Math.max(0,
        ...i.guild.channels.cache.filter(c=>c.name?.startsWith('ticket-'))
          .map(c=>parseInt(c.name.split('-')[1])||0)) + 1;

      const ticket = await i.guild.channels.create({
        name:`ticket-${num}`,
        type: ChannelType.GuildText,
        parent: parent?.id,
        permissionOverwrites:[
          { id:i.user.id, allow:[PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id:i.guild.roles.everyone.id, deny:[PermissionsBitField.Flags.ViewChannel] }
        ]
      });

      client.ticketStates.set(ticket.id,{ ownerTag:i.user.tag });

      await ticket.send({
        embeds:[ new EmbedBuilder().setColor(0x3498db).setTitle('Olá! Eu sou o bot 🤖')
                 .setDescription('Segue as instruções abaixo para continuares.')
                 .setImage(WELCOME_GIF) ]
      });

      const supportRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('support_ticket').setLabel('Falar com suporte').setStyle(ButtonStyle.Danger)
      );

      if (cat.name === 'Giveaways') {
        const st = client.ticketStates.get(ticket.id); st.awaitConfirm = true; client.ticketStates.set(ticket.id, st);
        await ticket.send({ embeds:[CONFIRM_EMBED], components:[supportRow] });
      } else {
        await ticket.send({ components:[supportRow] });
      }
      return i.reply({ content:`Ticket criado: ${ticket}`, flags:64 });
    }

    /* ───────── Botões tipo Giveaway ───────── */
    if (i.isButton() && (i.customId.startsWith('gw_type_') || i.customId.startsWith('gw_promo_'))) {
      try{ await i.deferUpdate(); }catch{}
      const st = client.ticketStates.get(i.channel.id);
      if (st.awaitConfirm) return;

      /* promo dinâmica */
      if (i.customId.startsWith('gw_promo_')) {
        const pid = i.customId.split('_')[2];
        const p   = promos[pid];
        if (!p || !p.active || Date.now() > new Date(p.end))
          return i.channel.send({ embeds:[errE('Esta promoção já terminou.')] });

        st.gwType = `promo:${pid}`;

        if (/todos/i.test(p.casino) || p.casino.includes(',')) {
          st.casino=null; st.step=0; st.awaitProof=true; client.ticketStates.set(i.channel.id,st);
          await i.channel.send({ embeds:[ okE(`Promoção **${p.name}** seleccionada! Escolhe o casino.`) ] });
          return askCasino(i.channel);
        }

        const cid = findCasinoId(p.casino);
        if (!cid) return i.channel.send({ embeds:[errE(`Casino **${p.casino}** não configurado.`)] });

        st.casino=cid; st.step=0; st.awaitProof=true; client.ticketStates.set(i.channel.id, st);
        await i.channel.send({ embeds:[ okE(`Promoção **${p.name}** seleccionada em **${cid}**.`) ] });
        return askChecklist(i.channel, st);
      }

      /* fixos */
      const type=i.customId.split('_')[2];
      st.gwType=type; if(type==='gtb') st.prize=30; client.ticketStates.set(i.channel.id, st);

      if(type==='telegram'){
        return i.channel.send({ embeds:[ infoE('📩 Envia **código** + **print** da mensagem do bot.') ] });
      }
      return askCasino(i.channel);
    }

    /* SELECT casino */
    if (i.isStringSelectMenu() && i.customId==='select_casino'){
      try{ await i.deferUpdate(); }catch{}
      const choice=i.values[0];
      if(choice==='none')
        return i.followUp({ content:'Seleciona um casino válido.', flags:64 });

      const st=client.ticketStates.get(i.channel.id);
      st.casino=choice; st.step=0; st.awaitProof=true; client.ticketStates.set(i.channel.id, st);
      return askChecklist(i.channel, st);
    }

    /* Próximo passo */
    if (i.isButton() && i.customId==='proof_next') {
      try{ await i.deferUpdate(); }catch{}
      const st=client.ticketStates.get(i.channel.id);
      if(!st || st.awaitProof)
        return i.followUp({ embeds:[errE('Ainda falta enviar a prova.')], flags:64 });

      st.step++; st.awaitProof=true; client.ticketStates.set(i.channel.id, st);
      return askChecklist(i.channel, st);
    }

    /* suporte humano */
    if (i.isButton() && i.customId==='support_ticket') {
      try{ await i.deferUpdate(); }catch{}
      const staff=await i.guild.channels.fetch(process.env.STAFF_CHANNEL_ID);
      await staff.send(`🚨 ${i.channel} precisa de suporte — ${i.user.tag}`);
      return i.followUp({ embeds:[okE('Equipe notificada!')], flags:64 });
    }

    /* sendToReady / finalize (mantém no teu projecto) */
  }
};

/* ═════════════ HELPERS ═════════════ */
function casinoOptions(){
  return [
    { label:'— Selecionar casino —', value:'none', emoji:'❓', default:true, disabled:true },
    ...Object.values(CASINOS).map(c=>({ label:c.label, value:c.id, emoji:c.emoji||undefined }))
  ];
}
function askCasino(ch){
  ch.send({
    embeds:[ new EmbedBuilder().setColor(0xf1c40f).setThumbnail(ICONS.warn)
             .setDescription('⚠️ Selecciona o casino (sujeito a BAN se não cumprires).') ],
    components:[
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_casino')
          .setPlaceholder('Seleciona o casino')
          .addOptions(casinoOptions())
      )
    ]
  });
}
function askChecklist(ch, st){
  const cfg=CASINOS[st.casino];
  if(!cfg) return ch.send({ embeds:[errE('Casino não configurado.')] });

  const idx=st.step??0;
  const embed=new EmbedBuilder().setColor(0x3498db).setThumbnail(ICONS.info)
               .setDescription(`${idx+1}/${cfg.checklist.length} — ${cfg.checklist[idx]}`);
  if(cfg.images && cfg.images[idx]) embed.setImage(cfg.images[idx]);

  ch.send({
    embeds:[embed],
    components:[
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('proof_next').setLabel('Próximo passo').setStyle(ButtonStyle.Primary)
      )
    ]
  });
}
