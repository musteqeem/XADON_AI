const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'brainstorm',
    alias: [],
    category: 'AI',
    desc: 'Brainstorm practical, distinct ideas. Group them by usefulness and effort.',
    usage: '.brainstorm <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Brainstorm practical, distinct ideas. Group them by usefulness and effort.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[BRAINSTORM ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
