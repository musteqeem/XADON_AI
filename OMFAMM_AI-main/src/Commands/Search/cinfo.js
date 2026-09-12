const axios = require('axios');

module.exports = {
    name: 'countryinfo',
    alias: ['country', 'nation', 'flag'],
    desc: 'Get detailed country information',
    category: 'Search',
    usage: '.countryinfo <country name>',
    reactions: { start: '🌍', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🌍', key: m.key } });

        const country = args.join(' ').trim();
        
        if (!country) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • COUNTRY INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏${prefix}countryinfo <name>
│
│ ❏ *EXAMPLES*
│ •${prefix}countryinfo Nigeria
│ •${prefix}countryinfo Japan
│ •${prefix}countryinfo United States
│
│ ❏ *INFO*
│ • Detailed country data
╰─────────────────────────╯`
            );
        }

        try {
            const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`, {
                timeout: 10000
            });

            const data = res.data?.[0];
            if (!data) throw new Error('Not found');

            const currencies = Object.values(data.currencies || {}).map(c => `${c.name} (${c.symbol || ''})`).join(', ');
            const languages = Object.values(data.languages || {}).join(', ');
            
            const tableData = [
                ['Property', 'Value'],
                ['Country', data.name?.common || 'N/A'],
                ['Official', data.name?.official || 'N/A'],
                ['Capital', data.capital?.[0] || 'N/A'],
                ['Region', data.region || 'N/A'],
                ['Subregion', data.subregion || 'N/A'],
                ['Population', data.population?.toLocaleString() || 'N/A'],
                ['Area', `${data.area?.toLocaleString() || 'N/A'} km²`],
                ['Currency', currencies],
                ['Languages', languages],
                ['Flag', data.flag || 'N/A']
            ];

            await sock.sendMessage(m.chat, {
                headerText: `◈ ${data.flag || '🌍'} ${data.name?.common}`,
                contentText: '---',
                title: '◈ Country Details',
                table: tableData,
                footerText: '⚡ Powered by XADON AI ֎'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • COUNTRY INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Country not found
│
│ ❏ *NOTE*
│ • Check spelling and try again
╰─────────────────────────╯`
            );
        }
    }
};