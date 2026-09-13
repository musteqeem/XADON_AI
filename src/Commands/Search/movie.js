const axios = require('axios');

module.exports = {
    name: 'movie',
    alias: ['film', 'cinema', 'imdb'],
    desc: 'Search movie details from OMDB',
    category: 'Search',
    usage: '.movie <movie name>',
    reactions: { start: '🎬', success: '✨', error: '❔' },

    execute: async (sock, m, { reply, prefix }) => {
        const movieName = m.body?.split(' ').slice(1).join(' ').trim() || m.message?.text?.split(' ').slice(1).join(' ').trim();

        if (!movieName) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • MOVIE SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏${prefix}movie <name>
│
│ ❏ *EXAMPLES*
│ •${prefix}movie Inception
│ •${prefix}movie The Dark Knight
│
│ ❏ *INFO*
│ • IMDB Movie Database
╰─────────────────────────╯`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });

        try {
            const res = await axios.get('http://www.omdbapi.com/', {
                params: {
                    apikey: '742b2d09',
                    t: movieName,
                    plot: 'full'
                },
                timeout: 15000
            });

            const data = res.data;
            if (data.Response === 'False') {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(`❏ Movie not found: "${movieName}"`);
            }

            const tableData = [
                ['Property', 'Value'],
                ['IMDB Rating', `${data.imdbRating}/10 (${data.imdbVotes} votes)`],
                ['Genre', data.Genre],
                ['Runtime', data.Runtime],
                ['Released', data.Released],
                ['Rated', data.Rated],
                ['Country', data.Country],
                ['Language', data.Language],
                ['', ''],
                ['Director', data.Director],
                ['Writer', data.Writer],
                ['Actors', data.Actors],
                ['', ''],
                ['Awards', data.Awards || 'N/A'],
                ['Box Office', data.BoxOffice || 'N/A'],
                ['Production', data.Production || 'N/A'],
                ['Metascore', data.Metascore || 'N/A'],
                ['Type', data.Type || 'N/A'],
                ['', ''],
                ['Plot', data.Plot || 'No plot available']
            ];

            await sock.sendMessage(m.chat, {
                headerText: `◈ 🎬 ${data.Title} (${data.Year})`,
                contentText: '---',
                title: '◈ Movie Details',
                table: tableData,
                footerText: '⚡ Powered by AI ֎'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[MOVIE ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • MOVIE SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ ${err.message || 'Search failed'}
│
│ ❏ *NOTE*
│ • Try again with a different title
╰─────────────────────────╯`
            );
        }
    }
};