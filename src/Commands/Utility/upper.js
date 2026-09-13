const { URL } = require('url');

module.exports = {
    name: 'upper',
    alias: [],
    category: 'Utility',
    desc: 'Convert text to uppercase.',
    usage: '.upper [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = input.toUpperCase();
            return reply(result);
        } catch (error) {
            console.error('[UPPER ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
