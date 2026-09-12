const { translate, formatResult } = require('../Core/✐');

module.exports = {
    name: 'tr',
    alias: ['translate', 'trans'],
    category: 'Tools',
    desc: 'Translate text to any language',
    usage: '.tr <lang> [text] or reply to a message',
    reactions: { start: '🌐', success: '✨', error: '❔' },

    execute: async (sock, m, { reply, args }) => {
        const lang = args[0]?.toLowerCase();

        if (!lang) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • TRANSLATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.tr <lang> [text]
│
│ ❏ *Examples*
│ •.tr en Hello world
│ •.tr fr Bonjour
│ •.tr yo (reply to message)
│
│ ❏ Supports 100+ languages
╰─────────────────────────╯`
            );
        }

        const text = args.slice(1).join(' ') || m.quoted?.text || '';
        if (!text) return reply('✘ No text found. Type after language or reply');

        await sock.sendMessage(m.chat, { react: { text: '🌐', key: m.key } });

        try {
            const { translated, from } = await translate(text, lang);

            await sock.sendMessage(m.chat, {
                headerText: `## ◈ Translation`,
                contentText: '---',
                title: '◈ Result',
                table: [
                    ['From', from],
                    ['To', lang],
                    ['Original', text.length > 200? text.slice(0, 197) + '...' : text],
                    ['Translated', translated]
                ],
                footerText: '💡 Set default:.settrd <lang> | Use:.trd'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[TR ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(`✘ Translation failed: ${err.message}`);
        }
    }
};