const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const activePins = new Map();
const confirmations = new Map();

module.exports = {
    name: "group",
    alias: ['gc', 'groupadmin', 'gp', 'groupsettings'],
    desc: 'Complete group administration panel',
    category: "Group",
    usage: ".group <subcommand>",
    examples: [
        ".group open - open group",
        ".group promote @user - promote",
        ".group pin 24hr - pin message",
        ".group tagall - tag everyone"
    ],
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '👑', success: '✅', error: '✘' },

    execute: async (sock, m, { args, reply, prefix, isGroup, isAdmin, isBotAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '👑', key: m.key } });

        if (!isGroup) return reply(`✘ _This command only works in groups_`);
        if (!isAdmin) return reply(`✘ _Only group admins can use this_`);

        const sub = args[0]?.toLowerCase();
        const metadata = await sock.groupMetadata(m.chat);
        const participants = metadata.participants;
        const botId = sock.user.id;

        if (!sub) return showMenu(sock, m, reply, prefix);

        try {
            // ============= SETTINGS =============
            if (sub === 'open') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                await sock.groupSettingUpdate(m.chat, 'not_announcement');
                return success(reply, 'Group opened. Everyone can send messages');
            }

            if (sub === 'close') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                await sock.groupSettingUpdate(m.chat, 'announcement');
                return success(reply, 'Group closed. Only admins can send messages');
            }

            if (sub === 'name') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const name = args.slice(1).join(' ');
                if (!name) return reply(`✘ _Usage: ${prefix}group name <new name>_`);
                await sock.groupUpdateSubject(m.chat, name);
                return success(reply, `Group name updated to: ${name}`);
            }

            if (sub === 'desc') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const desc = args.slice(1).join(' ');
                await sock.groupUpdateDescription(m.chat, desc);
                return success(reply, 'Group description updated');
            }

            // ============= MEMBERS =============
            if (sub === 'add') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const number = args[1];
                if (!number) return reply(`✘ _Usage: ${prefix}group add 234xxx_`);
                const jid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await sock.groupParticipantsUpdate(m.chat, [jid], 'add');
                return success(reply, 'Member added');
            }

            if (sub === 'kick') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const target = m.mentionedJid[0] || m.quoted?.sender;
                if (!target) return reply(`✘ _Tag or reply to a user_`);
                await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
                return success(reply, 'Member kicked');
            }

            if (sub === 'promote') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const target = m.mentionedJid[0] || m.quoted?.sender;
                if (!target) return reply(`✘ _Tag or reply to a user_`);
                await sock.groupParticipantsUpdate(m.chat, [target], 'promote');
                return success(reply, 'Member promoted to admin');
            }

            if (sub === 'demote') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const target = m.mentionedJid[0] || m.quoted?.sender;
                if (!target) return reply(`✘ _Tag or reply to a user_`);
                await sock.groupParticipantsUpdate(m.chat, [target], 'demote');
                return success(reply, 'Admin demoted');
            }

            // ============= UTILS =============
            if (sub === 'tagall') {
                const members = participants.map(u => u.id);
                const text = `👑 *${BOT_NAME} TAGALL*\n\n${args.slice(1).join(' ') || 'Attention everyone!'}`;
                await sock.sendMessage(m.chat, { text, mentions: members });
                return await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            }

            if (sub === 'hidetag') {
                const members = participants.map(u => u.id);
                const text = args.slice(1).join(' ') || '👑';
                await sock.sendMessage(m.chat, { text, mentions: members });
                return await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            }

            if (sub === 'link') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const code = await sock.groupInviteCode(m.chat);
                return reply(`🔗 _Group Link:_\nhttps://chat.whatsapp.com/${code}`);
            }

            if (sub === 'info') {
                const admins = participants.filter(p => p.admin).length;
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GROUP INFO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DETAILS*
│ ❏ Name: ${metadata.subject}
│ ❏ Members: ${participants.length}
│ ❏ Admins: ${admins}
│ ❏ Desc: ${metadata.desc || 'None'}
╰─────────────────────────╯`
                );
            }

            // ============= MODERATION =============
            if (sub === 'pin') {
                if (!m.quoted) return reply(`✘ _Reply to a message to pin_`);
                const time = args[1]?.toLowerCase();
                const times = { '24hr': 86400, '7d': 604800, '30d': 2592000 };
                if (!times[time]) return reply(`✘ _Use: 24hr | 7d | 30d_`);

                await sock.sendMessage(m.chat, { pin: m.quoted.key, type: 1, time: times[time] });
                const pinId = `${m.chat}-${m.quoted.key.id}`;
                activePins.set(pinId, { expires: Date.now() + times[time] * 1000 });

                setTimeout(async () => {
                    await sock.sendMessage(m.chat, { pin: m.quoted.key, type: 1, time: 0 });
                    activePins.delete(pinId);
                }, times[time] * 1000);

                return success(reply, `Message pinned for ${time}`);
            }

            if (sub === 'approve') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const requests = await sock.groupRequestParticipantsList(m.chat);
                if (!requests || requests.length === 0) return reply(`✘ _No pending requests_`);
                const jids = requests.map(r => r.jid);
                await sock.groupRequestParticipantsUpdate(m.chat, jids, 'approve');
                return success(reply, `${jids.length} members approved`);
            }

            if (sub === 'reject') {
                if (!isBotAdmin) return reply(`✘ _Bot must be admin_`);
                const requests = await sock.groupRequestParticipantsList(m.chat);
                if (!requests || requests.length === 0) return reply(`✘ _No pending requests_`);
                const jids = requests.map(r => r.jid);
                await sock.groupRequestParticipantsUpdate(m.chat, jids, 'reject');
                return success(reply, `${jids.length} requests rejected`);
            }

            // ============= DANGEROUS =============
            if (sub === 'delgc' || sub === 'nuke') {
                return handleDelgc(sock, m, reply, prefix, chatId);
            }

        } catch (err) {
            console.error(`[${BOT_NAME} GROUP ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Error: ${err.message}_`);
        }
    }
};

function showMenu(sock, m, reply, prefix) {
    return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GROUP PANEL*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

╭─֎ *SETTINGS*
│ ❏ ${prefix}group open - Open group
│ ❏ ${prefix}group close - Close group
│ ❏ ${prefix}group name <text> - Set name
│ ❏ ${prefix}group desc <text> - Set desc
╰─────────────────────────╯

╭─֎ *MEMBERS*
│ ❏ ${prefix}group add <number> - Add
│ ❏ ${prefix}group kick @user - Kick
│ ❏ ${prefix}group promote @user - Promote
│ ❏ ${prefix}group demote @user - Demote
╰─────────────────────────╯

╭─֎ *MODERATION*
│ ❏ ${prefix}group pin <24hr|7d|30d> - Pin
│ ❏ ${prefix}group approve - Approve all
│ ❏ ${prefix}group reject - Reject all
╰─────────────────────────╯

╭─֎ *UTILS*
│ ❏ ${prefix}group tagall <msg> - Tag all
│ ❏ ${prefix}group hidetag <msg> - Hidden tag
│ ❏ ${prefix}group link - Group link
│ ❏ ${prefix}group info - Group info
╰─────────────────────────╯

╭─֎ *DANGEROUS*
│ ❏ ${prefix}group delgc - Delete group
╰─────────────────────────╯`
    );
}

function success(reply, msg) {
    return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *SUCCESS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎
│ ❏ ${msg}
╰─────────────────────────╯`
    );
}

async function handleDelgc(sock, m, reply, prefix, chatId) {
    if (confirmations.has(chatId)) {
        if (m.text?.toLowerCase() === 'yes') {
            clearTimeout(confirmations.get(chatId));
            confirmations.delete(chatId);
        } else {
            clearTimeout(confirmations.get(chatId));
            confirmations.delete(chatId);
            return reply(`✘ _Cancelled_`);
        }
    } else {
        confirmations.set(chatId, setTimeout(() => confirmations.delete(chatId), 10000));
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *DANGER: DELETE GROUP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *WARNING*
│ ❏ This will kick EVERYONE and leave
│ ❏ Type: yes within 10s to confirm
╰─────────────────────────╯`
        );
    }

    const metadata = await sock.groupMetadata(chatId);
    const toRemove = metadata.participants.filter(p => p.id!== sock.user.id).map(p => p.id);
    if (toRemove.length > 0) await sock.groupParticipantsUpdate(chatId, toRemove, 'remove');
    await sock.groupLeave(chatId);
}