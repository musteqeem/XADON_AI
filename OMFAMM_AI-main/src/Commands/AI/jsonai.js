const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'jsonai',
    alias: [],
    category: 'AI',
    desc: 'Convert the supplied requirements into valid JSON. Return only valid JSON unless a brief explanation is necessary.',
    usage: '.jsonai <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Convert the supplied requirements into valid JSON. Return only valid JSON unless a brief explanation is necessary.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[JSONAI ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
