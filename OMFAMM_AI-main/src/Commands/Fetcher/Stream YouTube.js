const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const axios = require('axios');

module.exports = {
    name: 'yts',
    alias: ['streamyt', 'ytstream', 'yt'],
    desc: '🎬 Download YouTube video',
    category: 'Downloader',
    usage: '.yts <YouTube URL>',
    reactions: { start: '🎬', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const url = args[0]?.trim();

        if (!url || (!url.includes('youtube.com') &&!url.includes('youtu.be'))) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE DOWNLOADER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}yts <YouTube URL>
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}yts https://youtu.be/xxxxx
│ ❏ ${prefix}yts https://youtube.com/watch?v=xxxxx
╰─────────────────────────╯

_*💡 Supports 720p, 480p, 360p*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });
        await reply(`_*📥 Downloading YouTube video...*_`);

        let video = null;
        let title = 'YouTube Video';
        let apiUsed = '';

        // ✅ PRIMARY API
        try {
            const api = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
            const res = await axios.get(api, {
                headers: { Accept: "application/json" },
                timeout: 30000
            });

            const data = res.data;
            console.log('[YT] Primary API response:', JSON.stringify(data, null, 2));

            video =
                data?.videos?.["720"] ||
                data?.videos?.["480"] ||
                data?.videos?.["360"] ||
                Object.values(data?.videos || {})[0];

            title = data.title || title;
            apiUsed = 'primary';

        } catch (primaryErr) {
            console.error('[YT] Primary API failed:', primaryErr.message);

            // ✅ FALLBACK API 1: ytdl.ga
            try {
                await reply('_*⚠️ Primary API failed, trying fallback 1...*_');

                const fallbackApi = `https://ytdl.ga/handler.php?url=${encodeURIComponent(url)}`;
                const res = await axios.get(fallbackApi, {
                    headers: { Accept: "application/json" },
                    timeout: 30000
                });

                const data = res.data;
                console.log('[YT] Fallback API 1 response:', JSON.stringify(data, null, 2));

                video = data?.url || data?.download_url || data?.video;
                title = data?.title || title;
                apiUsed = 'fallback1';

            } catch (fallback1Err) {
                console.error('[YT] Fallback API 1 failed:', fallback1Err.message);

                // ✅ FALLBACK API 2: najemi.cz
                try {
                    await reply('_*⚠️ Fallback 1 failed, trying fallback 2...*_');

                    const fallbackApi2 = `https://najemi.cz/ytdl/handler.php?url=${encodeURIComponent(url)}`;
                    const res = await axios.get(fallbackApi2, {
                        headers: { Accept: "application/json" },
                        timeout: 30000
                    });

                    const data = res.data;
                    console.log('[YT] Fallback API 2 response:', JSON.stringify(data, null, 2));

                    video = data?.url || data?.download_url || data?.video;
                    title = data?.title || title;
                    apiUsed = 'fallback2';

                } catch (fallback2Err) {
                    console.error('[YT] Fallback API 2 failed:', fallback2Err.message);
                }
            }
        }

        if (!video) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE DOWNLOADER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *❌ DOWNLOAD FAILED*
│ ❏ Reason: Video not available
╰─────────────────────────╯
╭─֎ *📝 POSSIBLE CAUSES*
│ ❏ Age-restricted video
│ ❏ Copyright blocked
│ ❏ Livestream / Shorts
│ ❏ All APIs are down
╰─────────────────────────╯`
            );
        }

        console.log('[YT] Final video URL:', video);
        console.log('[YT] API used:', apiUsed);

        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);

        const caption =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE DOWNLOADER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 VIDEO DETAILS*
│ ❏ Title : ${title}
│ ❏ Source : ${apiUsed.toUpperCase()}
│ ❏ Type : MP4 Video
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME}*_`;

        // ✅ Send as document first (better for large files)
        try {
            await sock.sendMessage(m.chat, {
                document: { url: video },
                mimetype: "video/mp4",
                fileName: `${safeTitle}.mp4`,
                caption
            }, { quoted: m });

            console.log('[YT] Sent as document successfully');
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (docErr) {
            console.error('[YT] Document send failed:', docErr.message);

            // Fallback: try sending as video
            try {
                await sock.sendMessage(m.chat, {
                    video: { url: video },
                    mimetype: "video/mp4",
                    caption,
                    fileName: `${safeTitle}.mp4`
                }, { quoted: m });

                console.log('[YT] Sent as video successfully');
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            } catch (videoErr) {
                console.error('[YT] Video send failed:', videoErr.message);

                // Last resort: send as text link
                await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} YOUTUBE DOWNLOADER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 VIDEO FOUND*
│ ❏ Title : ${title}
│
│ ❏ 🔗 Download Link:
│ ❏ ${video}
╰─────────────────────────╯

_*⚠️ Could not send directly. Click link to download*_`
                );
            }
        }
    }
};