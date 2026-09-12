const axios = require('axios');

module.exports = {
    name: 'npminfo',
    alias: ['package', 'npmjs'],
    desc: 'Get NPM package information',
    category: 'Search',
    usage: '.npminfo <package-name>',
    reactions: { start: '📦', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '📦', key: m.key } });

        const pkg = args[0]?.trim();

        if (!pkg) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • NPM INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏${prefix}npminfo <package>
│
│ ❏ *EXAMPLES*
│ •${prefix}npminfo axios
│ •${prefix}npminfo react
│ •${prefix}npminfo @musteqeem/baileys
│
│ ❏ *INFO*
│ • NPM Registry Info
╰─────────────────────────╯`
            );
        }

        await reply(`❏ Fetching: ${pkg}...`);

        try {
            // Try with @ prefix for scoped packages
            const encodedPkg = pkg.startsWith('@')? pkg.replace('/', '%2F') : pkg;

            const res = await axios.get(`https://registry.npmjs.org/${encodedPkg}`, {
                timeout: 10000,
                headers: { 'Accept': 'application/json' }
            });

            const data = res.data;

            // Get latest version
            const latestVersion = data['dist-tags']?.latest || Object.keys(data.versions || {}).pop();
            const latest = data.versions?.[latestVersion] || {};

            // Format data
            const name = data._id || data.name || pkg;
            const description = data.description || latest.description || 'No description';
            const version = latestVersion || 'N/A';
            const license = latest.license || data.license || 'N/A';
            const author = data.author?.name || latest.author?.name || 'N/A';
            const keywords = (latest.keywords || data.keywords || []).slice(0, 5).join(', ') || 'None';
            const homepage = data.homepage || latest.homepage || 'N/A';
            const repository = data.repository?.url || latest.repository?.url || 'N/A';

            // Get download count
            let downloads = 'N/A';
            try {
                const dlRes = await axios.get(`https://api.npmjs.org/downloads/point/last-week/${encodedPkg}`, { timeout: 8000 });
                downloads = dlRes.data?.downloads?.toLocaleString() || 'N/A';
            } catch {}

            const tableData = [
                ['Property', 'Value'],
                ['Package', name],
                ['Description', description.length > 100? description.slice(0, 97) + '...' : description],
                ['Version', `v${version}`],
                ['Weekly Downloads', downloads],
                ['License', license],
                ['Author', author],
                ['Keywords', keywords],
                ['Homepage', homepage.length > 50? homepage.slice(0, 47) + '...' : homepage],
                ['Repository', repository.length > 50? repository.slice(0, 47) + '...' : repository]
            ];

            await sock.sendMessage(m.chat, {
                headerText: `◈ 📦 ${name}`,
                contentText: '---',
                title: '◈ NPM Package Info',
                table: tableData,
                footerText: `💡 Install: npm i ${name} • ⚡ Powered by AI ֎`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[NPM ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });

            if (error.response?.status === 404) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • NPM INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ Package not found: "${pkg}"
│
│ ❏ *NOTE*
│ • Check spelling and try again
╰─────────────────────────╯`
                );
            } else {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • NPM INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to fetch package info
│
│ ❏ *NOTE*
│ • Please try again later
╰─────────────────────────╯`
                );
            }
        }
    }
};