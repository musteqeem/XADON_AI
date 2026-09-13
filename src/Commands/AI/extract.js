const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'extract',
    alias: [],
    category: 'AI',
    desc: 'Extract structured facts, entities, requirements, or action items from the supplied text.',
    usage: '.extract <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Extract structured facts, entities, requirements, or action items from the supplied text.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[EXTRACT ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
