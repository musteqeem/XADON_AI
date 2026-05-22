module.exports = {
    name: 'gclink',
    alias: ['groupinfo','gi'],
    desc: 'Get the group full details group name link and discrimination',
    category: 'Admin',
    usage: '.gclink',

    execute: async (sock, m, { reply }) => {
        if (!m.isGroup) {
            return reply('✘ GROUP ONLY');
        }

        try {
            const code = await sock.groupInviteCode(m.chat);

            if (!code) {
                return reply('✘ Try again later');
            }

            const link = `https://chat.whatsapp.com/${code}`;

            let metadata;
            try {
                metadata = await sock.groupMetadata(m.chat);
            } catch (e) {
                console.error('[LINKGC METADATA]', e?.message || e);
            }

            const groupName = metadata?.subject || 'This Group';
            const desc = metadata?.desc || 'No description set';

            const text = `✦ *GROUP INVITE LINK* ✦\n\n` +
                         `Group: *${groupName}*\n` +
                         `Description: ${desc}\n\n` +
                         `→ ${link}\n\n` +
                         `Tap the link to join directly`;

            await sock.sendMessage(m.chat, { text }, { quoted: m });

        } catch (err) {
            console.error('[LINKGC ERROR]', err?.message || err);

            let msg = '✘ Error\n';

            if (err?.message?.includes('admin') || err?.message?.includes('permission') || err?.message?.includes('not-authorized')) {
                msg += 'Bot must be an admin t֎ get the invite link';
            } else if (err?.message?.includes('revoked') || err?.message?.includes('invalid')) {
                msg += 'Invite link is revoked or invalid - use.resetlink first';
            } else {
                msg += err?.message || 'Unknown error';
            }

            reply(msg);
        }
    }
};