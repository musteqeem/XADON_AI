const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const fetch = require('node-fetch');

module.exports = {
    name: 'yturld',
    alias: ['ytaudio', 'yta'],
    desc: '🎵 Download YouTube audio as MP3',
    category: 'Downloader',
    usage: '.yturld <YouTube URL> (or reply to message)',
    reactions: { start: '🔍', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, quoted, prefix }) => {
        try {
            // Get URL from args or quoted message
            let url = args[0] || m.quoted?.text || quoted?.text;
            if (!url) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE AUDIO 🎵*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}yturld <YouTube URL>
│ ❏ Command : ${prefix}yturld (reply to message)
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}yturld https://youtu.be/xxxxx
╰─────────────────────────╯

_*💡 Downloads as MP3 Audio*_`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
            await sock.sendPresenceUpdate('composing', m.chat);
            await reply(`_*🔍 Fetching YouTube audio...*_`);

            const apiUrl = `https://apis.prexzyvilla.site/download/ytaudio?url=${encodeURIComponent(url)}`;

            // Fetch audio info
            const res = await fetch(apiUrl);
            if (!res.ok) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(`_*❌ API failed: ${res.status}*_`);
            }
            const data = await res.json();

            if (!data.download ||!data.title) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Failed to get audio*_');
            }

            const audioUrl = data.download; // MP3 URL
            const title = data.title.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 50) || 'youtube_audio';

            await reply(`_*📥 Downloading: ${data.title}*_`);

            // Fetch actual MP3
            const mp3Res = await fetch(audioUrl);
            if (!mp3Res.ok) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Failed to download MP3*_');
            }
            const buffer = Buffer.from(await mp3Res.arrayBuffer());

            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title}.mp3`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[YTAUDIO ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to download YouTube audio*_');
        }
    }
};