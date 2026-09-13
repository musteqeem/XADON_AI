const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const axios = require('axios');
const config = require('../../../settings/config');

// Use Apex gateway from config with token
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.xadon.ai';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

module.exports = {
    name: 'fb',
    alias: ['facebook', 'fbdown', 'fbdl'],
    desc: '📘 Download Facebook video via Gateway',
    category: 'Downloader',
    usage: '.fb <Facebook URL> (or reply to message with URL)',
    owner: false,
    reactions: { start: '📘', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, quoted, prefix }) => {
        let url = args[0]?.trim();

        // Priority 1: Direct URL from args
        // Priority 2: Extract from replied/quoted message
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
    *֎ • ${BOT_NAME} FACEBOOK DOWNLOADER 📘*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}fb <Facebook URL>
│ ❏ Command : ${prefix}fb (reply to message)
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}fb https://facebook.com/watch?v=...
╰─────────────────────────╯

_*💡 Supports: Posts, Reels, Watch Videos*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '📘', key: m.key } });
        await reply(`_*📥 Downloading Facebook video...*_`);

        try {
            const apiUrl = `${GATEWAY_URL}/download/facebookv2?token=${encodeURIComponent(GATEWAY_TOKEN)}&url=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl, { timeout: 60000 });
            const data = res.data;

            let videoUrl = null;
            let title = 'Facebook Video';

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
            title = data?.result?.title || data?.title || data?.respon?.title || data?.data?.title || 'Facebook Video';

            if (!videoUrl) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Failed to extract video URL from gateway*_');
            }

            await sock.sendMessage(m.chat, {
                video: { url: videoUrl },
                mimetype: 'video/mp4',
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} FACEBOOK DOWNLOADER 📘*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📹 VIDEO DETAILS*
│ ❏ Title : ${title}
│ ❏ Source : Facebook
╰─────────────────────────╯

_*📲 Powered by ${BOT_NAME} Gateway*_`,
                fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[FB ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`_*❌ Download failed: ${err.message || 'Unknown error'}*_`);
        }
    }
};