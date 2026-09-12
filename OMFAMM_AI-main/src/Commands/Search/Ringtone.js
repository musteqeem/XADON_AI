const axios = require('axios');
const FREESOUND_TOKEN = 'pQzBeAuNetmItgy6kVyuIO53bCJuYiNp1Q5sbhLe';

module.exports = {
    name: 'ringtone',
    alias: ['ring', 'tones'],
    desc: 'Search and send ringtone previews',
    category: 'Search',
    usage: '.ringtone <name>',
    reactions: { start: '🔔', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, quoted }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔔', key: m.key } });

        const rawQuery = (args.join(' ').trim() || quoted?.text || quoted?.body || '').trim();
        if (!rawQuery) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • RINGTONE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.ringtone <name>
│
│ ❏ *EXAMPLE*
│ •.ringtone iphone
╰─────────────────────────╯`
            );
        }

        await reply(`❏ Searching: ${rawQuery}...`);

        try {
            let results = [];
            // Strategy 1: search with "ringtone" keyword + duration filter
            const query1 = `ringtone ${rawQuery}`;
            const url1 = `https://freesound.org/apiv2/search/?query=${encodeURIComponent(query1)}&filter=duration:[0.0%20TO%2015.0]&fields=id,name,previews,duration&token=${FREESOUND_TOKEN}`;
            const { data: data1 } = await axios.get(url1, { timeout: 10000 });
            if (data1.results?.length) results = data1.results;

            // Strategy 2: if nothing, try without duration filter
            if (!results.length) {
                const url2 = `https://freesound.org/apiv2/search/?query=${encodeURIComponent(query1)}&fields=id,name,previews,duration&token=${FREESOUND_TOKEN}`;
                const { data: data2 } = await axios.get(url2, { timeout: 10000 });
                if (data2.results?.length) results = data2.results;
            }

            // Strategy 3: just the raw query
            if (!results.length) {
                const url3 = `https://freesound.org/apiv2/search/?query=${encodeURIComponent(rawQuery)}&filter=duration:[0.0%20TO%2015.0]&fields=id,name,previews,duration&token=${FREESOUND_TOKEN}`;
                const { data: data3 } = await axios.get(url3, { timeout: 10000 });
                if (data3.results?.length) results = data3.results;
            }

            // Strategy 4: raw query without duration filter
            if (!results.length) {
                const url4 = `https://freesound.org/apiv2/search/?query=${encodeURIComponent(rawQuery)}&fields=id,name,previews,duration&token=${FREESOUND_TOKEN}`;
                const { data: data4 } = await axios.get(url4, { timeout: 10000 });
                if (data4.results?.length) results = data4.results;
            }

            if (!results.length) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • RINGTONE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ No matching sounds found
│
│ ❏ *TIP*
│ • Try a different keyword
╰─────────────────────────╯`
                );
            }

            // Prefer shorter sounds for ringtones
            const shortResults = results.filter(r => r.duration <= 15);
            const finalResults = shortResults.length? shortResults : results;

            // Pick the first one with a valid preview
            let previewUrl = null, name = '';
            for (const r of finalResults) {
                const mp3 = r.previews?.['preview-hq-mp3'] || r.previews?.['preview-lq-mp3'];
                if (mp3) { previewUrl = mp3; name = r.name; break; }
            }

            if (!previewUrl) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(`❏ No playable preview found`);
            }

            const response = await axios.get(previewUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: name.replace(/[^a-zA-Z0-9]/g, '_') + '.mp3'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[RINGTONE ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • RINGTONE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to fetch ringtone
│
│ ❏ *DETAIL*
│ • ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};