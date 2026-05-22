const { pluginsDB } = require('./plugin.js');

module.exports = {
    name: 'plugins',
    alias: ['listplugins', 'pluginlist'],
    desc: 'List all installed external plugins with XDN defense core',
    category: 'owner',
    ownerOnly: true,
    usage: '.plugins',
    reactions: { start: '⚙️', success: '֎' },

    execute: async (sock, m, { reply }) => {
        const entries = Object.entries(pluginsDB);

        if (entries.length === 0) {
            return reply(
`✦ ───── ⋆⋅☆⋅☆⋅⋆ ───── ✦
   ֎ • PLUGINS •
✦ ───── ⋆⋅☆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE* ֎
│ ❏ Status : EMPTY
│ ❏ Count : 0
╰─────────────────────────╯
> Use .plugin <url> to install`
            );
        }

        const list = entries.map(([url, info], i) => {
            const date = new Date(info.installedAt).toLocaleDateString();
            return `│ ❏ ${i + 1}. ${info.name}
│    Category : ${info.category}
│    Installed : ${date}
│    File : ${url.split('/').pop()?.slice(0, 40)}`
        }).join('\n');

        return reply(
`✦ ───── ⋆⋅☆⋅☆⋅⋆ ───── ✦
   ֎ • PLUGINS •
✦ ───── ⋆⋅☆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE* ֎
│ ❏ Status : ACTIVE
│ ❏ Count : ${entries.length}
╰─────────────────────────╯
${list}

> Use .unplugin <name> to remove`
        );
    }
};