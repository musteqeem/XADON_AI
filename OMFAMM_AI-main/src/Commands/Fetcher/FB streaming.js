const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const axios = require('axios');
const config = require('../../../settings/config');

const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.xadon.ai';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

module.exports = {
    name: 'fbstream',
    alias: ['fbs', 'fbsdown', 'fbstreaming'],
    desc: '📘 Download large Facebook videos via streaming',
    category: 'Downloader',
    usage: '.fbstream <Facebook URL> (or reply to message with URL)',
    owner: false,
    reactions: { start: '📘', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, quoted, prefix }) => {
        let url = args[0]?.trim();

        // Extract from replied message
        if (!url ||!url.includes('facebook.com')) {
            const target = m.quoted || quoted;
            if (target) {
                const targetText = target.text || target.body || target.message?.conversation || target.message?.imageMessage?.caption || target.message?.videoMessage?.caption || target.message?.extendedTextMessage?.text || '';
                if (targetText) {
                    const urlMatch = targetText.match(/(https?:\/\/[^\s]+facebook\.com[^\s]*)/i);
                    if (urlMatch) url = urlMatch[0];
                }
            }
        }

        if (!url ||!url.includes('facebook.com')) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} FB STREAM DOWNLOADER 📘*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}fbstream <Facebook URL>
│ ❏ Command : ${prefix}fbstream (reply to message)
╰─────────────────────────╯
╭─֎ *📝 NOTE*
│ ❏ Best for large files >100MB
│ ❏ Sends as document to avoid buffer issues
╰─────────────────────────╯

_*💡 Example: ${prefix}fbstream https://facebook.com/watch?v=...*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '📘', key: m.key } });
        await reply(`_*📥 Fetching large Facebook video...*_`);

        try {
            const apiUrl = `${GATEWAY_URL}/download/facebookv2?token=${encodeURIComponent(GATEWAY_TOKEN)}&url=${encodeURIComponent(url)}`;

            let videoUrl = null;
            let title = 'Facebook Video';

            try {
                const res = await axios.get(apiUrl, {
                    timeout: 30000,
                    headers: { 'Accept': 'application/json' }
                });
                const data = res.data;

                console.log('[FB] Gateway raw response:', JSON.stringify(data, null, 2));

                // Extract video URL from download_links array
                if (data?.data?.download_links && Array.isArray(data.data.download_links)) {
                    const hdLink = data.data.download_links.find(l => l.quality?.includes('HD'));
                    const sdLink = data.data.download_links.find(l => l.quality?.includes('SD'));
                    const anyLink = data.data.download_links[0];
                    videoUrl = hdLink?.url || sdLink?.url || anyLink?.url;
                }

                // Fallback to old extraction method
                if (!videoUrl) {
                    const findVideoUrl = (obj) => {
                        if (!obj || typeof obj!== 'object') return null;
                        const candidates = [
                            obj?.result?.hd, obj?.result?.sd, obj?.hd, obj?.sd,
                            obj?.url, obj?.video, obj?.link, obj?.download_url,
                            obj?.data?.hd, obj?.data?.sd, obj?.data?.url,
                            obj?.respon?.url, obj?.response?.url
                        ];
                        for (const c of candidates) {
                            if (typeof c === 'string' && c.startsWith('http')) return c;
                        }
                        for (const v of Object.values(obj)) {
                            if (typeof v === 'string' && v.startsWith('http') && v.includes('.mp4')) return v;
                            if (v && typeof v === 'object') {
                                const nested = findVideoUrl(v);
                                if (nested) return nested;
                            }
                        }
                        return null;
                    };
                    videoUrl = findVideoUrl(data);
                }

                title = data?.data?.title || data?.result?.title || data?.title || data?.respon?.title || 'Facebook Video';

                console.log('[FB] Extracted videoUrl:', videoUrl);
                console.log('[FB] Extracted title:', title);

            } catch (gatewayErr) {
                console.error('[FB] Gateway error:', gatewayErr.message);
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Gateway failed. Try again later*_');
            }

            if (!videoUrl) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Could not extract video. Link may be private or invalid*_');
            }

            const caption =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} FACEBOOK DOWNLOADER 📘*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 VIDEO DETAILS*
│ ❏ Title : ${title}
│ ❏ Type : Streaming Document
│ ❏ Source : Facebook
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME} Gateway*_`;

            // ✅ FIX: Send as document for large files to avoid buffering
            try {
                await sock.sendMessage(m.chat, {
                    document: { url: videoUrl },
                    mimetype: 'video/mp4',
                    fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}.mp4`,
                    caption
                }, { quoted: m });

                console.log('[FB] Sent as document successfully');
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            } catch (docErr) {
                console.error('[FB] Document send failed:', docErr.message);

                // Fallback: try sending as video
                try {
                    await sock.sendMessage(m.chat, {
                        video: { url: videoUrl },
                        mimetype: 'video/mp4',
                        caption,
                        fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}.mp4`
                    }, { quoted: m });

                    console.log('[FB] Sent as video successfully');
                    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                } catch (videoErr) {
                    console.error('[FB] Video send failed:', videoErr.message);

                    // Last resort: send as text link
                    await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} FACEBOOK DOWNLOADER 📘*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 VIDEO FOUND*
│ ❏ Title : ${title}
│
│ ❏ 🔗 Download Link:
│ ❏ ${videoUrl}
╰─────────────────────────╯

_*⚠️ Could not send directly. Click link to download*_`
                    );
                }
            }

        } catch (err) {
            console.error('[FB ERROR]', err.message);
            console.error('[FB ERROR FULL]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            if (err.code === 'ENOSPC' || err.message.includes('No space left on device')) {
                reply('_*❌ Server storage full. Run.cleanup to free space*_');
            } else if (err.message.includes('timeout') || err.code === 'ECONNABORTED') {
                reply('_*❌ Request timed out. Video may be too large*_');
            } else if (err.response?.status === 404) {
                reply('_*❌ Video not found. Link may be broken or private*_');
            } else {
                reply(`_*❌ ${err.message}*_`);
            }
        }
    }
};