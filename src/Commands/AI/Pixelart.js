const axios = require("axios");
const config = require("../../../settings/config");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const IMAGE_API_BASE = process.env.IMAGE_API_BASE || config.api?.imageBase || '';

// ORIGINAL + 3 PUBLIC PIXEL ART APIs
const PIXEL_APIS = [
    {
        name: 'Xadon Gateway',
        generate: async (prompt) => {
            const enhancedPrompt = `${prompt}, pixel art, 8-bit style, retro gaming aesthetic, crisp pixels`;
            const negative = `blurry, smooth, realistic, 3d render, photorealistic, high resolution, anti-aliasing`;
            const url = `${IMAGE_API_BASE}/pixel-art?prompt=${encodeURIComponent(enhancedPrompt)}&negative_prompt=${encodeURIComponent(negative)}`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Pollinations Pixel',
        generate: async (prompt) => {
            const pixelPrompt = `${prompt}, pixel art, 8-bit, retro game sprite, crisp pixels, low resolution`;
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(pixelPrompt)}?width=512&height=512&nologo=true`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Craiyon Pixel',
        generate: async (prompt) => {
            const res = await axios.post('https://backend.craiyon.com/generate', {
                prompt: `${prompt}, pixel art, 8-bit retro gaming, detailed pixels`
            }, { timeout: 60000 });
            const b64 = res.data.images?.[0];
            if (!b64) throw new Error('No image');
            return Buffer.from(b64, 'base64');
        }
    },
    {
        name: 'DeepAI Pixel',
        generate: async (prompt) => {
            const res = await axios.post('https://api.deepai.org/api/text2img', {
                text: `${prompt}, pixel art, 8-bit, retro style, game asset`
            }, {
                headers: { 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' },
                timeout: 60000
            });
            const imgUrl = res.data?.output_url;
            if (!imgUrl) throw new Error('No URL');
            const img = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            return Buffer.from(img.data);
        }
    }
];

module.exports = {
    name: 'pixelart',
    alias: ['pixelai', '8bit', 'retroart', 'pixel'],
    category: 'AI',
    desc: `${BOT_NAME} Generate pixel art AI images with 4 fallbacks`,
    usage: '.pixelart <prompt>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} PIXEL ART AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏.pixelart <prompt>\n│ \n│ ❏ *Examples:*\n│ ❏.pixelart cyberpunk city\n│ ❏.pixelart pokemon style character\n│ ❏.pixelart retro game boss\n╰─────────────────────────╯`);
        }

        const basePrompt = args.join(' ').trim();
        if (!basePrompt) return reply('✘ ❏ Give a valid prompt');

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { react: { text: '👾', key: m.key } });
        await reply(`❏ *Generating pixel art...*`);

        let imageBuffer = null;
        let sourceUsed = '';

        // Try all 4 APIs - CRYSNOVA FIRST
        for (let i = 0; i < PIXEL_APIS.length; i++) {
            try {
                console.log(`[PIXELART] Trying ${PIXEL_APIS[i].name}`);
                imageBuffer = await PIXEL_APIS[i].generate(basePrompt);
                sourceUsed = PIXEL_APIS[i].name;
                if (imageBuffer && imageBuffer.length > 1024) break;
            } catch (e) {
                console.log(`[PIXELART] ${PIXEL_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!imageBuffer) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Failed to generate pixel art\n❏ All 4 APIs failed. Try again later`);
        }

        await sock.sendMessage(jid, {
            image: imageBuffer,
            caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} PIXEL ART •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Prompt:* ${basePrompt}\n❏ *Style:* 8-bit Retro\n❏ *Source:* ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

    } catch (err) {
        console.error('[PIXELART ERROR]', err.message);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        reply('✘ ❏ Failed to generate pixel art');
    }
}
};