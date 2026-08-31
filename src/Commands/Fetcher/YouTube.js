const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const axios = require('axios');

module.exports = {
    name: 'yt',
    alias: ['youtube', 'ytdl'],
    desc: '🎬 Download YouTube video via direct URL',
    category: 'Downloader',
    usage: '.yt <YouTube URL>',
    reactions: { start: '🎬', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const url = args[0]?.trim();

        if (!url || (!url.includes('youtube.com') &&!url.includes('youtu.be'))) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE DOWNLOADER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}yt <YouTube URL>
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}yt https://youtu.be/xxxxx
│ ❏ ${prefix}yt https://youtube.com/watch?v=xxxxx
╰─────────────────────────╯

_*💡 Direct link download*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });
        await reply(`_*📥 Downloading YouTube video...*_`);

        try {
            let video = null;
            let title = "YouTube Video";

            // ✅ PRIMARY API
            try {
                const api = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
                const res = await axios.get(api, {
                    headers: { Accept: "application/json" },
                    timeout: 30000
                });

                const data = res.data;
                video =
                    data?.videos?.["720"] ||
                    data?.videos?.["480"] ||
                    data?.videos?.["360"] ||
                    Object.values(data?.videos || {})[0];

                title = data?.title || title;

            } catch (err) {
                console.log('[YT] Primary API failed:', err.message);

                // ✅ FALLBACK API
                try {
                    const fallbackApi = `https://ytdl.ga/handler.php?url=${encodeURIComponent(url)}`;
                    const res2 = await axios.get(fallbackApi, { timeout: 30000 });
                    const data2 = res2.data;
                    video = data2?.url || data2?.download_url || data2?.video;
                    title = data2?.title || title;
                } catch (err2) {
                    console.log('[YT] Fallback API failed:', err2.message);
                }
            }

            if (!video) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE DOWNLOADER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *❌ DOWNLOAD FAILED*
│ ❏ Could not fetch video
│ ❏ Check if link is valid
╰─────────────────────────╯`
                );
            }

            const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);

            const caption =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE DOWNLOADER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 DOWNLOAD COMPLETE*
│ ❏ Title : ${title}
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME}*_`;

            await sock.sendMessage(m.chat, {
                video: { url: video },
                mimetype: "video/mp4",
                caption,
                fileName: `${safeTitle}.mp4`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[YT ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Error downloading video*_');
        }
    }
};