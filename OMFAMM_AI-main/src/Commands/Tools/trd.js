const { translate, loadDefaults } = require('../Core/✐');

module.exports = {
    name: 'trd',
    alias: ['trdefault'],
    category: 'Tools',
    desc: 'Translate to your default language',
    usage: '.trd [text] or reply to a message',
    reactions: { start: '🌐', success: '✨', error: '❔' },

    execute: async (sock, m, { reply, args }) => {
        const defaults = loadDefaults();
        const lang = defaults[m.sender];

        if (!lang) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
  • DEFAULT TRANSLATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT SET*
│ ❏ No default language set
│
│ ❏ *Set one*
│ •.settrd <lang>
│ • Example:.settrd en
╰─────────────────────────╯`
            );
        }

        const text = args.join(' ') || m.quoted?.text || '';
        if (!text) return reply('✘ No text found. Reply or type after.trd');

        await sock.sendMessage(m.chat, { react: { text: '🌐', key: m.key } });

        try {
            const { translated, from } = await translate(text, lang);

            await sock.sendMessage(m.chat, {
                headerText: `## ◈ Auto Translation`,
                contentText: '---',
                title: '◈ Result',
                table: [
                    ['From', from],
                    ['To', lang],
                    ['Original', text.length > 200? text.slice(0, 197) + '...' : text],
                    ['Translated', translated]
                ],
                footerText: '💡 Change default:.settrd <lang>'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[TRD ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(`✘ Translation failed: ${err.message}`);
        }
    }
};