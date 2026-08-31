const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "media",
    alias: ['mediatools', 'mediamenu', 'm'],
    desc: 'Show all media tools',
    category: "Media",
    usage: ".media",
    reactions: { start: '🎬', success: '✅' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });

        const menu = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} MEDIA MENU*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

╭─֎ *CREATE & CONVERT*
│ ❏ ${prefix}sticker 
│    _Image/Video → Sticker 5s limit_
│ ❏ ${prefix}toround 
│    _Video/Sticker → Round sticker 10s_
│ ❏ ${prefix}rounds 
│    _Image/Video → Round sticker 8s_
╰─────────────────────────╯

╭─֎ *EXTRACT & CONVERT*
│ ❏ ${prefix}rtoimg 
│    _Round sticker → Image/Video_
│ ❏ ${prefix}toimg 
│    _Sticker → Image/Video_
│ ❏ ${prefix}togif 
│    _Sticker → GIF/MP4 with watermark_
╰─────────────────────────╯

╭─֎ *USAGE*
│ ❏ Reply to media with the command
╰─────────────────────────╯

_Powered by ${BOT_NAME}_`;

        await sock.sendMessage(m.chat, {
            text: menu
        }, { quoted: m });

        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
};