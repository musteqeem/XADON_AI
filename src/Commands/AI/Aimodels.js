const axios = require('axios');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';

const DEFAULT_MODEL_THUMB = 'https://cdn-icons-png.flaticon.com/512/4616/4616735.png';

let modelCache = { data: null, expires: 0 };

async function fetchModels() {
    const now = Date.now();
    if (modelCache.data && modelCache.expires > now) return modelCache.data;
    
    try {
        const res = await axios.get(`${GATEWAY_URL}/ai/aiwriter-models?token=${GATEWAY_TOKEN}`, { timeout: 15000 });
        const data = res.data;
        let models = null;

        if (data?.result?.data && Array.isArray(data.result.data)) models = data.result.data;
        else if (Array.isArray(data?.result)) models = data.result;
        else if (data?.data && Array.isArray(data.data)) models = data.data;
        else if (typeof data?.result === 'string') {
            try {
                const parsed = JSON.parse(data.result);
                models = parsed?.data || parsed?.result || parsed;
            } catch { models = null; }
        }
        if (!Array.isArray(models)) throw new Error('Invalid response structure');

        modelCache = { data: models, expires: now + 5 * 60 * 1000 };
        return models;
    } catch (err) {
        console.error('[AIMODEL ERROR]', err.message);
        throw err;
    }
}

module.exports = {
    name: 'aimodels',
    alias: ['aimodel', 'model'],
    desc: 'Browse AI models with carousel and chat with any model',
    category: 'AI',
    usage: '.aimodels\n.aimodels <number/code> <prompt>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const input = args.join(' ').trim();
        
        // LIST MODELS
        if (!input) {
            await sock.sendMessage(jid, { react: { text: "🤖", key: m.key } });
            try {
                const models = await fetchModels();
                if (!Array.isArray(models) || models.length === 0) {
                    await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                    return reply(`✘ ֎ No models available.`);
                }
                
                const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} AI MODELS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

                const cards = models.slice(0, 15).map((model, i) => {
                    const modelCode = model.code || '';
                    const commandExample = `.aimodels ${modelCode} Your prompt here`;
                    return {
                        image: { url: DEFAULT_MODEL_THUMB },
                        caption: `${header}\n╭─֎ *${i+1}. ${model.name || 'Unknown'}*
│ ❏ Code : ${modelCode}
│ ❏ Type : ${model.is_pro? 'Pro 🜲' : 'Free ⌘'} ${model.is_image? '🖼️' : ''}
│ ❏ Desc : ${(model.description || '').slice(0, 100)}${model.description?.length > 100? '…' : ''}
╰─────────────────────────╯`,
                        footer: `Code: ${modelCode}`,
                        nativeFlow: [
                            { text: '📋 Copy Command', copy: commandExample },
                            { text: '📝 Copy Code', copy: modelCode }
                        ]
                    };
                });
                
                await sock.sendMessage(jid, {
                    text: `${header}\n╭─֎ *AI MODEL SHOWCASE*\n│ ❏ Total : ${models.length} models\n│ ❏ Tip : Swipe to browse\n╰─────────────────────────╯`,
                    footer: `Powered by ${BOT_NAME}`,
                    cards
                }, { quoted: m });

                await sock.sendMessage(jid, { 
                    text: `✦ ֎ *How to use*\n❏ Copy command from card\n❏ Replace "Your prompt here" with your question\n❏ Example :.aimodels gpt-4 Write an essay`
                }, { quoted: m });
                
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            } catch (err) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                reply(`✘ ֎ Failed to load models\n❏ Error : ${err.message}`);
            }
            return;
        }
        
        // CHAT WITH SELECTED MODEL
        const parts = input.split(' ');
        const firstPart = parts[0];
        const isNumber = /^\d+$/.test(firstPart);
        
        let selectedModel = null;
        let prompt = '';
        
        const models = await fetchModels();
        
        if (isNumber) {
            const index = parseInt(firstPart) - 1;
            if (!models || index < 0 || index >= models.length) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Invalid model number. Choose 1–${models?.length || 0}.`);
            }
            selectedModel = models[index];
            prompt = parts.slice(1).join(' ').trim();
        } else {
            const searchTerm = firstPart.toLowerCase();
            selectedModel = models?.find(m => 
                m.name?.toLowerCase().includes(searchTerm) || 
                m.code?.toLowerCase().includes(searchTerm)
            );
            if (!selectedModel) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Model "${firstPart}" not found.\n❏ Use .aimodels to list models.`);
            }
            prompt = parts.slice(1).join(' ').trim();
        }
        
        if (!prompt) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Please provide a prompt.\n❏ Example :.aimodels ${firstPart} Hello world`);
        }
        
        await sock.sendMessage(jid, { react: { text: "💬", key: m.key } });
        
        try {
            const apiUrl = `${GATEWAY_URL}/ai/chateverywhere?token=${GATEWAY_TOKEN}&text=${encodeURIComponent(prompt)}&model=${encodeURIComponent(selectedModel.code)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });
            
            let response = data?.message || data?.reply || data?.response || data?.result || data?.text;
            if (typeof response === 'object' && response !== null) {
                response = response.content || response.output || JSON.stringify(response, null, 2);
            }
            
            if (!response || response === '[object Object]') {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Received an empty response.`);
            }

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ${selectedModel.name.toUpperCase()} •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *Prompt:* ${prompt}
│
│ ֎ *Response:*
│ ${response}
╰─────────────────────────╯
⚡ Powered by API Gateway`;

            await sock.sendMessage(jid, { text: caption }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[AIMODEL CHAT ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Failed to get response from ${selectedModel.name}.\n❏ Error : ${err.message}`);
        }
    }
};