const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env

module.exports = {
    name: 'joke',
    alias: ['jokes', 'tellmeajoke'],
    desc: 'Get a random joke with category and language support',
    category: 'Fun',
    usage: '.joke [category] [lang]',
    reactions: { start: '🤣', success: '😂', error: '❌' },

    execute: async (sock, m, { reply, args, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🤣', key: m.key } });

        let category = 'Any';
        let lang = 'en';

        // Parse arguments:.joke [category] [lang]
        const validCategories = ['programming', 'misc', 'dark', 'pun', 'spooky', 'christmas'];
        const validLangs = ['en', 'es', 'fr', 'de', 'pt', 'cs', 'fi'];

        if (args[0] && validCategories.includes(args[0].toLowerCase())) {
            category = args[0].toLowerCase();
        }
        if (args[1] && validLangs.includes(args[1].toLowerCase())) {
            lang = args[1].toLowerCase();
        }

        const apiUrl = `https://v2.jokeapi.dev/joke/${category}?lang=${lang}&safe-mode&blacklistFlags=nsfw,religious,political`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ No joke found for that category*_');
            }

            let jokeText = '';
            if (data.type === 'single') {
                jokeText = data.joke;
            } else {
                jokeText = `*${data.setup}*\n\n${data.delivery}`;
            }

            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} JOKE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CATEGORY: ${category.toUpperCase()} | LANG: ${lang.toUpperCase()}*
│ ❏ ${jokeText.replace(/\n/g, '\n│ ')}
╰─────────────────────────╯

_*😂 Use ${prefix}joke [category] [lang] for more*_
_*💡 Categories: programming, misc, dark, pun, spooky, christmas*_
_*💡 Languages: en, es, fr, de, pt, cs, fi*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '😂', key: m.key } });

        } catch (error) {
            console.error('[JOKE ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Why did the API fail? It needed a break!*_');
        }
    }
};