const { emojiCmds, saveEmojiCmds } = require('./setemoji.js');

module.exports = {
    name: 'delemoji',
    alias: ['unbindemoji', 'delemojicmd'],
    description: 'Delete an emoji command binding',
    category: 'owner',
    usage: '.delemoji <emoji>\n.reply to emoji then .delemoji',
    owner: true,

    execute: async (sock, m, { args, reply, prefix }) => {

        try {

            // 🗑️ React: processing
            await sock.sendMessage(m.chat, {
                react: { text: '🗑️', key: m.key }
            });

            let emoji;

            // 📌 quoted message support
            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const quotedText =
                quotedMsg?.conversation ||
                quotedMsg?.extendedTextMessage?.text ||
                '';

            // ─────────────────────────────
            // MODE 1: reply method
            // ─────────────────────────────
            if (quotedText && !args[0]) {
                emoji = quotedText.trim();
            }

            // ─────────────────────────────
            // MODE 2: direct method
            // ─────────────────────────────
            else if (args[0]) {
                emoji = args[0].trim();
            }

            // ❌ no input
            else {

                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • DELEMOJI*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ No emoji provided

📌 Methods:
1️⃣ ${prefix}delemoji 😂
2️⃣ Reply emoji → ${prefix}delemoji

💡 Example:
${prefix}delemoji 🔥

> ֎`);
            }

            // ❌ check existence
            if (!emojiCmds[emoji]) {

                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • DELEMOJI*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ No binding found

🎭 Emoji: ${emoji}

💡 Use ${prefix}listemoji

> ֎`);
            }

            const oldCmd = emojiCmds[emoji];

            // 🧹 delete binding
            delete emojiCmds[emoji];
            saveEmojiCmds();

            // ✨ success react
            await sock.sendMessage(m.chat, {
                react: { text: '✨', key: m.key }
            });

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • DELEMOJI*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

✅ Deleted successfully

🎭 Emoji: ${emoji}
⚡ Command: ${prefix}${oldCmd}

🔄 Database updated

> ֎`);

        } catch (err) {

            console.error('[DELEMOJI ERROR]', err);

            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • ERROR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ Failed to delete emoji binding

📛 Error:
${err.message || 'Unknown error'}

> ֎`);
        }
    }
};