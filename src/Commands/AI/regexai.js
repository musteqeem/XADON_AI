const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'regexai',
    alias: [],
    category: 'AI',
    desc: 'Act as a regular-expression expert. Produce and explain a safe regex for the requested task.',
    usage: '.regexai <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Act as a regular-expression expert. Produce and explain a safe regex for the requested task.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[REGEXAI ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
