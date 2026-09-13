const { URL } = require('url');

module.exports = {
    name: 'titlecase',
    alias: [],
    category: 'Utility',
    desc: 'Convert text to title case.',
    usage: '.titlecase [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = input.toLowerCase().replace(/\b[\p{L}\p{N}]/gu, char => char.toUpperCase());
            return reply(result);
        } catch (error) {
            console.error('[TITLECASE ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
