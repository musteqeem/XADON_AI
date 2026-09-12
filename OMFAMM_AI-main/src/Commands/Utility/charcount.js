const { URL } = require('url');

module.exports = {
    name: 'charcount',
    alias: [],
    category: 'Utility',
    desc: 'Count characters, words and UTF-8 bytes.',
    usage: '.charcount [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide text or reply to a message.');
            const result = `Characters: ${[...input].length}\nWords: ${input ? input.trim().split(/\s+/).filter(Boolean).length : 0}\nUTF-8 bytes: ${Buffer.byteLength(input, 'utf8')}`;
            return reply(result);
        } catch (error) {
            console.error('[CHARCOUNT ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
