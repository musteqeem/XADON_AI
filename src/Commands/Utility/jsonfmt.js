const { URL } = require('url');

module.exports = {
    name: 'jsonfmt',
    alias: [],
    category: 'Utility',
    desc: 'Format JSON with readable indentation.',
    usage: '.jsonfmt [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide JSON or reply to a message.');
            const parsed = JSON.parse(input);
            return reply(JSON.stringify(parsed, null, false));
        } catch (error) {
            console.error('[JSONFMT ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
