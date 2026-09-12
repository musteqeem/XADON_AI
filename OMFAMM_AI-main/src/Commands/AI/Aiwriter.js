const axios = require('axios');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = config.api?.gateway || '';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';

// Cache for 5 minutes
let modelCache = { data: null, expires: 0 };

async function fetchModels() {
    const now = Date.now();
    if (modelCache.data && modelCache.expires > now) {
        return modelCache.data;
    }
    
    const res = await axios.get(`${GATEWAY_URL}/ai/aiwriter-models?token=${GATEWAY_TOKEN}`, { timeout: 15000 });
    const data = res.data;
    
    let models = null;
    if (data?.result?.data && Array.isArray(data.result.data)) {
        models = data.result.data;
    } else if (Array.isArray(data?.result)) {
        models = data.result;
    } else if (typeof data?.result === 'string') {
        try {
            const parsed = JSON.parse(data.result);
            models = parsed?.data || parsed;
        } catch { models = null; }
    }
    
    if (!Array.isArray(models)) throw new Error('Invalid response structure');
    modelCache = { data: models, expires: now + 5 * 60 * 1000 };
    return models;
}

module.exports = {
    name: 'aiwriter',
    alias: ['aimodel', 'model', 'ai'],
    desc: 'List AI models or chat with a specific model',
    category: 'AI',
    usage: '.aiwriter\n.aiwriter <number> <prompt>\n.aiwriter <model name/code> <prompt>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const input = args.join(' ').trim();
        
        const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} AI WRITER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

        // LIST MODELS
        if (!input) {
            await sock.sendMessage(jid, { react: { text: "📝", key: m.key } });
            try {
                const models = await fetchModels();
                
                if (!Array.isArray(models) || models.length === 0) {
                    await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                    return reply(`✘ ֎ No models available.`);
                }
                
                let text = `${header}\n╭─֎ *AI MODELS LIST*\n`;
                models.slice(0, 15).forEach((model, i) => {
                    const name = model.name || 'Unknown';
                    const code = model.code || '';
                    const isPro = model.is_pro ? 'Pro 🜲' : 'Free 🆓';
                    const canImage = model.is_image ? ' 🖼️' : '';
                    text += `│ ${i + 1}. ${name} - ${isPro}${canImage}\n│    Code: ${code}\n`;
                });
                if (models.length > 15) {
                    text += `│ ... and ${models.length - 15} more\n`;
                }
                text += `╰─────────────────────────╯\n\n`;
                text += `֎ *Usage:*\n❏ .aiwriter 1 <prompt>\n❏ .aiwriter gpt-4o <prompt>`;
                text += `\n\n⚡ Powered by Crysnova Gateway`;
                
                await sock.sendMessage(jid, { text }, { quoted: m });
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            } catch (err) {
                console.error('[AIWRITER ERROR]', err.message);
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                reply(`✘ ֎ Failed to fetch models\n❏ Error : ${err.message}`);
            }
            return;
        }
        
        // CHAT WITH MODEL
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
                return reply(`✘ ֎ Model "${firstPart}" not found.\n❏ Use .aiwriter to list models.`);
            }
            prompt = parts.slice(1).join(' ').trim();
        }
        
        if (!prompt) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Please provide a prompt.\n❏ Example :.aiwriter ${firstPart} Hello world`);
        }
        
        await sock.sendMessage(jid, { react: { text: "🤖", key: m.key } });
        
        try {
            const modelCode = selectedModel.code;
            const apiUrl = `${GATEWAY_URL}/ai/chateverywhere?token=${GATEWAY_TOKEN}&text=${encodeURIComponent(prompt)}&model=${encodeURIComponent(modelCode)}`;
            
            const { data } = await axios.get(apiUrl, { timeout: 60000 });
            
            let response = data?.message || data?.reply || data?.response || data?.result || data?.text;
            
            if (typeof response === 'object' && response !== null) {
                response = JSON.stringify(response, null, 2);
            }
            
            if (!response || response === '[object Object]') {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Received an empty response from the model.`);
            }
            
            const modelName = selectedModel.name || modelCode;
            const aiHeader = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ${modelName.toUpperCase()} •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${aiHeader}
╭─֎ *Prompt:* ${prompt}
│
│ ֎ *Response:*
│ ${response}
╰─────────────────────────╯
⚡ Powered by API Gateway`;

            await sock.sendMessage(jid, { text: caption }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            
        } catch (err) {
            console.error('[AIWRITER CHAT ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Failed to get response from ${selectedModel.name}.\n❏ Error : ${err.message}`);
        }
    }
};