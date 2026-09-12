const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const DEFAULT_ICON = 'https://cdn.crysnovax.link/files/1778488189665-4f9a1653-8ebb-47d5-bb79-429c0182e260.jpeg';

module.exports = {
    name: "creategc",
    alias: ['creategroup', 'newgc', 'newgroup', 'makegc'],
    desc: 'Create a new WhatsApp group with icon and invite link',
    category: "Group",
    usage: ".creategc <name> | <members> | <desc>",
    examples: [
        ".creategc XADON Support",
        ".creategc Dev Team | 2348012345678,2348098765432",
        ".creategc CRYSNOVA | | Official support group"
    ],
    reactions: { start: '👑', success: '✅', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '👑', key: m.key } });

        try {
            const input = args.join(' ').trim();
            if (!input) {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CREATE GROUP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}creategc <group name>
│ ❏ ${prefix}creategc <name> | <numbers> | <desc>
╰─────────────────────────╯
╭─֎ *EXAMPLE*
│ ❏ ${prefix}creategc Dev Team | 2348012345678 | Bot support group
╰─────────────────────────╯`
                );
            }

            // Parse: name | members | desc
            const parts = input.split('|').map(p => p.trim());
            const groupName = parts[0];
            const membersRaw = parts[1] || '';
            const groupDesc = parts[2] || `Welcome to ${groupName}`;

            // Parse members
            let participants = [];
            if (membersRaw) {
                participants = membersRaw.split(',').map(n => {
                    const num = n.replace(/[^0-9]/g, '');
                    return num + '@s.whatsapp.net';
                }).filter(Boolean);
            }

            // 1. Create group
            reply(`☘️ _Creating group: ${groupName}..._`);
            const result = await sock.groupCreate(groupName, participants);
            const groupJid = result.id || result.gid;

            // 2. Set description
            try {
                await sock.groupUpdateDescription(groupJid, groupDesc);
            } catch (e) { console.log('[CREATEGC] Desc failed:', e.message); }

            // 3. Set group icon
            try {
                const iconRes = await axios.get(DEFAULT_ICON, { responseType: 'arraybuffer' });
                await sock.updateProfilePicture(groupJid, Buffer.from(iconRes.data));
            } catch (e) { console.log('[CREATEGC] Icon failed:', e.message); }

            // 4. Get invite link
            let inviteLink = null;
            try {
                const inviteCode = await sock.groupInviteCode(groupJid);
                inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            } catch (e) { console.log('[CREATEGC] Invite failed:', e.message); }

            // 5. Get thumbnail
            let thumbnail = null;
            try {
                const thumbRes = await axios.get(DEFAULT_ICON, { responseType: 'arraybuffer' });
                thumbnail = Buffer.from(thumbRes.data);
            } catch {}

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            // 6. Send success with rich preview
            if (inviteLink && thumbnail) {
                await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GROUP CREATED*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

╭─֎ *DETAILS*
│ ❏ Name: ${result.subject}
│ ❏ Members: ${participants.length + 1}
│ ❏ Desc: ${groupDesc}
│ ❏ Link: ${inviteLink}
╰─────────────────────────╯`,
                    contextInfo: {
                        externalAdReply: {
                            title: result.subject,
                            body: groupDesc,
                            thumbnail: thumbnail,
                            sourceUrl: inviteLink,
                            mediaType: 1
                        }
                    }
                }, { quoted: m });
            } else {
                reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GROUP CREATED*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DETAILS*
│ ❏ Name: ${result.subject}
│ ❏ Members: ${participants.length + 1}
│ ❏ Desc: ${groupDesc}
│ ❏ Link: ${inviteLink || 'N/A'}
╰─────────────────────────╯`
                );
            }

        } catch (err) {
            console.error(`[${BOT_NAME} CREATEGC ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CREATE GROUP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to create group
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};