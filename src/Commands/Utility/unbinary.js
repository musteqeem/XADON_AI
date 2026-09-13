const { URL } = require('url');

module.exports = {
    name: 'unbinary',
    alias: [],
    category: 'Utility',
    desc: 'Decode binary bytes into UTF-8 text.',
    usage: '.unbinary [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide binary bytes, e.g. 01001000 01101001.');
            if (!/^(?:[01]{8})(?:\s+[01]{8})*$/.test(input)) return reply('❌ Use 8-bit binary bytes separated by spaces.');
            const result = Buffer.from(input.split(/\s+/).map(bits => parseInt(bits, 2))).toString('utf8');
            return reply(`🔤 Text:

${result}`);
        } catch (error) {
            console.error('[UNBINARY ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
