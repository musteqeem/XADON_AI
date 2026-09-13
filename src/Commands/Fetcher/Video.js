const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const yts = require('yt-search');
const axios = require('axios');

module.exports = {
    name: 'video',
    alias: ['ytvideo', 'ytv'],
    desc: '🎬 Download YouTube video',
    category: 'Downloader',
    usage: '.video <video name or URL>',
    reactions: { start: '🔎', success: '✅', error: '❌' },

    execute: async (sock, m, { text, reply, prefix }) => {
        try {
            if (!text) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE VIDEO 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}video <video name or URL>
╰─────────────────────────╯
╭─֎ *📝 EXAMPLES*
│ ❏ ${prefix}video Alan Walker Lily
│ ❏ ${prefix}video https://youtu.be/xxxxx
╰─────────────────────────╯

_*💡 Downloads in best available quality*_`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '🔎', key: m.key } });

            const { videos } = await yts(text);
            if (!videos.length) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ No video found*_');
            }

            const vid = videos[0];
            const videoId = vid.videoId;

            await sock.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });

            await sock.sendMessage(m.chat, {
                image: { url: vid.thumbnail },
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE VIDEO 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 VIDEO FOUND*
│ ❏ Title : ${vid.title}
│ ❏ Duration : ${vid.timestamp}
│ ❏ Views : ${vid.views.toLocaleString()}
│ ❏ Channel : ${vid.author.name}
╰─────────────────────────╯

_*📥 Downloading video...*_`
            }, { quoted: m });

            let videoDownloadUrl = null;
            let title = vid.title;

            // ✅ PRIMARY API
            try {
                const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(vid.url)}`;
                const res = await axios.get(apiUrl, {
                    headers: { Accept: "application/json" },
                    timeout: 30000
                });

                const data = res.data;
                videoDownloadUrl =
                    data?.videos?.["720"] ||
                    data?.videos?.["480"] ||
                    data?.videos?.["360"] ||
                    Object.values(data?.videos || {})[0];

                title = data?.title || title;

            } catch (err) {
                console.log('[VIDEO] Primary API failed:', err.message);

                // ✅ FALLBACK API
                try {
                    const fallbackUrl = `https://ytdl.ga/handler.php?url=${encodeURIComponent(vid.url)}`;
                    const res2 = await axios.get(fallbackUrl, { timeout: 30000 });
                    const data2 = res2.data;
                    videoDownloadUrl = data2?.url || data2?.download_url || data2?.video;
                    title = data2?.title || title;
                } catch (err2) {
                    console.log('[VIDEO] Fallback API failed:', err2.message);
                }
            }

            if (!videoDownloadUrl) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE VIDEO 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *❌ DOWNLOAD FAILED*
│ ❏ Possible reasons:
│ ❏ • Age-restricted video
│ ❏ • Copyright blocked
│ ❏ • API is down
╰─────────────────────────╯`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '📤', key: m.key } });

            const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);

            await sock.sendMessage(m.chat, {
                video: { url: videoDownloadUrl },
                mimetype: "video/mp4",
                fileName: `${safeTitle}.mp4`,
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE VIDEO 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 DOWNLOAD COMPLETE*
│ ❏ Title : ${title}
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME}*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[VIDEO ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Error downloading video*_');
        }
    }
};