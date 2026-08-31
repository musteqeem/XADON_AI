module.exports = {
    name: 'links',
    alias: ['resources'],
    desc: 'Display all XADON AI important links',
    category: 'Info',
    usage: '.links',
    reactions: { start: '🔗', success: '✨', error: '❔' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });

        try {
            await sock.sendMessage(m.chat, {
                headerText: `## ◈ XADON AI LINKS`,
                contentText: '---',
                title: '◈ Important Resources',
                table: [
                    ['Resource', 'Link'],
                    ['🌐 Website', 'https://web.musteqeem.link'],
                    ['📦 Deploy Script', 'https://xadon.vercel.app'],
                    ['📱 WhatsApp Channel', 'https://whatsapp.com/channel/0029Vb6pe77K0IBn48HLKb38'],
                    ['👥 Group', 'https://chat.whatsapp.com/Besbj8VIle1GwxKKZv1lax'],
                    ['📺 YouTube', 'https://youtube.com/@musteqeem'],
                    ['🖥️ Free Panel', 'https://leonodes.xyz/login?ref=6238a049'],
                    ['💬 Discord', 'https://discord.com'],
                    ['📖 GitHub', 'https://github.com/musteqeem/XADON_AI']
                ],
                footerText: '⚡ Powered by XADON AI V2 ֎'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[LINKS ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • XADON AI LINKS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *IMPORTANT LINKS*
│ ❏ Website : https://web.musteqeem.link
│ ❏ GitHub : https://github.com/musteqeem/XADON_AI
│ ❏ YouTube : https://youtube.com/@musteqeem
╰─────────────────────────╯`
            );
        }
    }
};