const { URL } = require('url');

module.exports = {
    name: 'sortlines',
    alias: [],
    category: 'Utility',
    desc: 'Sort lines alphabetically.',
    usage: '.sortlines [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = input.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n');
            return reply(result);
        } catch (error) {
            console.error('[SORTLINES ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
