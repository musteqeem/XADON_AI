const chatbot = require('../Core/❚.js');

module.exports = {
    name: 'summarizeurl',
    alias: [],
    category: 'AI',
    desc: 'Summarize the supplied text. If the input is a URL, fetch its readable page content when possible and summarize it.',
    usage: '.summarizeurl <prompt>',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            let input = Array.isArray(args) ? args.join(' ').trim() : '';
            if (!input) input = String(m?.quoted?.text || '').trim();

            if (!input) {
                return reply('❌ Provide a prompt or reply to a message.');
            }

            let userPrompt = input;

            if (/^https?:\/\//i.test(input)) {
                try {
                    const response = await fetch(input, {
                        headers: { 'User-Agent': 'MUSTEQEEM-AI/1.0' },
                        signal: AbortSignal.timeout(15000)
                    });
                    if (response.ok) {
                        const html = await response.text();
                        const text = html
                            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/&nbsp;/gi, ' ')
                            .replace(/&amp;/gi, '&')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 12000);
                        if (text) userPrompt = `Summarize this webpage content clearly and accurately:\n\n${text}`;
                    }
                } catch (fetchError) {
                    console.warn('[SUMMARIZEURL FETCH]', fetchError.message);
                }
            }

            const result = await chatbot.askAI('Summarize the supplied text. If the input is a URL, fetch its readable page content when possible and summarize it.' + `\n\nUser input:\n${userPrompt}`, m.chat);

            return reply(result || '⚠️ The AI returned an empty response.');
        } catch (error) {
            console.error('[SUMMARIZEURL ERROR]', error);
            return reply('⚠️ AI service is temporarily unavailable. Please try again.');
        }
    }
};
