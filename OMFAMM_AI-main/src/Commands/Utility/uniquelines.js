const { URL } = require('url');

module.exports = {
    name: 'uniquelines',
    alias: [],
    category: 'Utility',
    desc: 'Remove duplicate lines while preserving order.',
    usage: '.uniquelines [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = [...new Set(input.split(/\r?\n/))].join('\n');
            return reply(result);
        } catch (error) {
            console.error('[UNIQUELINES ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
