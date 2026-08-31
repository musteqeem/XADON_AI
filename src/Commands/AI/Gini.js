const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';

// 4 BEST IMAGE APIs FOR GINI
const IMAGE_APIS = [
    {
        name: 'Zenzxz Gemini',
        generate: async (prompt, ratio) => {
            const res = await axios.get('https://api.zenzxz.my.id/ai/gemini', {
                params: { prompt, mode: 'image', aspect_ratio: ratio },
                timeout: 60000
            });
            const url = res.data?.result?.image || res.data?.url;
            if (!url) throw new Error('No URL');
            const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            return Buffer.from(img.data);
        }
    },
    {
        name: 'Pollinations AI',
        generate: async (prompt, ratio) => {
            const sizes = { '1:1': [512,512], '16:9': [1024,576], '9:16': [576,1024], '4:3': [1024,768], '3:2': [900,600] };
            const [w,h] = sizes[ratio] || [512,512];
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Prexzy Realistic',
        generate: async (prompt) => {
            const url = `https://apis.prexzyvilla.site/ai/realistic?prompt=${encodeURIComponent(prompt)}`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Prodia SDXL',
        generate: async (prompt) => {
            const res = await axios.post('https://api.prodia.com/v2/sd-xl', {
                prompt, steps: 20, cfg: 7
            }, { timeout: 60000 });
            const jobId = res.data.job;
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
    }
];

module.exports = {
    name: 'gini',
    alias: ['giniimg', 'gimage', 'gchatimg'],
    desc: `${BOT_NAME} AI Image Generator using Gemini`,
    category: 'AI',
    usage: '.gini <prompt> | <ratio>',
    reactions: { start: '🎨', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} GINI IMAGE •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏ Usage: ${prefix}gini <prompt> | <ratio>\n│ ❏ Example: ${prefix}gini sunset beach | 16:9\n│ ❏ Example: ${prefix}gini blue cat beside him\n│ \n│ ❏ *Ratios:* 1:1, 16:9, 9:16, 4:3, 3:2\n╰─────────────────────────╯`);
        }

        const parts = query.split('|').map(s => s.trim());
        const prompt = parts[0] || '';
        let ratio = parts[1] || '1:1';

        const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:2'];
        if (!validRatios.includes(ratio)) ratio = '1:1';

        if (!prompt) return reply(`✘ ❏ Give a valid prompt`);

        await sock.sendMessage(jid, { react: { text: "🎨", key: m.key } });
        await reply(`❏ *Generating:* ${prompt} *(${ratio})*...`);

        let imageBuffer = null;
        let sourceUsed = '';

        // Try all 4 APIs
        for (let i = 0; i < IMAGE_APIS.length; i++) {
            try {
                console.log(`[GINI] Trying ${IMAGE_APIS[i].name}`);
                imageBuffer = await IMAGE_APIS[i].generate(prompt, ratio);
                sourceUsed = IMAGE_APIS[i].name;
                if (imageBuffer && imageBuffer.length > 1024) break;
            } catch (e) {
                console.log(`[GINI] ${IMAGE_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!imageBuffer) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Failed to generate image\n❏ All 4 APIs failed`);
        }

        await sock.sendMessage(jid, {
            image: imageBuffer,
            caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} GINI AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Prompt:* ${prompt}\n❏ *Ratio:* ${ratio}\n❏ *Source:* ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
        }, { skipVerified: true });

        await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

    } catch (err) {
        console.log('[GINI ERROR]', err.message);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        if (err.code === 'ECONNABORTED') return reply(`✘ ❏ Request timed out. Try again.`);
        reply(`✘ ❏ ${err.message || 'Failed to generate image'}`);
    }
}
};