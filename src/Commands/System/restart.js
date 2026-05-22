module.exports = {
    name: 'restart',
    alias: ['reboot'],
    desc: 'Restart the bot with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '♻️', success: '֎' },

    execute: async (sock, m, { reply }) => {
        await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SYSTEM RESTART •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : SHUTDOWN
│ ❏ Action : REBOOTING
╰─────────────────────────╯

> ֎`
        );
        
        setTimeout(() => process.exit(0), 1500);
    }
};