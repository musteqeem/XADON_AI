const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'gini',
    alias: [],
    category: 'AI',
    desc: 'Answer the request clearly and accurately as a general-purpose AI assistant.',
    usage: '.gini <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Answer the request clearly and accurately as a general-purpose AI assistant.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[GINI ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
