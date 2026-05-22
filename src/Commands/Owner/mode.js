const { setVar } = require('../../Plugin/configManager');

module.exports = {
    name: 'mode',
    alias: [],
    desc: 'Switch bot mode with XDN defense core',
    category: 'Bot',
    ownerOnly: true,
    reactions: { start: '⚙️', success: '֎' },

    execute: async (sock, m, { args, reply, config }) => {
        if (!args[0] ||!['public', 'private'].includes(args[0].toLowerCase())) {
            const current = config.status.public? 'PUBLIC' : 'PRIVATE';
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • BOT MODE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Current Mode : ${current}
│ ❏ Status : ACTIVE
╰─────────────────────────╯

Usage:
֎.mode public → Allow everyone
֎.mode private → Owner + Sudo only

> ֎`
            );
        }

        const mode = args[0].toLowerCase();
        const isPublic = mode === 'public';

        // Update in-memory
        config.status.public = isPublic;

        // Persist to runtime-config.json
        setVar('PUBLIC_MODE', isPublic);

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MODE UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Mode : ${mode.toUpperCase()}
│ ❏ Status : ACTIVE
╰─────────────────────────╯

> ֎`
        );
    }
};