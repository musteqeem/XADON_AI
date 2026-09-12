const { URL } = require('url');

module.exports = {
    name: 'lower',
    alias: [],
    category: 'Utility',
    desc: 'Convert text to lowercase.',
    usage: '.lower [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = input.toLowerCase();
            return reply(result);
        } catch (error) {
            console.error('[LOWER ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
