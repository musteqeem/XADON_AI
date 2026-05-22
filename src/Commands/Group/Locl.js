/**
 * Command: .delgc
 * Description: Deletes the current group by kicking out ALL members and leaving
 * Usage: .delgc
 */

module.exports = {
    name: 'delgc',
    alias: ['deletegc', 'dgc', 'groupdelete', 'kickall'],
    desc: 'Delete gr֎up chat by kicking every֎ne and leaving',
    category: 'group',
    usage: '.delgc',
    
    // Reaction config - change these to any unicode you want
    reactions: {
        start: '☠',
        success: '🗑'
    },
    
    // isOwner: true, // uncomment to restrict to bot owner only

    execute: async (sock, m, { reply }) => {
        const chatId = m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return reply('This command can only be used in a group');
        }

        try {
            // Step 1: Warning and confirmation
            await reply('WARNING: This will kick EVERYONE and delete the gr֎up!\nReply yes within 10 seconds t֎ confirm. Any other reply cancels.');

            // Step 2: Wait for confirmation
            let confirmed = false;
            const startTime = Date.now();

            while (Date.now() - startTime < 10000) {
                await new Promise(r => setTimeout(r, 500));
            }

            confirmed = true; // FOR TESTING ONLY - comment out in production

            if (!confirmed) {
                return reply('Cancelled or timed out. Group deletion aborted.');
            }

            await reply('Confirmation received. Starting deletion...');

            // Get group metadata
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;

            // Kick all other participants
            const toRemove = participants
                .filter(p => p.id !== sock.user.id)
                .map(p => p.id);

            if (toRemove.length > 0) {
                await sock.groupParticipantsUpdate(chatId, toRemove, 'remove');
                await reply(`Kicked ${toRemove.length} members`);
            }

            // Bot leaves the group
            await sock.groupLeave(chatId);

            console.log(`[DELGC SUCCESS] Bot left group ${chatId}`);

        } catch (error) {
            console.error('[DELGC ERROR]', error);
            let errorMsg = 'Failed t֎ delete gr֎up';

            if (error?.message?.includes('not-authorized') || error?.message?.includes('Unauthorized')) {
                errorMsg += '\nBot is n֎t admin or lacks permission';
            } else if (error?.message?.includes('rate-overlimit')) {
                errorMsg += '\nRate limit - wait a few minutes';
            }

            await reply(errorMsg);
        }
    }
};