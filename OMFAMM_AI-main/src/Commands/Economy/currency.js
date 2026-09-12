const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const axios = require('axios');

module.exports = {
    name: 'currency',
    alias: ['convert', 'exchange', 'fxconvert'],
    desc: 'Convert between currencies with live rates',
    category: 'Search',
    usage: '.currency <amount> <from> <to>',
    reactions: { start: '💱', success: '🪙', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const amount = parseFloat(args[0]);
        const from = args[1]?.toUpperCase();
        const to = args[2]?.toUpperCase();

        if (!amount ||!from ||!to) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} CURRENCY*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Command : ${prefix}currency <amount> <from> <to>
╰─────────────────────────╯
╭─֎ *EXAMPLES*
│ ❏ ${prefix}currency 100 USD NGN
│ ❏ ${prefix}currency 50 EUR GBP
│ ❏ ${prefix}currency 1 BTC USD
╰─────────────────────────╯
╭─֎ *POPULAR CODES*
│ ❏ USD, EUR, GBP, NGN, GHS, KES, ZAR, CAD, AUD, JPY
╰─────────────────────────╯

_*💱 Live exchange rates by ${BOT_NAME}*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '💱', key: m.key } });

        try {
            const res = await axios.get(`https://api.frankfurter.app/latest`, {
                params: { amount, from, to },
                timeout: 10000
            });

            const data = res.data;
            const rate = data.rates[to];
            if (!rate) throw new Error('Invalid currency code');
            const result = (amount * rate).toFixed(4);

            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} CURRENCY*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CONVERSION RESULT*
│ ❏ Amount : ${amount} ${from}
│ ❏ Rate : 1 ${from} = ${rate} ${to}
│ ❏ Result : ${result} ${to}
│ ❏ Date : ${data.date}
╰─────────────────────────╯

_*🪙 Live rates powered by Frankfurter API*_
_*💡 ${BOT_NAME} - Your finance assistant*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '🪙', key: m.key } });

        } catch (error) {
            console.error('[CURRENCY ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Invalid currency code or API error. Check your codes*_');
        }
    }
};