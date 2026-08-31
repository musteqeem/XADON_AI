const axios = require('axios');
const FormData = require('form-data');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

// 3 VISION FALLBACKS
async function analyzeWithGateway(buffer, prompt) {
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
    form.append('prompt', prompt);
    const res = await axios.post(`${GATEWAY_URL}/vision?token=${encodeURIComponent(GATEWAY_TOKEN)}`, form, {
        headers: form.getHeaders(), timeout: 60000
    });
    if (res.data?.description) return res.data.description;
    throw new Error('Gateway vision failed');
}

async function analyzeWithGemini(buffer, prompt) {
    const base64 = buffer.toString('base64');
    const res = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDummyKey', {
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64 } }] }]
    }, { timeout: 60000 });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function analyzeWithOpenAI(buffer, prompt) {
    const base64 = buffer.toString('base64');
    const res = await axios.post('https://api.musteqeem.ai/v1/chat/completions', {
        model: "gpt-4-vision-preview",
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }] }]
    }, { headers: { 'Authorization': 'Bearer musteqeem-free' }, timeout: 60000 });
    return res.data?.choices?.[0]?.message?.content || '';
}

async function analyzeImage(buffer, prompt) {
    const apis = [analyzeWithGateway, analyzeWithGemini, analyzeWithOpenAI];
    for (let i = 0; i < apis.length; i++) {
        try {
            const result = await apis[i](buffer, prompt);
            if (result && result.trim().length > 10) return { result, source: i + 1 };
        } catch (e) { console.log(`[VISION FALLBACK ${i + 1} FAILED]`, e.message); }
    }
    throw new Error('All vision APIs failed');
}

const VISION_PROMPTS = {
    detail: 'Describe this image in detail. Include what you see, any visible text, colors, objects, people, setting, mood, and anything notable.',
    ocr: 'Extract ALL text from this image. Return only the text you can see.',
    object: 'List all objects in this image. Be specific and organized.',
    face: 'Describe any people in this image. Age, gender, clothing, expression, and what they are doing.',
    mood: 'Analyze the mood, emotion, and atmosphere of this image.',
    brand: 'Identify any brands, logos, products, or items in this image.'
};

module.exports = {
    name: 'caption',
    alias: ['describe', 'seethis', 'imgai', 'aicap', 'vision', 'ocr'],
    category: 'AI',
    desc: `${BOT_NAME} AI Vision with 3 fallbacks`,
    usage: '.caption [subcommand] (reply to image)',
    owner: false,

    execute: async (sock, m, { reply, args }) => {
        const jid = m.key.remoteJid;
        const sub = args[0]?.toLowerCase();

        if (!m.quoted) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} VISION •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏ Reply to image : *.caption*\n│ ❏ With question : *.caption what brand is this?*\n│ \n│ ❏ *SUBCOMMANDS:*\n│ ❏ detail - Full description\n│ ❏ ocr - Extract text\n│ ❏ object - List objects\n│ ❏ face - Analyze people\n│ ❏ mood - Analyze mood\n│ ❏ brand - Detect brands\n│ \n│ ❏ Aliases: describe, seethis, imgai, aicap, vision, ocr\n╰─────────────────────────╯`);
        }

        const mtype = m.quoted?.mtype || '';
        const isImage = mtype.includes('image') || mtype.includes('sticker');
        if (!isImage) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Reply to an image or sticker`);
        }

        // Determine prompt
        let prompt = VISION_PROMPTS.detail;
        let customText = args.join(' ').trim();

        if (VISION_PROMPTS[sub]) {
            prompt = VISION_PROMPTS[sub];
            customText = args.slice(1).join(' ').trim();
        }
        if (customText) prompt = customText;

        await sock.sendMessage(jid, { react: { text: "🔍", key: m.key } });
        await sock.sendMessage(jid, { text: `❏ *Analyzing image with ${BOT_NAME} Vision...*` }, { quoted: m });

        try {
            const buffer = await m.quoted.download();
            if (!buffer?.length) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Failed to download image`);
            }

            const { result, source } = await analyzeImage(buffer, prompt);
            const sources = ['Musteqeem Vision', 'Gemini Vision', 'GPT-4 Vision'];

            await sock.sendMessage(jid, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} VISION RESULT •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Analysis:*\n│\n│ ${result.split('\n').join('\n│ ')}\n╰─────────────────────────╯\n❏ Source: ${sources[source - 1]}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[CAPTION ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ❏ Analysis failed\n❏ Reason : ${err.message}`);
        }
    }
};