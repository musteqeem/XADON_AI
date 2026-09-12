const { URL } = require('url');

module.exports = {
    name: 'epoch',
    alias: [],
    category: 'Utility',
    desc: 'Convert the current time to a Unix timestamp.',
    usage: '.epoch [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            return reply(`🕒 Unix timestamp: ${Math.floor(Date.now() / 1000)}`);
        } catch (error) {
            console.error('[EPOCH ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
