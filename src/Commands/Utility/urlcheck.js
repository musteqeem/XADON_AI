const { URL } = require('url');

module.exports = {
    name: 'urlcheck',
    alias: [],
    category: 'Utility',
    desc: 'Inspect a URL safely.',
    usage: '.urlcheck [input]',

    execute: async (sock, m, { args = [], reply }) => {
        try {
            const text = Array.isArray(args) ? args.join(' ').trim() : '';
            const input = text || String(m?.quoted?.text || '').trim();

            if (!input) return reply('❌ Provide a URL.');
            const url = new URL(input);
            if (!/^https?:$/i.test(url.protocol)) return reply('❌ Only HTTP and HTTPS URLs are supported.');
            return reply(`🔗 URL CHECK

Protocol: ${url.protocol}
Host: ${url.host}
Path: ${url.pathname}
Query: ${url.search || '—'}
Full URL: ${url.href}`);
        } catch (error) {
            console.error('[URLCHECK ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
