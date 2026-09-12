const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'sqlai',
    alias: [],
    category: 'AI',
    desc: 'Act as a SQL assistant. Explain, optimize, or generate SQL. Return valid SQL and a concise explanation.',
    usage: '.sqlai <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Act as a SQL assistant. Explain, optimize, or generate SQL. Return valid SQL and a concise explanation.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[SQLAI ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
