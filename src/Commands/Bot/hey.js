module.exports = {
    name: 'xmenu',
    alias: ['help', 'commands', 'cmd'],
    desc: 'Display XDN defense command menu',
    category: 'General',
    ownerOnly: false,
    reactions: { start: '📜', success: '֎' },

    execute: async (sock, m, { reply, commands, prefix }) => {
        // Group commands by category
        const categories = {};
        for (const cmd of commands.values()) {
            if (!cmd.category) continue;
            if (!categories[cmd.category]) categories[cmd.category] = [];
            categories[cmd.category].push(cmd.name);
        }

        let menu = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • XADON DEFENSE MENU •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SYSTEM CORE*
│ ❏ Prefix : ${prefix}
│ ❏ User : ${m.pushName || 'Operator'}
│ ❏ Status : ONLINE
╰─────────────────────────╯
`;

        for (const [cat, cmds] of Object.entries(categories)) {
            menu += `\n╭─֎ *${cat.toUpperCase()}*
│ ❏ ${cmds.join('\n│ ❏ ')}
╰─────────────────────────╯`;
        }

        menu += `\n\nType ${prefix}<command> to execute
Use ${prefix}help <command> for details

> ֎`;

        return reply(menu);
    }
};