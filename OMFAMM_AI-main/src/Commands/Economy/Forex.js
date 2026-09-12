const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const axios = require('axios');

const POPULAR_CURRENCIES = {
    'usd': '🇺🇸 United States Dollar',
    'eur': '🇪🇺 Euro',
    'gbp': '🇬🇧 British Pound',
    'jpy': '🇯🇵 Japanese Yen',
    'cny': '🇨🇳 Chinese Yuan',
    'ngn': '🇳🇬 Nigerian Naira',
    'ghs': '🇬🇭 Ghanaian Cedi',
    'zar': '🇿🇦 South African Rand',
    'kes': '🇰🇪 Kenyan Shilling',
    'aed': '🇦🇪 UAE Dirham',
    'cad': '🇨🇦 Canadian Dollar',
    'aud': '🇦🇺 Australian Dollar',
    'inr': '🇮🇳 Indian Rupee',
    'brl': '🇧🇷 Brazilian Real',
    'chf': '🇨🇭 Swiss Franc'
};

module.exports = {
    name: 'forex',
    alias: ['fx', 'exchange', 'rate', 'currency'],
    desc: '💱 Get live foreign exchange rates',
    category: 'Search',
    usage: '.forex <from> <to> |.forex list',
    reactions: { start: '💱', success: '🪙', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const base = args[0]?.toLowerCase();
        const target = args[1]?.toLowerCase();

        if (!base) {
            const popularList = Object.keys(POPULAR_CURRENCIES).slice(0, 10).map(c => c.toUpperCase()).join(', ');
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} FOREX 💱*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}forex <from> <to>
│ ❏ Command : ${prefix}forex <from>
│ ❏ Command : ${prefix}forex list
╰─────────────────────────╯
╭─֎ *📝 EXAMPLES*
│ ❏ ${prefix}forex usd ngn
│ ❏ ${prefix}forex gbp eur
│ ❏ ${prefix}forex usd
│ ❏ ${prefix}forex list
╰─────────────────────────╯
╭─֎ *🌍 POPULAR CURRENCIES*
│ ❏ ${popularList}
╰─────────────────────────╯

_*💱 Live rates powered by ${BOT_NAME}*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '💱', key: m.key } });

        try {
            // ── LIST CURRENCIES ────────────────────────────────────
            if (base === 'list') {
                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n *֎ • ${BOT_NAME} CURRENCIES 🌍*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *15 POPULAR CURRENCIES*\n`;
                for (const [code, name] of Object.entries(POPULAR_CURRENCIES)) {
                    text += `│ ❏ ${code.toUpperCase()} : ${name}\n`;
                }
                text += `╰─────────────────────────╯\n\n_*💡 Use ${prefix}forex <from> <to> for rates*_`;

                await sock.sendMessage(m.chat, { text }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '🪙', key: m.key } });
                return;
            }

            // ── SINGLE RATE ────────────────────────────────────────
            const res = await axios.get(`https://api.frankfurter.app/latest`, {
                params: {
                    from: base.toUpperCase(),
                   ...(target? { to: target.toUpperCase() } : {})
                },
                timeout: 10000,
                headers: { 'Accept': 'application/json' }
            });

            const data = res.data;
            const rates = data.rates;

            if (!rates ||!Object.keys(rates).length) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(`_*❌ Invalid currency: "${base.toUpperCase()}"*_`);
            }

            // If target specified, show single rate
            if (target) {
                const rate = rates[target.toUpperCase()];
                if (!rate) {
                    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return reply(`_*❌ Invalid target: "${target.toUpperCase()}"*_`);
                }

                const baseName = POPULAR_CURRENCIES[base] || base.toUpperCase();
                const targetName = POPULAR_CURRENCIES[target] || target.toUpperCase();

                await sock.sendMessage(m.chat, {
                    text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} FOREX 💱*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📊 ${base.toUpperCase()} → ${target.toUpperCase()}*
│ ❏ Pair : ${base.toUpperCase()}/${target.toUpperCase()}
│ ❏ Rate : 1 ${base.toUpperCase()} = ${rate} ${target.toUpperCase()}
│ ❏ From : ${baseName}
│ ❏ To : ${targetName}
│ ❏ Date : ${data.date}
╰─────────────────────────╯

_*🪙 Live rates • Powered by Frankfurter API*_
_*💡 ${BOT_NAME} Finance Assistant*_`
                }, { quoted: m });

            } else {
                // Show all rates for base currency
                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n *֎ • ${BOT_NAME} FOREX 💱*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *📊 1 ${base.toUpperCase()} EQUALS*\n`;

                let count = 0;
                for (const [code, rate] of Object.entries(rates)) {
                    if(count >= 14) break;
                    const name = POPULAR_CURRENCIES[code.toLowerCase()] || code;
                    text += `│ ❏ ${code} : ${rate.toFixed(4)} | ${name}\n`;
                    count++;
                }
                text += `╰─────────────────────────╯\n\n_*📅 Date: ${data.date} | SWIPE ⇆*_`;

                await sock.sendMessage(m.chat, { text }, { quoted: m });
            }

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[FOREX ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to fetch rates. API may be down. Try again*_');
        }
    }
};