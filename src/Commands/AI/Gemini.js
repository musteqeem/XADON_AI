const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = process.env.GATEWAY_URL || '';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

module.exports = {
    name: 'gemini',
    alias: ['gchat', 'gem', 'gemgpt'],
    category: 'AI',
    desc: `${BOT_NAME} Gemini AI with configured gateway fallbacks`,
    usage: '.gemini <question>',
    reactions: { start: '🧠', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const query = args.join(' ').trim();
        if (!query) return reply('Usage: .gemini <question>');

        try {
            const result = await askGemini(query);
            if (!result) throw new Error('Empty AI response.');
            return reply(`🧠 *${BOT_NAME} GEMINI*\n\n${result.slice(0, 12000)}`);
        } catch (error) {
            console.error('[GEMINI ERROR]', error);
            return reply(`❌ Gemini is unavailable: ${error.message}`);
        }
    }
};

async function askGemini(prompt) {
    if (GATEWAY_URL) {
        try {
            const response = await axios.post(
                `${GATEWAY_URL.replace(/\/$/, '')}/ai/gemini`,
                { text: prompt },
                {
                    timeout: 45000,
                    headers: GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : undefined
                }
            );
            const text = response.data?.result || response.data?.response || response.data?.text;
            if (text) return String(text).trim();
        } catch (error) {
            console.warn('[GEMINI GATEWAY FALLBACK]', error.message);
        }
    }

    if (!GEMINI_KEY) {
        throw new Error('Set GATEWAY_URL/GATEWAY_TOKEN or GEMINI_API_KEY in .env.');
    }

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { timeout: 45000 }
    );

    return response.data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
}
