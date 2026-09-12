const { URL } = require('url');

module.exports = {
    name: 'jsonmin',
    alias: [],
    category: 'Utility',
    desc: 'Minify valid JSON.',
    usage: '.jsonmin [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide JSON or reply to a message.');
            const parsed = JSON.parse(input);
            return reply(JSON.stringify(parsed, null, true));
        } catch (error) {
            console.error('[JSONMIN ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
