const axios = require('axios');

module.exports = {
    name: 'nameinfo',
    alias: ['name', 'meaning', 'namesake'],
    desc: 'Get name meaning and origin',
    category: 'Search',
    usage: '.nameinfo <name>',
    reactions: { start: '👤', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '👤', key: m.key } });

        const name = args[0]?.trim();

        if (!name) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • NAME INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏${prefix}nameinfo <name>
│
│ ❏ *EXAMPLES*
│ •${prefix}nameinfo John
│ •${prefix}nameinfo Mary
│ •${prefix}nameinfo Muhammad
│
│ ❏ *INFO*
│ • Name origin & popularity
╰─────────────────────────╯`
            );
        }

        try {
            const res = await axios.get(`https://api.nationalize.io?name=${encodeURIComponent(name)}`, {
                timeout: 10000
            });

            const data = res.data;
            const countries = (data.country || []).sort((a, b) => b.probability - a.probability);

            // Also get gender
            let gender = 'N/A';
            try {
                const genderRes = await axios.get(`https://api.genderize.io?name=${encodeURIComponent(name)}`, { timeout: 8000 });
                gender = genderRes.data?.gender || 'N/A';
            } catch {}

            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
            const countryList = countries.slice(0, 5).map(c => `${c.country_id} (${(c.probability * 100).toFixed(0)}%)`).join('\n') || 'N/A';

            const tableData = [
                ['Property', 'Value'],
                ['Name', capitalizedName],
                ['Gender', gender],
                ['Top Countries', countryList]
            ];

            await sock.sendMessage(m.chat, {
                headerText: `◈ 👤 ${capitalizedName}`,
                contentText: '---',
                title: '◈ Name Analysis',
                table: tableData,
                footerText: '💡 Name origin & popularity • ⚡ Powered by AI ֎'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[NAME ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • NAME INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to analyze name
│
│ ❏ *NOTE*
│ • Check spelling and try again
╰─────────────────────────╯`
            );
        }
    }
};