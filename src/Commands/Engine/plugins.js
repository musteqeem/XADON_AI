const { pluginsDB } = require('./plugin.js');

module.exports = {
    name: 'plugins',
    alias: ['listplugins', 'pluginlist'],
    desc: 'List all installed external plugins',
    category: 'Owner',
    ownerOnly: true,
    usage: '.plugins',
    reactions: { start: '📦', success: '✨', error: '❔' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '📦', key: m.key } });

        const entries = Object.entries(pluginsDB);

        if (entries.length === 0) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • PLUGINS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *EMPTY*
│ ❏ No external plugins installed
│
│ ❏ *NOTE*
│ • Use .plugin <url> to install
╰─────────────────────────╯`
            );
        }

        const rows = [['#', 'Plugin', 'Category', 'Date']];
        
        entries.forEach(([url, info], i) => {
            const date = new Date(info.installedAt).toLocaleDateString();
            const shortUrl = url.split('/').pop()?.slice(0, 30) || 'file';
            rows.push([
                String(i + 1),
                info.name,
                info.category,
                date
            ]);
        });

        await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        return sock.sendMessage(m.chat, {
            headerText: `## ◈ AI Plugins`,
            contentText: '---',
            title: `◈ Installed Plugins (${entries.length})`,
            table: rows,
            footerText: '💡 Use .unplugin <name> to remove a plugin'
        }, { quoted: m });
    }
};