module.exports = {
    name: 'callme',
    alias: ['myphone', 'ringme'],
    desc: 'Share a call button with your WhatsApp number',
    category: 'Utils',
    usage: '.callme <text>',
    reactions: { start: '📞', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const displayText = args.join(' ').trim() || 'Call Me ✦';

        const senderJid = m.sender;
        let phoneNumber = senderJid.split('@')[0].replace(/[^0-9]/g, '');


        try {
            await sock.sendMessage(m.chat, {
                text: `☞ @${m.sender.split('@')[0]}\n◈ Call my line`,
                mentions: [m.sender],
                nativeFlow: [{
                    text: `${displayText}`,
                    call: phoneNumber
                }]
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '🥏', key: m.key } });

        } catch (error) {
            console.error('[CALLME ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });

            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • CALL BUTTON •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CALL ME*
│ ❏ Number : ${phoneNumber}
│ ❏ Label : ${displayText}
│ ❏ Status : Tap to call
╰─────────────────────────╯`
            );
        }
    }
};