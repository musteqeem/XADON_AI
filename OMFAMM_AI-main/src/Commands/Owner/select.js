// File: src/Commands/Interactive/select.js
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'select',
    alias: ['listmsg', 'listmessage'],
    desc: 'Send a selectable list message',
    category: 'Interactive',
    groupOnly: false,
    adminOnly: false,
    usage: '.select | Title | Desc | Button | Section | Option | ID | Option | ID...',

    execute: async (sock, m, { text, reply, prefix }) => {
        try {
            const chat = m.chat;

            // Select only works in private chat
            if (!chat.endsWith('@s.whatsapp.net') &&!chat.endsWith('@lid')) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SELECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ This feature only works in private chat
│ ❏ Not available in groups
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
                );
            }

            // Parse: title | description | buttonText | sectionTitle | option1 | id1 | option2 | id2...
            const parts = text.split('|').map(p => p.trim());

            if (!text || parts.length < 6) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SELECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}select | Title | Description | Button Text | Section Title | Option | ID | Option | ID...
│
╭─֎ *EXAMPLE*
│ ❏ ${prefix}select | 👋 Menu | Choose an option | 📋 Tap here | 🚀 Main Menu | ✨ AI Tools | #ai | 🔍 Search | #search | 🎮 Games | #games
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
                );
            }

            const title = parts[0];
            const description = parts[1];
            const buttonText = parts[2];
            const sectionTitle = parts[3];

            // Build rows array - unlimited options
            const rows = [];
            for (let i = 4; i < parts.length; i += 2) {
                if (parts[i] && parts[i + 1]) {
                    rows.push({
                        title: parts[i],
                        description: '',
                        rowId: parts[i + 1]
                    });
                }
            }

            if (rows.length === 0) {
                return reply(`✘ Please provide at least one option with an ID`);
            }

            await sock.sendMessage(chat, {
                text: description,
                footer: BOT_NAME,
                buttonText: buttonText,
                title: title,
                sections: [{
                    title: sectionTitle,
                    rows: rows
                }]
            });

            return reply(`✓ Select list sent with ${rows.length} options`);

        } catch (err) {
            console.error(`[${BOT_NAME} SELECT ERROR]`, err.message);

            if (err.message?.includes('rows')) {
                return reply(`✘ WhatsApp has a limit on number of rows. Try with fewer options`);
            } else {
                return reply(`✘ Failed: ${err.message}`);
            }
        }
    }
};