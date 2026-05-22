const { emojiCmds } = require('./setemoji.js');

module.exports = {
    name: 'listemoji',
    alias: ['emojilist', 'emojicmds'],
    description: 'List all emoji-to-command bindings',
    category: 'owner',
    owner: true,
    usage: '.listemoji',

    execute: async (sock, m, { reply, prefix }) => {

        try {

            // ⚙️ processing reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⚙️', key: m.key }
            });

            const entries = Object.entries(emojiCmds);

            // ❌ empty list
            if (!entries.length) {

                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • EMOJI LIST*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ No emoji bindings found

💡 Add one using:
${prefix}setemoji 😂 ping

> ֎`);
            }

            // ✨ success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '📜', key: m.key }
            });

            let list = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • EMOJI LIST*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

📊 Total Bindings: ${entries.length}

`;

            for (let i = 0; i < entries.length; i++) {
                const [emoji, command] = entries[i];
                list += `➤ ${i + 1}. ${emoji} → \`${prefix}${command}\`\n`;
            }

            list += `
> ֎`;

            return reply(list);

        } catch (err) {

            console.error('[LISTEMOJI ERROR]', err);

            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • ERROR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ Failed to load emoji list

📛 Error:
${err.message || 'Unknown error'}

> ֎`);
        }
    }
};