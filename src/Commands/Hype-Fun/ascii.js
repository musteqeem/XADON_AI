const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const figlet = require('figlet');

module.exports = {
    name: 'ascii',
    alias: ['bigtext', 'banner'],
    desc: 'Convert text into ASCII art',
    category: 'fun',
    usage: '.ascii <text>',
    owner: false,
    reactions: { start: '🎨', success: '🎭', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎨', key: m.key } });

        const text = args.join(' ').trim();
        if (!text) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ASCII*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Command : ${prefix}ascii <text>
│ ❏ Example : ${prefix}ascii XADON
╰─────────────────────────╯

_*🎨 Turn any text into ASCII art*_`
            );
        }

        if (text.length > 20) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply('_*❌ Text too long! Max 20 characters*_');
        }

        figlet(text, function (err, data) {
            if (err) {
                console.error('ASCII Error:', err.message);
                sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ ASCII generation failed*_');
            }

            sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ASCII ART*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
\`\`\`
${data}
\`\`\`

_*💡 Use ${prefix}ascii <text> for more*_`
            }, { quoted: m });

            sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });
        });
    }
};