const { URL } = require('url');

module.exports = {
    name: 'unhex',
    alias: [],
    category: 'Utility',
    desc: 'Decode hexadecimal into UTF-8 text.',
    usage: '.unhex [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide hexadecimal text.');
            const compact = input.replace(/\s+/g, '');
            if (!/^(?:[0-9a-f]{2})+$/i.test(compact)) return reply('❌ Hex must contain an even number of valid characters.');
            return reply(`🔤 Text:

${Buffer.from(compact, 'hex').toString('utf8')}`);
        } catch (error) {
            console.error('[UNHEX ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
