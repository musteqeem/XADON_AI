const axios = require('axios');

module.exports = {
    name: 'feloai',
    alias: ['felo', 'felosearch'],
    desc: 'AI-powered search with sources using XADON AI',
    category: 'AI',
    usage: '.feloai <query>',
    reactions: { start: '🔍', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        const query = args.join(' ').trim();
        if (!query) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • FELO AI SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.feloai <query>
│ ❏.felo <query>
│
│ ❏ *EXAMPLE*
│ •.feloai First Bank
│
│ ❏ *INFO*
│ • AI-powered search with sources
╰─────────────────────────╯`
            );
        }

        await reply(`❏ Searching: ${query}`);

        try {
            const res = await axios.get('https://api.zenzxz.my.id/ai/feloai', {
                params: { q: query },
                timeout: 60000
            });

            const response = res.data;
            if (!response?.data) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(`❏ No results found`);
            }

            const result = response.result;
            if (!result?.text) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(`❏ No results found`);
            }

            let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n    ֎ • FELO AI SEARCH •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n`;
            text += `╭─֎ *QUERY*\n│ ❏${query}\n│\n`;

            // Truncate answer if too long
            const answer = result.text.length > 1500 
                ? result.text.substring(0, 1497) + '...' 
                : result.text;

            text += `│ ֎ *ANSWER*\n│ ${answer.replace(/\n/g, '\n│ ')}\n│\n`;

            // Add sources
            if (result.sources && result.sources.length > 0) {
                text += `│ ֎ *SOURCES*\n`;
                const sources = result.sources.slice(0, 5);
                for (const src of sources) {
                    const title = src.title || 'Untitled';
                    text += `│ ❏ ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}\n`;
                }
                if (result.sources.length > 5) {
                    text += `│ ❏ +${result.sources.length - 5} more...\n`;
                }
                text += `│\n`;
            }

            text += `╰─────────────────────────╯\n`;
            text += `_⚡ Powered by XADON AI ֎_`;

            await sock.sendMessage(m.chat, { text }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[FELO ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });

            if (err.code === 'ECONNABORTED') {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • FELO AI SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Request timed out
│
│ ❏ *NOTE*
│ • Try again later
╰─────────────────────────╯`
                );
            }

            if (err.response?.status === 429) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • FELO AI SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Rate limited
│
│ ❏ *NOTE*
│ • Try again later
╰─────────────────────────╯`
                );
            }

            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • FELO AI SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ ${err.message || 'Search failed'}
╰─────────────────────────╯`
            );
        }
    }
};