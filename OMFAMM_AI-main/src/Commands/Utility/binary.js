const { URL } = require('url');

module.exports = {
    name: 'binary',
    alias: [],
    category: 'Utility',
    desc: 'Convert text to binary bytes.',
    usage: '.binary [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = [...Buffer.from(input, 'utf8')].map(byte => byte.toString(2).padStart(8, '0')).join(' ');
            return reply(`🔢 Binary:

${result}`);
        } catch (error) {
            console.error('[BINARY ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
