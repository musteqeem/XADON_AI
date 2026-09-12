const { URL } = require('url');

module.exports = {
    name: 'wordcount',
    alias: [],
    category: 'Utility',
    desc: 'Count words in text.',
    usage: '.wordcount [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = String(input ? input.trim().split(/\s+/).filter(Boolean).length : 0);
            return reply(result);
        } catch (error) {
            console.error('[WORDCOUNT ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
