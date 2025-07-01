// events/messageCreate.js
require('dotenv').config();
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const CASINOS = require('./casinos');
const { promos, refreshExpired } = require('../utils/promotions');

const ICONS = {
  info  : 'https://i.imgur.com/9N6IwU6.png',
  ok    : 'https://i.imgur.com/Vy6XWOm.png',
  error : 'https://i.imgur.com/8yZ4G8p.png'
};

const styleMap = { blue:ButtonStyle.Primary, grey:ButtonStyle.Secondary,
                   green:ButtonStyle.Success, red:ButtonStyle.Danger };

const CONFIRM_RX = /^sim[, ]*eu confirmo$/i;
const okE  = t => new EmbedBuilder().setColor(0x2ecc71).setThumbnail(ICONS.ok)   .setDescription(t);
const errE = t => new EmbedBuilder().setColor(0xe74c3c).setThumbnail(ICONS.error).setDescription(t);
const infoE= t => new EmbedBuilder().setColor(0x3498db).setThumbnail(ICONS.info) .setDescription(t);

module.exports = {
  name:'messageCreate',
  async execute(m, client){
    if (m.author.bot || m.channel.type !== 0) return;
    const st = client.ticketStates.get(m.channel.id); if (!st) return;

    /* ─── CONFIRM 18+ ─── */
    if (st.awaitConfirm) {
      if (CONFIRM_RX.test(m.content.trim())) {
        st.awaitConfirm = false; client.ticketStates.set(m.channel.id, st);

        let row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('gw_type_telegram').setLabel('Telegram').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('gw_type_gtb').setLabel('GTB').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('gw_type_other').setLabel('Outro').setStyle(ButtonStyle.Secondary)
        );

        refreshExpired();
        const now = Date.now();
        for (const [pid,p] of Object.entries(promos)) {
          if (!p.active) continue;
          if (now > new Date(p.end)) continue;

          const btn = new ButtonBuilder()
            .setCustomId(`gw_promo_${pid}`)
            .setLabel(p.name)
            .setStyle(styleMap[p.color] || ButtonStyle.Success);
          if (p.emoji) btn.setEmoji(p.emoji);

          if (row.components.length === 5) {
            await m.channel.send({ components:[row] });
            row = new ActionRowBuilder();
          }
          row.addComponents(btn);
        }

        return m.channel.send({
          embeds:[
            new EmbedBuilder().setColor(0x00b0f4).setThumbnail(ICONS.info)
              .setTitle('🎁 Giveaway ganho!').setDescription('Escolhe o tipo de giveaway:')
          ],
          components:[row]
        });
      }
      return m.reply({ embeds:[errE('Escreve exactamente **"Sim, eu confirmo"** para prosseguir.')] });
    }
    /* ── TELEGRAM código + print ── */
    if (st.gwType==='telegram' && !st.casino) {
      if (m.attachments.size>0) st.telegramHasImg=true;
      const c=m.content.match(/[a-f0-9]{8}/i); if(c) st.telegramCode=c[0].toLowerCase();
      client.ticketStates.set(m.channel.id, st);

      if (!st.telegramCode || !st.telegramHasImg){
        const miss=[]; if(!st.telegramCode) miss.push('**código**'); if(!st.telegramHasImg) miss.push('**print**');
        return m.reply({ embeds:[errE(`Falta ${miss.join(' e ')}.`)] });
      }

      const logs=await m.guild.channels.fetch(process.env.LOGS_CHANNEL_ID);
      const msgs=await logs.messages.fetch({limit:100});
      const hit =msgs.find(x=>x.content.toLowerCase().includes(st.telegramCode));
      if(!hit) return m.reply({ embeds:[errE('Código não encontrado nos logs.')] });
      if(Date.now()-hit.createdTimestamp>48*60*60*1000)
        return m.reply({ embeds:[errE('Código com +48 h. Aguarda mod.')] });

      const pr=hit.content.match(/prenda\s*:\s*(\d+)/i); if(pr) st.prize=pr[1];
      st.casino='RioAce'; st.step=0; st.awaitProof=true; client.ticketStates.set(m.channel.id, st);
      await m.reply({ embeds:[okE('Código validado! Casino: **RioAce**')] });
      return askChecklist(m.channel, st);
    }

    /* ── CHECKLIST normal ── */
    if (st.casino && st.awaitProof) {
      const cfg = CASINOS[st.casino];
      const idx = st.step;

      if (idx < 3) {
        if (m.attachments.size===0) return m.reply({ embeds:[errE('Este passo requer **uma imagem**.')] });
        st.awaitProof = false;
      } else if (idx === 3) {
        if (m.attachments.size>0) st.step4HasImg=true;
        if (m.content && m.content.length>=25){ st.step4HasAddr=true; st.ltcAddress=m.content; }
        client.ticketStates.set(m.channel.id, st);
        if (!st.step4HasImg || !st.step4HasAddr) {
          if(!st.step4HasImg)  m.reply({ embeds:[errE('Falta a **imagem** do depósito.')] });
          if(!st.step4HasAddr) m.reply({ embeds:[errE('Falta colar o **endereço LTC** em texto.')] });
          return;
        }
        st.awaitProof = false;
      }

      if (!st.awaitProof) {
        client.ticketStates.set(m.channel.id, st);

        if (idx+1 < cfg.checklist.length) {
          const nxt = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('proof_next').setLabel('Próximo passo').setStyle('Primary')
          );
          return m.reply({ embeds:[okE('Prova recebida! Clica em **Próximo passo**.')], components:[nxt] });
        }
        const fin = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('finish_ticket').setLabel('🚀 Finalizar').setStyle('Success')
        );
        return m.reply({ embeds:[okE('Checklist concluído! Clica em **Finalizar**.')], components:[fin] });
      }
    }
  }
};

/* ── helper primeira pergunta checklist ── */
function askChecklist(ch, st) {
  const cfg = CASINOS[st.casino];
  const embed = new EmbedBuilder().setColor(0x3498db).setThumbnail(ICONS.info)
                .setDescription(`1/${cfg.checklist.length} — ${cfg.checklist[0]}`);
  if (cfg.images && cfg.images[0]) embed.setImage(cfg.images[0]);

  ch.send({
    embeds:[embed],
    components:[ new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('proof_next').setLabel('Próximo passo').setStyle('Primary')
    )]
  });
}
