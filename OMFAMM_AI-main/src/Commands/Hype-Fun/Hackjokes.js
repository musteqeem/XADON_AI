// File: plugins/joke.js
const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const fetch = require('node-fetch');

module.exports = {
    name: 'joke',
    alias: ['jok', 'funjoke', 'randomjoke'],
    desc: 'Fetch a random programming joke',
    category: 'fun',
    usage: '.joke',
    owner: false,
    reactions: { start: '😂', success: '🎭', error: '❌' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '😂', key: m.key } });

        try {
            const res = await fetch('https://v2.jokeapi.dev/joke/Programming?type=single,twopart&blacklistFlags=nsfw,religious,political,racist,sexist,explicit', {
                timeout: 8000
            });
            const data = await res.json();
            
            if (!data || data.error) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Could not fetch joke! Try again*_');
            }

            let jokeText = '';
            if (data.type === 'single') {
                jokeText = data.joke;
            } else {
                jokeText = `${data.setup}\n\n*${data.delivery}*`;
            }

            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} JOKE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *PROGRAMMING JOKE*
│ ❏ ${jokeText.replace(/\n/g, '\n│ ')}
╰─────────────────────────╯

_*😂 Need another? Use ${prefix}joke*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });

        } catch (err) {
            console.error('[JOKE ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to fetch joke. Check your internet connection*_');
        }
    }
};