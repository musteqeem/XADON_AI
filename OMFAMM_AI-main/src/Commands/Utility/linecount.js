const { URL } = require('url');

module.exports = {
    name: 'linecount',
    alias: [],
    category: 'Utility',
    desc: 'Count lines in text.',
    usage: '.linecount [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = String(input ? input.split(/\r?\n/).length : 0);
            return reply(result);
        } catch (error) {
            console.error('[LINECOUNT ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
