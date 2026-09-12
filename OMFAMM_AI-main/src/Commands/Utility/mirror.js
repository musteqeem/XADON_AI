const { URL } = require('url');

module.exports = {
    name: 'mirror',
    alias: [],
    category: 'Utility',
    desc: 'Reverse text by Unicode code point.',
    usage: '.mirror [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = [...input].reverse().join('');
            return reply(result);
        } catch (error) {
            console.error('[MIRROR ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
