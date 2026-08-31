const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const DATA_FILE = path.join(__dirname, '../../../database/vv-reactions.json');

let reactionTriggers = {};
let listenerAttached = false;

try {
  if (fs.existsSync(DATA_FILE)) {
    reactionTriggers = JSON.parse(fs.readFileSync(DATA_FILE));
  }
} catch {}

function saveTriggers() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(reactionTriggers, null, 2));
}

module.exports = {
  name: 'vv',
  alias: ['viewonce', 'vview', 'vvp', 'unvv'],
  category: 'Media',
  owner: true,
  desc: 'Unlock and save view-once media. With reaction trigger',
  usage: '.vv (reply) |.vv cmd <emoji> |.vvp (reply)',
  reactions: {
    start: '👁️',
    success: '✓'
  },

  execute: async (sock, m, { args, reply, prefix }) => {
    try {
      const cmd = m.body.split(' ')[0].toLowerCase();
      const sender = m.sender;

      // ───── SET REACTION TRIGGER ─────
      if (args[0] === 'cmd' && args[1]) {
        reactionTriggers[sender] = args[1];
        saveTriggers();
        let msg = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV TRIGGER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Trigger set: ${args[1]}
❏ Now react with ${args[1]} to any VV message
❏ I will auto send it to your DM`;
        return reply(msg);
      }

      // ───── MUST REPLY ─────
      let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VIEW ONCE UNLOCK •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}vv (reply to VV) : Unlock in group
│ ❏ ${prefix}vvp (reply to VV) : Unlock to DM
│ ❏ ${prefix}vv cmd 😈 : Set reaction trigger
╰─────────────────────────╯
❏ Supported: image, video, audio, sticker`;
        return reply(help);
      }

      // unwrap ephemeral
      if (quoted.ephemeralMessage) quoted = quoted.ephemeralMessage.message;
      // unwrap viewOnce
      if (quoted.viewOnceMessage) quoted = quoted.viewOnceMessage.message;

      const type = Object.keys(quoted)[0];

      // ───── SUPPORTED TYPES ─────
      if (!['imageMessage','videoMessage','stickerMessage','audioMessage'].includes(type)) {
        return reply('✘ ֎ Only view-once image/video/audio/sticker supported.');
      }

      await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

      // ───── DOWNLOAD BUFFER ─────
      const stream = await downloadContentFromMessage(
        quoted[type],
        type.replace('Message','').toLowerCase()
      );

      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (buffer.length < 1000) return reply('✘ ֎ Failed to download media');

      // ───── MAP TYPE TO SEND TYPE ─────
      const sendType =
        type === 'videoMessage'? 'video' :
        type === 'imageMessage'? 'image' :
        type === 'stickerMessage'? 'sticker' :
        type === 'audioMessage'? 'audio' : null;

      if (!sendType) return reply('✘ ֎ Unsupported type.');

      // ───── PRIVATE (.vvp) ─────
      if (cmd === '.vvp') {
        await sock.sendMessage(sender, {
          [sendType]: buffer,
          caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV SAVED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ View-once saved privately`
        });
        await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });
        return reply('✓ ֎ Sent to your DM.');
      }

      // ───── NORMAL (.vv) ─────
      await sock.sendMessage(m.chat, {
        [sendType]: buffer,
        caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV UNLOCKED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ View-once media unlocked`
      }, { quoted: m });

      await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });

      // ───── ATTACH REACTION LISTENER ONCE ─────
      if (!listenerAttached) {
        listenerAttached = true;

        sock.ev.on('messages.reaction', async (updates) => {
          try {
            const update = updates[0];
            const reactedEmoji = update.reaction?.text;
            const reactor = update.reaction?.senderId || update.reaction?.participant;

            if (!reactedEmoji ||!reactionTriggers[reactor]) return;
            if (reactedEmoji!== reactionTriggers[reactor]) return;

            const msg = await sock.loadMessage(update.key.remoteJid, update.key.id);
            if (!msg?.message) return;

            let content = msg.message;
            if (content.ephemeralMessage) content = content.ephemeralMessage.message;
            if (content.viewOnceMessage) content = content.viewOnceMessage.message;

            const t = Object.keys(content)[0];
            if (!['imageMessage','videoMessage','stickerMessage','audioMessage'].includes(t)) return;

            const s = await downloadContentFromMessage(
              content[t],
              t.replace('Message','').toLowerCase()
            );

            let buf = Buffer.alloc(0);
            for await (const chunk of s) {
              buf = Buffer.concat([buf, chunk]);
            }

            const st =
              t === 'videoMessage'? 'video' :
              t === 'imageMessage'? 'image' :
              t === 'stickerMessage'? 'sticker' :
              t === 'audioMessage'? 'audio' : null;

            if (!st) return;

            await sock.sendMessage(reactor, {
              [st]: buf,
              caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV REACTION •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Auto saved via reaction: ${reactedEmoji}`
            });

          } catch (e) {
            console.error('[VV REACTION ERROR]', e);
          }
        });
      }

    } catch (err) {
      console.error('[VV ERROR]', err);
      await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
      reply(`✘ ֎ Error unlocking view-once\n❏ Error: ${err.message}`);
    }
  }
};