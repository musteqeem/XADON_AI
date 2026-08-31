const axios = require("axios");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';

// 4 RANDOM PUBLIC HORROR IMAGE APIs FROM WEB 2026
const HORROR_APIS = [
    {
        name: 'Pollinations Horror',
        generate: async (prompt) => {
            const horrorPrompt = `${prompt}, horror style, dark atmosphere, scary, creepy, cinematic lighting, 8k, highly detailed`;
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(horrorPrompt)}?width=1024&height=1024&nologo=true`;
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Craiyon AI',
        generate: async (prompt) => {
            const res = await axios.post('https://backend.craiyon.com/generate', {
                prompt: `${prompt}, horror, dark, scary, detailed`
            }, { timeout: 60000 });
            const b64 = res.data.images?.[0];
            if (!b64) throw new Error('No image');
            return Buffer.from(b64, 'base64');
        }
    },
    {
        name: 'DeepAI Horror',
        generate: async (prompt) => {
            const res = await axios.post('https://api.deepai.org/api/text2img', {
                text: `${prompt}, horror photography, dark, eerie, cinematic, ultra detailed`
            }, {
                headers: { 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' }, // free public key
                timeout: 60000
            });
            const imgUrl = res.data?.output_url;
            if (!imgUrl) throw new Error('No URL');
            const img = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            return Buffer.from(img.data);
        }
    },
    {
        name: 'Stable Horde',
        generate: async (prompt) => {
            const res = await axios.post('https://stablehorde.net/api/v2/generate/async', {
                prompt: `${prompt}, horror art, dark fantasy, scary, highly detailed`,
                params: { width: 1024, height: 1024, steps: 20 },
                nsfw: true
            }, { headers: { 'apikey': '0000000' }, timeout: 60000 });

            const id = res.data.id;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 3000));
                const status = await axios.get(`https://stablehorde.net/api/v2/generate/status/${id}`);
                if (status.data.done) {
                    const imgUrl = status.data.generations?.[0]?.img;
                    const img = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                    return Buffer.from(img.data);
                }
            }
            throw new Error('Timeout');
        }
    }
];

module.exports = {
    name: 'horror',
    alias: ['scary', 'creep', 'nightmare', 'haunt'],
    category: 'AI',
    desc: `${BOT_NAME} Generate horror AI images with 4 fallbacks`,
    usage: '.horror <prompt> |.horror cinematic <prompt>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} HORROR AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏.horror <prompt>\n│ ❏.horror cinematic <prompt>\n│ \n│ ❏ *Examples:*\n│ ❏.horror haunted house\n│ ❏.horror cinematic ghost in mirror\n╰─────────────────────────╯`);
        }

        let isCinematic = false;
        if (args[0].toLowerCase() === 'cinematic') {
            isCinematic = true;
            args.shift();
        }

        const basePrompt = args.join(' ').trim();
        if (!basePrompt) return reply('✘ ❏ Give a valid prompt');

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { react: { text: '🎭', key: m.key } });
        await reply(`❏ *Summoning nightmare...*`);

        // Enhance prompt based on style
        const enhancedPrompt = isCinematic
          ? `${basePrompt}, cinematic horror, film grain, dramatic lighting, wide shot, 8k, ultra detailed`
           : `${basePrompt}, dark atmosphere, horror style, detailed, chilling, creepy`;

        let imageBuffer = null;
        let sourceUsed = '';

        // Try all 4 public APIs
        for (let i = 0; i < HORROR_APIS.length; i++) {
            try {
                console.log(`[HORROR] Trying ${HORROR_APIS[i].name}`);
                imageBuffer = await HORROR_APIS[i].generate(enhancedPrompt);
                sourceUsed = HORROR_APIS[i].name;
                if (imageBuffer && imageBuffer.length > 1024) break;
            } catch (e) {
                console.log(`[HORROR] ${HORROR_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!imageBuffer) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Failed to summon nightmare\n❏ All 4 APIs failed. Try again later`);
        }

        await sock.sendMessage(jid, {
            image: imageBuffer,
            caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} HORROR AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Prompt:* ${basePrompt}\n❏ *Mode:* ${isCinematic? 'CINEMATIC' : 'NORMAL'}\n❏ *Source:* ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

    } catch (err) {
        console.error('[HORROR ERROR]', err.message);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        reply('✘ ❏ Failed to summon nightmare');
    }
}
};