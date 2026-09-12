const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const fetch = require('node-fetch');

module.exports = {
    name: 'pinterest',
    alias: ['pint', 'pindl', 'pin'],
    desc: '📌 Download Pinterest images/videos',
    category: 'Downloader',
    usage: '.pinterest <Pinterest URL> (or reply to message)',
    reactions: { start: '📌', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, quoted, prefix }) => {
        try {
            let url = args[0] || m.quoted?.text || quoted?.text;
            if (!url) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} PINTEREST DOWNLOADER 📌*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}pinterest <Pinterest URL>
│ ❏ Command : ${prefix}pinterest (reply to message)
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}pinterest https://pin.it/xxxxx
│ ❏ ${prefix}pinterest https://www.pinterest.com/pin/...
╰─────────────────────────╯

_*💡 Supports Images, Videos, GIFs*_`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '📌', key: m.key } });
            await sock.sendPresenceUpdate('composing', m.chat);
            await reply(`_*🔍 Fetching Pinterest media...*_`);

            const apiUrl = `https://apis.prexzyvilla.site/download/pinterest?url=${encodeURIComponent(url)}`;

            const res = await fetch(apiUrl);
            if (!res.ok) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ API failed. Try again later*_');
            }

            const data = await res.json();

            // handle formats
            const media = data?.result?.video || data?.result?.image || data?.result?.url || data?.url;
            const title = data?.result?.title || data?.title || 'Pinterest Media';
            const author = data?.result?.author || data?.author || 'Unknown';

            if (!media) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Failed to fetch media. Link may be invalid*_');
            }

            // detect type
            const isVideo = media.includes('.mp4') || media.includes('.mov') || media.includes('.webm');

            if (isVideo) {
                await sock.sendMessage(m.chat, {
                    video: { url: media },
                    caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} PINTEREST DOWNLOADER 📌*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 PINTEREST VIDEO*
│ ❏ Title : ${title}
│ ❏ Author : ${author}
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME}*_`
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, {
                    image: { url: media },
                    caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} PINTEREST DOWNLOADER 📌*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *🖼️ PINTEREST IMAGE*
│ ❏ Title : ${title}
│ ❏ Author : ${author}
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME}*_`
                }, { quoted: m });
            }

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[PINTEREST ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to download Pinterest media*_');
        }
    }
};