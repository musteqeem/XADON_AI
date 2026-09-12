const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const fetch = require('node-fetch');

module.exports = {
    name: 'mediafire',
    alias: ['mf', 'mfdown', 'mfdl'],
    desc: '🗂️ Download files from MediaFire links',
    category: 'Downloader',
    usage: '.mediafire <MediaFire URL> (or reply to message)',
    reactions: { start: '🗂️', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, quoted, prefix }) => {
        try {
            let url = args[0] || m.quoted?.text || quoted?.text;
            if (!url) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} MEDIAFIRE DOWNLOADER 🗂️*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}mediafire <MediaFire URL>
│ ❏ Command : ${prefix}mediafire (reply to message)
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}mediafire https://www.mediafire.com/file/...
╰─────────────────────────╯

_*💡 Supports any file type from MediaFire*_`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '🗂️', key: m.key } });
            await sock.sendPresenceUpdate('composing', m.chat);
            await reply(`_*📥 Fetching MediaFire file...*_`);

            const apiUrl = `https://apis.prexzyvilla.site/download/mediafire?url=${encodeURIComponent(url)}`;

            const res = await fetch(apiUrl);
            if (!res.ok) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ API failed. Try again later*_');
            }

            const data = await res.json();

            const fileUrl = data?.result?.download || data?.result?.url || data?.download || data?.url;
            const fileName = data?.result?.filename || data?.filename || 'mediafire_file';
            const fileSize = data?.result?.filesize || data?.filesize || 'Unknown';

            if (!fileUrl) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Failed to fetch file. Link may be invalid*_');
            }

            // send as document
            await sock.sendMessage(m.chat, {
                document: { url: fileUrl },
                fileName: fileName,
                mimetype: 'application/octet-stream',
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} MEDIAFIRE DOWNLOADER 🗂️*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📦 FILE DETAILS*
│ ❏ Name : ${fileName}
│ ❏ Size : ${fileSize}
│ ❏ Source : MediaFire
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME}*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[MEDIAFIRE ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to download MediaFire file*_');
        }
    }
};