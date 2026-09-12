const fetch = require('node-fetch');
const FREESOUND_TOKEN = 'pQzBeAuNetmItgy6kVyuIO53bCJuYiNp1Q5sbhLe';

module.exports = {
    name: 'sound',
    alias: ['sfx', 'soundsearch'],
    desc: 'Search and send sound previews from Freesound',
    category: 'Search',
    usage: '.sound <search term>',
    reactions: { start: '🔊', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, quoted }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔊', key: m.key } });

        const query = args.join(' ') || quoted?.text;
        if (!query) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • SOUND SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.sound <search term>
│
│ ❏ *EXAMPLES*
│ •.sound rain
│ •.sound notification
│ •.sound drum
╰─────────────────────────╯`
            );
        }

        await sock.sendMessage(m.chat, {
            react: { text: '⏳', key: m.key }
        }).catch(() => {});

        try {
            const searchUrl = `https://freesound.org/apiv2/search/?query=${encodeURIComponent(query)}&fields=id,name,previews&token=${FREESOUND_TOKEN}`;
            const res = await fetch(searchUrl);

            if (!res.ok) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • SOUND SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *API ERROR*
│ ❏ Status: ${res.status}
│
│ ❏ *NOTE*
│ • Please try again later
╰─────────────────────────╯`
                );
            }

            const data = await res.json();
            const results = data.results || [];

            if (results.length === 0) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • SOUND SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ No sounds found for "${query}"
│
│ ❏ *TIP*
│ • Try a different keyword
╰─────────────────────────╯`
                );
            }

            const sound = results[0];
            const previewUrl = sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'];

            if (!previewUrl) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply('❏ No playable preview found');
            }

            const audioRes = await fetch(previewUrl);
            if (!audioRes.ok) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply('❏ Failed to fetch preview');
            }

            const buffer = Buffer.from(await audioRes.arrayBuffer());

            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: sound.name + '.mp3'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[SOUND ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply('_*❏ Failed to search/send sound*_');
        }
    }
};