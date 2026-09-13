module.exports = {
    name: 'join',
    alias: ['entry', 'joingc'],
    category: 'Owner',
    desc: 'Join a group via invite link',
    ownerOnly: true,
    reactions: { start: '👣', success: '🫂', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '👣', key: m.key } });

        // Collect text from args or quoted message
        const raw = args.join(' ').trim() ||
                    m.quoted?.text?.trim() ||
                    m.quoted?.caption?.trim() || '';

        // Extract invite code cleanly from any WhatsApp link format
        const match = raw.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);

        if (!match) {
            return reply(
`ᄒ⁠ᴥ⁠ᄒ⁠ *JOIN SYSTEM*

_*✘ No valid WhatsApp group link found*_

✦ Usage:
❏◦.join https://chat.whatsapp.com/XXX
_*Reply to a message containing the link*_`
            );
        }

        const code = match[1];

        try {
            await reply(`ಠ_ಠ *JOIN SYSTEM*\n\n_*✪ Joining group...*_`);

            const groupId = await sock.groupAcceptInvite(code);

            // Fetch group metadata
            let groupInfo = null;
            try {
                groupInfo = await sock.groupMetadata(groupId);
            } catch (metaErr) {
                console.error('[METADATA FETCH ERROR]', metaErr.message);
            }

            await sock.sendMessage(m.chat, { react: { text: '🫂', key: m.key } });

            // Build success message
            let successMsg = `亗 *JOIN SUCCESS*\n\n`;

            if (groupInfo) {
                const memberCount = groupInfo.participants?.length || 'N/A';
                const description = groupInfo.desc || 'No description';

                successMsg +=
`ಥ⁠‿⁠ಥ Group: *${groupInfo.subject || 'Unknown'}*
✦彡 Members: ${memberCount}
✦㉨⁠ Group ID: ${groupId || 'N/A'}

𓄄 *Description:*
${description}`;
            } else {
                successMsg +=
`_*✦ Joined successfully*_
❏◦ Group ID: ${groupId || 'N/A'}

_*✘ Could not fetch group details*_`;
            }

            await reply(successMsg);

        } catch (err) {
            console.error('[JOIN ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            const msg = err.toString();
            let reason =
                msg.includes('401')? 'Not authorized to join this group' :
                msg.includes('404')? 'Invalid or revoked link' :
                msg.includes('408')? 'Request timed out — try again' :
                msg.includes('409')? 'Already a member of this group' :
                msg.includes('410')? 'Invite link has expired' :
                msg.includes('500')? 'WhatsApp server error — try again later' :
                err.message || 'Unknown error';

            reply(
`𓉤 *JOIN FAILED*

✘ ${reason}

_Code used: ${code}_`
            );
        }
    }
};