const { getVar } = require('../../Plugin/configManager');

module.exports = {
    name: 'owner',
    alias: ['creator', 'admin'],
    desc: 'Show bot owner contact with XDN defense core',
    category: 'Bot',
    reactions: {
        start: '💬',
        success: '֎'
    },

    execute: async (sock, m, { config: cfg }) => {
        try {
            const botName = process.env.BOT_NAME || getVar('BOT_NAME', cfg?.bot?.name) || 'CRYSNOVA AI';
            const ownerName = process.env.OWNER_NAME || getVar('OWNER_NAME', cfg?.ownerName) || 'CREATOR';
            const ownerRaw = process.env.OWNER_NUMBER || getVar('OWNER_NUMBER', cfg?.owner) || cfg?.owner || '';
            const ownerNumber = ownerRaw.replace(/[^0-9]/g, '').split('@')[0];

            const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD
            `.trim();

            await sock.sendMessage(m.chat, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }]
                }
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • OWNER CONTACT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Bot : ${botName}
│ ❏ Owner : ${ownerName}
│ ❏ Number : +${ownerNumber}
╰─────────────────────────╯

> ֎`
            }, { quoted: m });

        } catch (err) {
            console.log('[XDN OWNER ERROR]', err.message);
            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SYSTEM ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Error : ${err.message || 'Unknown error'}
╰─────────────────────────╯

> ֎`
            }, { quoted: m });
        }
    }
};