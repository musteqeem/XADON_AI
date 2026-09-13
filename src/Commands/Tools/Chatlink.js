module.exports = {
    name: 'mylink',
    alias: ['chatlink', 'clink'],
    desc: 'Get your direct WhatsApp chat link',
    category: 'General',

    execute: async (sock, m, { reply }) => {
        try {
            if (m.isGroup) {
                return reply('✘ Use this command in private chat');
            }

            const number = (m.sender || '').split('@')[0];

            if (!number) {
                return reply('✘ Unable to fetch your number');
            }

            const link = `https://wa.me/${number}`;

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • YOUR DM LINK •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DIRECT CHAT*
│ ❏ ${link}
│
│ ❏ Share this link so anyone can chat you directly
╰─────────────────────────╯`
            );
        } catch (e) {
            return reply('✘ Error generating link');
        }
    }
};