const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const axios = require('axios');

const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

const SIGN_EMOJIS = {
    'aries': '♈', 'taurus': '♉', 'gemini': '♊', 'cancer': '♋',
    'leo': '♌', 'virgo': '♍', 'libra': '♎', 'scorpio': '♏',
    'sagittarius': '♐', 'capricorn': '♑', 'aquarius': '♒', 'pisces': '♓'
};

module.exports = {
    name: 'horoscope',
    alias: ['zodiac', 'starsign', 'astrology'],
    desc: 'Get daily horoscope for any zodiac sign',
    category: 'Fun',
    usage: '.horoscope <sign>',
    reactions: { start: '⭐', success: '🎭', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const sign = args[0]?.toLowerCase();

        if (!sign ||!SIGNS.includes(sign)) {
            const signList = SIGNS.map(s => `${SIGN_EMOJIS[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`).join(' │ ');
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} HOROSCOPE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Command : ${prefix}horoscope <sign>
│ ❏ Example : ${prefix}horoscope leo
╰─────────────────────────╯
╭─֎ *AVAILABLE SIGNS*
│ ❏ ${signList}
╰─────────────────────────╯

_*⭐ Check what the stars say today*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '⭐', key: m.key } });

        try {
            const res = await axios.post('https://aztro.sameerkumar.website', null, {
                params: { sign, day: 'today' },
                timeout: 10000,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const data = res.data;
            const signName = sign.charAt(0).toUpperCase() + sign.slice(1);

            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} HOROSCOPE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *${SIGN_EMOJIS[sign]} ${signName} - ${data.current_date}*
│ ❏ Horoscope : ${data.description}
│ ❏ Mood : ${data.mood}
│ ❏ Compatibility : ${data.compatibility}
│ ❏ Lucky Color : ${data.color}
│ ❏ Lucky Number : ${data.lucky_number}
│ ❏ Lucky Time : ${data.lucky_time}
╰─────────────────────────╯

_*💡 Check tomorrow: ${prefix}horoscope ${sign}*_
_*⭐ Stay magical with ${BOT_NAME}*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });

        } catch (error) {
            console.error('[HOROSCOPE ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to get horoscope. API might be down*_');
        }
    }
};