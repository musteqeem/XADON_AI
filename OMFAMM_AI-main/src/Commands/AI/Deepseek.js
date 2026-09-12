const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = process.env.GATEWAY_URL || '';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

module.exports = {
    name: 'deepseek',
    alias: ['ds', 'ask', 'ai2'],
    category: 'AI',
    desc: `${BOT_NAME} DeepSeek assistant`,
    usage: '.deepseek <question>',
    reactions: { start: '🤖', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const query = args.join(' ').trim();
        if (!query) return reply('Usage: .deepseek <question>');

        try {
            const result = await askDeepSeek(query);
            return reply(`🤖 *${BOT_NAME} DEEPSEEK*\n\n${String(result).slice(0, 12000)}`);
        } catch (error) {
            console.error('[DEEPSEEK ERROR]', error);
            return reply(`❌ DeepSeek is unavailable: ${error.message}`);
        }
    }
};

async function askDeepSeek(prompt) {
    if (GATEWAY_URL) {
        try {
            const response = await axios.post(
                `${GATEWAY_URL.replace(/\/$/, '')}/deepseek`,
                { query: prompt },
                {
                    timeout: 45000,
                    headers: GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : undefined
                }
            );
            const text = response.data?.message?.content || response.data?.result || response.data?.response;
            if (text) return String(text).trim();
        } catch (error) {
            console.warn('[DEEPSEEK GATEWAY FALLBACK]', error.message);
        }
    }

    if (!DEEPSEEK_KEY) {
        throw new Error('Set GATEWAY_URL/GATEWAY_TOKEN or DEEPSEEK_API_KEY in .env.');
    }

    const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
            model: DEEPSEEK_MODEL,
            messages: [
                { role: 'system', content: `You are ${BOT_NAME}, a helpful and accurate assistant.` },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        },
        {
            timeout: 45000,
            headers: { Authorization: `Bearer ${DEEPSEEK_KEY}` }
        }
    );

    return response.data?.choices?.[0]?.message?.content?.trim();
}
