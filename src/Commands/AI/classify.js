const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'classify',
    alias: [],
    category: 'AI',
    desc: 'Classify the supplied text into useful categories and explain the classification briefly.',
    usage: '.classify <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Classify the supplied text into useful categories and explain the classification briefly.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[CLASSIFY ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
