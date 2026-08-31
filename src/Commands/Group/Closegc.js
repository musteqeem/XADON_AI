const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const confirmations = new Map(); // chatId -> timeout

module.exports = {
    name: "delgc",
    alias: ['deletegc', 'dgc', 'groupdelete', 'kickall', 'nukegc'],
    desc: 'Delete group by kicking everyone and leaving. DANGEROUS',
    category: "Group",
    usage: ".delgc",
    examples: [".delgc - start deletion", "yes - confirm within 10s"],
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '☠️', success: '🗑️', error: '✘' },

    execute: async (sock, m, { reply, prefix, isGroup, isAdmin, isBotAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

        if (!isGroup) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _This command only works in groups_`);
        }

        const chatId = m.chat;

        // Step 1: Handle confirmation
        if (confirmations.has(chatId)) {
            if (m.text?.toLowerCase() === 'yes') {
                clearTimeout(confirmations.get(chatId));
                confirmations.delete(chatId);
            } else {
                clearTimeout(confirmations.get(chatId));
                confirmations.delete(chatId);
                return reply(`✘ _Cancelled. Group deletion aborted_`);
            }
        } else {
            // First call - ask for confirmation
            confirmations.set(chatId, setTimeout(() => {
                confirmations.delete(chatId);
            }, 10000));

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} DELETE GROUP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DANGER*
│ ❏ This will kick EVERYONE and leave
│ ❏ This action CANNOT be undone
╰─────────────────────────╯
╭─֎ *CONFIRM*
│ ❏ Type: ${prefix}delgc
│ ❏ Then reply: yes
│ ❏ You have 10 seconds
╰─────────────────────────╯`
            );
        }

        // Step 2: Proceed with deletion
        try {
            if (!isBotAdmin) {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _Bot must be admin to delete the group_`);
            }

            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants;
            const botId = sock.user.id;

            reply(`✅ _Confirmation received. Starting deletion..._`);

            // Kick all other participants
            const toRemove = participants
                .filter(p => p.id !== botId)
                .map(p => p.id);

            if (toRemove.length > 0) {
                await sock.groupParticipantsUpdate(chatId, toRemove, 'remove');
                reply(`🗑️ _Kicked ${toRemove.length} members..._`);
                await new Promise(r => setTimeout(r, 2000)); // small delay
            }

            // Bot leaves the group
            await sock.groupLeave(chatId);
            console.log(`[${BOT_NAME} DELGC SUCCESS] Left group ${chatId}`);

        } catch (err) {
            console.error(`[${BOT_NAME} DELGC ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });

            let errorMsg = `✘ _Failed to delete group_`;
            if (err?.message?.includes('not-authorized')) {
                errorMsg += `\n\n_Bot is not admin or lacks permission_`;
            } else if (err?.message?.includes('rate-overlimit')) {
                errorMsg += `\n\n_Rate limit. Wait a few minutes_`;
            }
            return reply(errorMsg);
        }
    },

    // Handler for confirmation message
    onMessage: async (sock, m) => {
        const chatId = m.chat;
        if (confirmations.has(chatId) && m.text?.toLowerCase() === 'yes') {
            // Re-trigger command with confirmation
            const cmd = require('./delgc');
            await cmd.execute(sock, m, { reply: (txt) => sock.sendMessage(chatId, { text: txt }, { quoted: m }) });
        }
    }
};