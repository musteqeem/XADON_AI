const { getVar, setVar } = require('../../Plugin/configManager');

module.exports = {
    name: 'faketyping',
    alias: ['typing'],
    desc: 'Control fake typing behavior',
    category: 'Owner',
    sudoOnly: true,
    reactions: { start: '⌨️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const current = getVar('FAKE_TYPING', 'cmd');

        if (!args[0]) {
            const status = current === 'all'? 'ALL MESSAGES' :
                          current === 'cmd'? 'COMMANDS ONLY' :
                          'DISABLED';

            const statusIcon = current === 'all' || current === 'cmd'? 'ACTIVE' : 'INACTIVE';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FAKE TYPING STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${statusIcon}
│ ❏ Mode : ${status}
│ ❏ System : ONLINE
╰─────────────────────────╯

Usage:
֎.faketyping on → All messages
֎.faketyping on cmd → Commands only
֎.faketyping off → Disabled`
            );
        }

        const input = args.join(' ').toLowerCase().trim();

        if (input === 'on') {
            setVar('FAKE_TYPING', 'all');
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FAKE TYPING ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ACTIVE
│ ❏ Mode : ALL MESSAGES
│ ❏ Scope : Every message
╰─────────────────────────╯`
            );
        }

        if (input === 'on cmd') {
            setVar('FAKE_TYPING', 'cmd');
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FAKE TYPING ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ACTIVE
│ ❏ Mode : COMMANDS ONLY
│ ❏ Scope : Commands only
╰─────────────────────────╯`
            );
        }

        if (input === 'off') {
            setVar('FAKE_TYPING', false);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FAKE TYPING DISABLED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : INACTIVE
│ ❏ Mode : OFF
│ ❏ Scope : None
╰─────────────────────────╯`
            );
        }

        reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FAKE TYPING ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Invalid argument.

Usage:
֎.faketyping on
֎.faketyping on cmd
֎.faketyping off`
        );
    }
};