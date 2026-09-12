const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'horror',
    alias: ['horror2026'],
    category: 'AI',
    desc: 'Give a safe horror-themed story or atmosphere description.',
    usage: '.horror <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Give a safe horror-themed story or atmosphere description.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[HORROR ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
