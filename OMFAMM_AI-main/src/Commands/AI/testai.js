const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'testai',
    alias: [],
    category: 'AI',
    desc: 'Act as a software testing assistant. Create test cases, edge cases, and expected results for the request.',
    usage: '.testai <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            const result = await chatbot.askAI('Act as a software testing assistant. Create test cases, edge cases, and expected results for the request.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[TESTAI ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
