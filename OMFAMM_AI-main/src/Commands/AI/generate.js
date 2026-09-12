const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';

// 4 BEST IMAGE APIs 2026 - Tested and working
const IMAGE_APIS = [
    {
        name: 'Pollinations AI',
        generate: async (prompt, width, height) => {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&enhance=true`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
            if (res.data && res.data.length > 1024) return Buffer.from(res.data);
            throw new Error('Empty response');
        }
    },
    {
        name: 'Prexzy Realistic',
        generate: async (prompt) => {
            const url = `https://apis.prexzyvilla.site/ai/realistic?prompt=${encodeURIComponent(prompt)}`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
            if (res.data && res.data.length > 1024) return Buffer.from(res.data);
            throw new Error('Empty response');
        }
    },
    {
        name: 'Prodia SDXL',
        generate: async (prompt) => {
            const res = await axios.post('https://api.prodia.com/v2/sd-xl', {
                prompt: prompt,
                negative_prompt: 'blurry, low quality, bad anatomy, extra limbs, deformed, distorted face, ugly',
                steps: 20,
                cfg: 7
            }, { timeout: 60000 });
            const jobId = res.data.job;
            // Wait for completion
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 2000));
                const status = await axios.get(`https://api.prodia.com/v2/job/${jobId}`);
                if (status.data.status === 'succeeded') {
                    const img = await axios.get(status.data.imageUrl, { responseType: 'arraybuffer' });
                    return Buffer.from(img.data);
                }
            }
            throw new Error('Timeout');
        }
    },
    {
        name: 'Lexica Aperture',
        generate: async (prompt) => {
            const res = await axios.post('https://lexica.art/api/v1/generate', {
                prompt: prompt,
                width: 1024,
                height: 1024
            }, { timeout: 60000 });
            const imgUrl = res.data.images?.[0]?.url;
            if (!imgUrl) throw new Error('No image');
            const img = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            return Buffer.from(img.data);
        }
    }
];

module.exports = {
    name: 'generate',
    alias: ['aiimg', 'gen', 'imagine', 'draw'],
    desc: `${BOT_NAME} AI Image Generator with 4 fallbacks`,
    category: 'AI',
    usage: '.generate <prompt> | .generate full <prompt>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGE GEN •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏ .generate <prompt>\n│ ❏ .generate full <prompt>\n│ \n│ ❏ *Modes:*\n│ ❏ normal - Portrait, 1:1\n│ ❏ full - Full body, 16:9\n│ \n│ ❏ *Examples:*\n│ ❏ .generate a cyberpunk cat\n│ ❏ .generate full beautiful anime girl\n╰─────────────────────────╯`);
        }

        let isFull = false;
        if (args[0].toLowerCase() === 'full') {
            isFull = true;
            args.shift();
        }

        const prompt = args.join(' ').trim();
        if (!prompt) return reply(`✘ ❏ Give a valid prompt`);

        await sock.sendPresenceUpdate('composing', jid);
        await reply(`❏ *Generating image with ${BOT_NAME} AI...*`);

        // Enhanced prompts
        const enhancedPrompt = isFull
           ? `${prompt}, full body, wide shot, full frame, 8k, ultra HD, highly detailed, cinematic lighting, sharp focus`
           : `${prompt}, portrait, centered, ultra HD, highly detailed, sharp focus`;

        const negativePrompt = 'blurry, low quality, bad anatomy, extra limbs, deformed, distorted face, ugly, cropped, watermark';

        const width = isFull ? 1024 : 512;
        const height = isFull ? 576 : 512;

        let imageBuffer = null;
        let sourceUsed = '';

        // Try all 4 APIs
        for (let i = 0; i < IMAGE_APIS.length; i++) {
            try {
                console.log(`[GENERATE] Trying ${IMAGE_APIS[i].name}`);
                imageBuffer = await IMAGE_APIS[i].generate(enhancedPrompt, width, height);
                sourceUsed = IMAGE_APIS[i].name;
                if (imageBuffer && imageBuffer.length > 1024) break;
            } catch (e) {
                console.log(`[GENERATE] ${IMAGE_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!imageBuffer) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Failed to generate image\n❏ All 4 APIs failed. Try again later`);
        }

        await sock.sendMessage(jid, {
            image: imageBuffer,
            caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGE GENERATED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *DETAILS*\n│ ❏ Prompt: ${prompt}\n│ ❏ Mode: ${isFull? 'FULL' : 'NORMAL'}\n│ ❏ Size: ${width}x${height}\n│ ❏ Source: ${sourceUsed}\n╰─────────────────────────╯`
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
    }
};