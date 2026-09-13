const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'tojs',
    alias: [],
    category: 'AI',
    desc: 'Convert the supplied logic or pseudocode into clean, modern CommonJS JavaScript with error handling.',
    usage: '.tojs <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Convert the supplied logic or pseudocode into clean, modern CommonJS JavaScript with error handling.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[TOJS ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
