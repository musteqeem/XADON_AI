const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const fetch = require('node-fetch');

module.exports = {
    name: 'spotify',
    alias: ['sp', 'spdl', 'spotdl'],
    desc: '🎧 Download Spotify songs as MP3',
    category: 'Downloader',
    usage: '.spotify <Spotify URL> (or reply to message)',
    reactions: { start: '🎧', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, quoted, prefix }) => {
        try {
            let url = args[0] || m.quoted?.text || quoted?.text;
            if (!url) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} SPOTIFY DOWNLOADER 🎧*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}spotify <Spotify URL>
│ ❏ Command : ${prefix}spotify (reply to message)
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}spotify https://open.spotify.com/track/...
╰─────────────────────────╯

_*💡 Sends both playable audio + MP3 file*_`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '🎧', key: m.key } });
            await sock.sendPresenceUpdate('composing', m.chat);
            await reply(`_*🔍 Fetching Spotify track...*_`);

            const apiUrl = `https://apis.prexzyvilla.site/download/spotify?url=${encodeURIComponent(url)}`;

            const res = await fetch(apiUrl);
            if (!res.ok) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ API failed. Try again later*_');
            }

            const data = await res.json();

            const audioUrl = data?.result?.download || data?.result?.url || data?.download || data?.url;
            const title = data?.result?.title || data?.title || 'Spotify Song';
            const artist = data?.result?.artist || data?.artist || 'Unknown Artist';
            const thumbnail = data?.result?.thumbnail || data?.thumbnail;
            const duration = data?.result?.duration || data?.duration || 'Unknown';

            if (!audioUrl) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Failed to fetch song. Link may be invalid*_');
            }

            // 🎵 Info card with thumbnail
            if (thumbnail) {
                await sock.sendMessage(m.chat, {
                    image: { url: thumbnail },
                    caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} SPOTIFY DOWNLOADER 🎧*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *🎵 TRACK INFO*
│ ❏ Title : ${title}
│ ❏ Artist : ${artist}
│ ❏ Duration : ${duration}
╰─────────────────────────╯

_*📥 Downloading...*_`
                }, { quoted: m });
            }

            // 🎵 Send as playable audio
            await sock.sendMessage(m.chat, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });

            // 📥 Send as document file
            const safeTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 50);

            await sock.sendMessage(m.chat, {
                document: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`,
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} SPOTIFY DOWNLOADER 🎧*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📦 FILE READY*
│ ❏ Title : ${title}
│ ❏ Artist : ${artist}
│ ❏ Format : MP3 Audio
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME}*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[SPOTIFY ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to download Spotify track*_');
        }
    }
};