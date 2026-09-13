const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'reviewai',
    alias: [],
    category: 'AI',
    desc: 'Review the supplied code or text for correctness, maintainability, security, and edge cases. Give prioritized fixes.',
    usage: '.reviewai <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Review the supplied code or text for correctness, maintainability, security, and edge cases. Give prioritized fixes.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[REVIEWAI ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
