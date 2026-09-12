const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'luna',
    alias: [],
    category: 'AI',
    desc: 'Answer as a concise general-purpose AI assistant. Be useful, accurate, and structured.',
    usage: '.luna <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Answer as a concise general-purpose AI assistant. Be useful, accurate, and structured.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[LUNA ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
