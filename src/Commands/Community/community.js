const fetch = require('node-fetch');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

// small helper for antiban delay
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── ALL COMMUNITY MANAGEMENT COMMANDS ──────────────────────────────────────
module.exports = [
    // ── CREATE COMMUNITY ─────────────────────────────────────────────────
    {
        name: 'cnew',
        alias: ['ccreate', 'ncomm'],
        desc: 'Create a new WhatsApp community',
        category: 'Community',
        ownerOnly: true,
        usage: '.cnew <name> [description]',
        examples: ['.cnew My Community', '.cnew Tech Hub Best place for devs'],
        reactions: { start: '🏘️', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const name = args[0];
            const description = args.slice(1).join(' ') || '';

            if (!name) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CNEW*\n│ ❏ Usage : ${prefix}cnew <name> [description]\n│ ❏ Example : ${prefix}cnew Tech Hub\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '🏘️', key: m.key } });
            await sleep(500);

            try {
                const community = await sock.communityCreate(name, description);
                const inviteCode = community?.inviteCode || community?.code || '';
                const communityLink = inviteCode? `https://chat.whatsapp.com/${inviteCode}` : '';

                let thumbnail = null;
                try {
                    const pp = await sock.profilePictureUrl(m.chat, 'image');
                    thumbnail = await fetch(pp).then(r => r.buffer());
                } catch {}

                if (communityLink) {
                    await sock.sendMessage(m.chat, {
                        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY CREATED*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ Name : ${name}\n│ ❏ Link : ${communityLink}\n╰─────────────────────────╯`,
                        contextInfo: {
                            externalAdReply: {
                                title: name,
                                body: description || `${BOT_NAME} Community Invite`,
                                thumbnail: thumbnail,
                                sourceUrl: communityLink,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: m });
                } else {
                    await reply(`*✧ Success:* _Community created_ ${name}`);
                }

                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });

            } catch (err) {
                console.error('CREATE COMMUNITY ERROR:', err);
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── LEAVE COMMUNITY ─────────────────────────────────────────────────
    {
        name: 'cleave',
        alias: ['cexit', 'lcomm'],
        desc: 'Leave a WhatsApp community',
        category: 'Community',
        ownerOnly: true,
        usage: '.cleave <community_jid>',
        examples: ['.cleave 1234567890@community'],
        reactions: { start: '🚪', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const jid = args[0];
            if (!jid ||!jid.includes('@')) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CLEAVE*\n│ ❏ Usage : ${prefix}cleave <community_jid>\n│ ❏ Example : ${prefix}cleave 1234567890@community\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '🚪', key: m.key } });
            await sleep(300);
            try {
                await sock.communityLeave(jid);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Left community_ ${jid}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── CREATE GROUP INSIDE COMMUNITY ───────────────────────────────────
    {
        name: 'cgroup',
        alias: ['caddg', 'newcgroup'],
        desc: 'Create a new group inside a community',
        category: 'Community',
        ownerOnly: true,
        usage: '.cgroup <community_jid> <group_name>',
        examples: ['.cgroup 1234567890@community Announcements'],
        reactions: { start: '👥', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const communityJid = args[0];
            const groupName = args.slice(1).join(' ');
            if (!communityJid ||!groupName) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CGROUP*\n│ ❏ Usage : ${prefix}cgroup <community_jid> <group_name>\n│ ❏ Example : ${prefix}cgroup 1234567890@community Announcements\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '👥', key: m.key } });
            await sleep(300);
            try {
                const group = await sock.communityCreateGroup(groupName, [], communityJid);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *GROUP CREATED*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ Group Name : ${groupName}\n│ ❏ Group JID : ${group?.jid || 'Created'}\n│ ❏ Community : ${communityJid}\n╰─────────────────────────╯`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE COMMUNITY SUBJECT (NAME) ─────────────────────────────────
    {
        name: 'cname',
        alias: ['cupd', 'csubject'],
        desc: 'Update community name/subject',
        category: 'Community',
        ownerOnly: true,
        usage: '.cname <community_jid> <new_name>',
        examples: ['.cname 1234567890@community Tech Hub New'],
        reactions: { start: '✏️', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const jid = args[0];
            const newName = args.slice(1).join(' ');
            if (!jid ||!newName) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CNAME*\n│ ❏ Usage : ${prefix}cname <community_jid> <new_name>\n│ ❏ Example : ${prefix}cname 1234567890@community Tech Hub\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '✏️', key: m.key } });
            await sleep(300);
            try {
                await sock.communityUpdateSubject(jid, newName);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Community name updated to_ ${newName}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── LINK GROUP TO COMMUNITY ─────────────────────────────────────────
    {
        name: 'clink',
        alias: ['cattach', 'cadd'],
        desc: 'Link an existing group to a community',
        category: 'Community',
        ownerOnly: true,
        usage: '.clink <community_jid> <group_jid>',
        examples: ['.clink 1234567890@community 1234567890-123456@g.us'],
        reactions: { start: '🔗', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const communityJid = args[0];
            const groupJid = args[1];
            if (!communityJid ||!groupJid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CLINK*\n│ ❏ Usage : ${prefix}clink <community_jid> <group_jid>\n│ ❏ Example : ${prefix}clink 1234567890@community 1234567890-123456@g.us\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });
            await sleep(300);
            try {
                await sock.communityLinkGroup(groupJid, communityJid);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Group linked to community_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UNLINK GROUP FROM COMMUNITY ─────────────────────────────────────
    {
        name: 'cunlink',
        alias: ['cdetach', 'cremove'],
        desc: 'Unlink a group from a community',
        category: 'Community',
        ownerOnly: true,
        usage: '.cunlink <community_jid> <group_jid>',
        examples: ['.cunlink 1234567890@community 1234567890-123456@g.us'],
        reactions: { start: '🔓', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const communityJid = args[0];
            const groupJid = args[1];
            if (!communityJid ||!groupJid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CUNLINK*\n│ ❏ Usage : ${prefix}cunlink <community_jid> <group_jid>\n│ ❏ Example : ${prefix}cunlink 1234567890@community 1234567890-123456@g.us\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '🔓', key: m.key } });
            await sleep(300);
            try {
                await sock.communityUnlinkGroup(groupJid, communityJid);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Group unlinked from community_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── FETCH LINKED GROUPS ─────────────────────────────────────────────
    {
        name: 'clists',
        alias: ['cgroups', 'clinked'],
        desc: 'Get all groups linked to a community',
        category: 'Community',
        ownerOnly: true,
        usage: '.clists <community_jid>',
        examples: ['.clists 1234567890@community'],
        reactions: { start: '📋', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const jid = args[0];
            if (!jid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CLISTS*\n│ ❏ Usage : ${prefix}clists <community_jid>\n│ ❏ Example : ${prefix}clists 1234567890@community\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '📋', key: m.key } });
            await sleep(300);
            try {
                const groups = await sock.communityFetchLinkedGroups(jid);
                if (!groups || groups.length === 0) {
                    await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *LINKED GROUPS*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *INFO*\n│ ❏ Status : No groups linked\n╰─────────────────────────╯`);
                }
                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *LINKED GROUPS*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n`;
                groups.forEach((group, i) => {
                    text += `│ ❏ ${i+1}. ${group.subject || group.name || group.jid}\n│ 🆔 ${group.jid}\n`;
                });
                text += `│ ❏ Total : ${groups.length} groups\n╰─────────────────────────╯`;
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(text);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── FETCH ALL PARTICIPATING COMMUNITIES ─────────────────────────────
    {
        name: 'cmy',
        alias: ['clist', 'callc'],
        desc: 'Get all communities you participate in',
        category: 'Community',
        ownerOnly: true,
        usage: '.cmy',
        examples: ['.cmy'],
        reactions: { start: '🏘️', success: '✧', error: '✗' },

        execute: async (sock, m, { prefix, reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🏘️', key: m.key } });
            await sleep(300);
            try {
                const communities = await sock.communityFetchAllParticipating();
                if (!communities || Object.keys(communities).length === 0) {
                    await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *MY COMMUNITIES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *INFO*\n│ ❏ Status : Not in any community\n╰─────────────────────────╯`);
                }
                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *MY COMMUNITIES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n`;
                Object.values(communities).forEach((comm, i) => {
                    text += `│ ❏ ${i+1}. ${comm.subject || comm.name || 'Unnamed'}\n`;
                    text += `│ 🆔 ${comm.jid}\n`;
                    if (comm.size) text += `│ 👥 ${comm.size} members\n`;
                });
                text += `│ ❏ Total : ${Object.keys(communities).length} communities\n╰─────────────────────────╯`;
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(text);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── GET COMMUNITY METADATA ──────────────────────────────────────────
    {
        name: 'cinfo',
        alias: ['cmeta', 'cdata'],
        desc: 'Get detailed information about a community',
        category: 'Community',
        ownerOnly: true,
        usage: '.cinfo <community_jid>',
        examples: ['.cinfo 1234567890@community'],
        reactions: { start: 'ℹ️', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const jid = args[0];
            if (!jid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CINFO*\n│ ❏ Usage : ${prefix}cinfo <community_jid>\n│ ❏ Example : ${prefix}cinfo 1234567890@community\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: 'ℹ️', key: m.key } });
            await sleep(300);
            try {
                const metadata = await sock.communityMetadata(jid);
                if (!metadata) return reply(`*✗ Community not found*`);

                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY INFO*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *DATA*\n`;
                text += `│ ❏ Name : ${metadata.subject || metadata.name || 'N/A'}\n`;
                text += `│ ❏ Description : ${metadata.description || 'N/A'}\n`;
                text += `│ ❏ JID : ${jid}\n`;
                text += `│ ❏ Members : ${metadata.size || metadata.participants?.length || 'N/A'}\n`;
                text += `│ ❏ Owner : ${metadata.owner || 'N/A'}\n`;
                text += `│ ❏ Linked Groups : ${metadata.linkedGroups?.length || '0'}\n`;
                text += `╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}`;

                await sock.sendMessage(m.chat, { text }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });

            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── ADD PARTICIPANT TO COMMUNITY ────────────────────────────────────
    {
        name: 'cadd',
        alias: ['cjoin', 'cadduser'],
        desc: 'Add a participant to a community',
        category: 'Community',
        ownerOnly: true,
        usage: '.cadd <community_jid> <user_jid>',
        examples: ['.cadd 1234567890@community 2347079056039@s.whatsapp.net'],
        reactions: { start: '👤', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const communityJid = args[0];
            const userJid = args[1];
            if (!communityJid ||!userJid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CADD*\n│ ❏ Usage : ${prefix}cadd <community_jid> <user_jid>\n│ ❏ Example : ${prefix}cadd 1234567890@community 2347079056039@s.whatsapp.net\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '👤', key: m.key } });
            await sleep(300);
            try {
                await sock.communityParticipantsUpdate(communityJid, [userJid], 'add');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Added user to community_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── REMOVE PARTICIPANT FROM COMMUNITY ───────────────────────────────
    {
        name: 'ckick',
        alias: ['crem', 'cremuser'],
        desc: 'Remove a participant from a community',
        category: 'Community',
        ownerOnly: true,
        usage: '.ckick <community_jid> <user_jid>',
        examples: ['.ckick 1234567890@community 2347079056039@s.whatsapp.net'],
        reactions: { start: '🚫', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const communityJid = args[0];
            const userJid = args[1];
            if (!communityJid ||!userJid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CKICK*\n│ ❏ Usage : ${prefix}ckick <community_jid> <user_jid>\n│ ❏ Example : ${prefix}ckick 1234567890@community 2347079056039@s.whatsapp.net\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '🚫', key: m.key } });
            await sleep(300);
            try {
                await sock.communityParticipantsUpdate(communityJid, [userJid], 'remove');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Removed user from community_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── PROMOTE TO COMMUNITY ADMIN ──────────────────────────────────────
    {
        name: 'cprom',
        alias: ['cpromote', 'cadmin'],
        desc: 'Promote a user to community admin',
        category: 'Community',
        ownerOnly: true,
        usage: '.cprom <community_jid> <user_jid>',
        examples: ['.cprom 1234567890@community 2347079056039@s.whatsapp.net'],
        reactions: { start: '👑', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const communityJid = args[0];
            const userJid = args[1];
            if (!communityJid ||!userJid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CPROM*\n│ ❏ Usage : ${prefix}cprom <community_jid> <user_jid>\n│ ❏ Example : ${prefix}cprom 1234567890@community 2347079056039@s.whatsapp.net\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '👑', key: m.key } });
            await sleep(300);
            try {
                await sock.communityParticipantsUpdate(communityJid, [userJid], 'promote');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Promoted to community admin_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── DEMOTE FROM COMMUNITY ADMIN ────────────────────────────────────
    {
        name: 'cdem',
        alias: ['cdemote', 'cremadmin'],
        desc: 'Demote a user from community admin',
        category: 'Community',
        ownerOnly: true,
        usage: '.cdem <community_jid> <user_jid>',
        examples: ['.cdem 1234567890@community 2347079056039@s.whatsapp.net'],
        reactions: { start: '⬇️', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const communityJid = args[0];
            const userJid = args[1];
            if (!communityJid ||!userJid) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CDEM*\n│ ❏ Usage : ${prefix}cdem <community_jid> <user_jid>\n│ ❏ Example : ${prefix}cdem 1234567890@community 2347079056039@s.whatsapp.net\n╰─────────────────────────╯`);
            }
            await sock.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });
            await sleep(300);
            try {
                await sock.communityParticipantsUpdate(communityJid, [userJid], 'demote');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Demoted from community admin_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── NEW: COMMUNITY INVITE ───────────────────────────────────────────
    {
        name: 'cinvite',
        alias: ['cinv', 'cgetlink'],
        desc: 'Get community invite link',
        category: 'Community',
        ownerOnly: true,
        usage: '.cinvite <community_jid>',
        examples: ['.cinvite 1234567890@community'],
        reactions: { start: '🔗', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const jid = args[0];
            if (!jid) return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CINVITE*\n│ ❏ Usage : ${prefix}cinvite <community_jid>\n╰─────────────────────────╯`);
            await sleep(300);
            try {
                const code = await sock.communityInviteCode(jid);
                const link = `https://chat.whatsapp.com/${code}`;
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY LINK*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *LINK*\n│ ❏ ${link}\n╰─────────────────────────╯`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── NEW: COMMUNITY DESCRIPTION ──────────────────────────────────────
    {
        name: 'cdesc',
        alias: ['cupddesc'],
        desc: 'Update community description',
        category: 'Community',
        ownerOnly: true,
        usage: '.cdesc <community_jid> <description>',
        examples: ['.cdesc 1234567890@community Welcome to Tech Hub'],
        reactions: { start: '📝', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const jid = args[0];
            const desc = args.slice(1).join(' ');
            if (!jid ||!desc) return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CDESC*\n│ ❏ Usage : ${prefix}cdesc <community_jid> <description>\n╰─────────────────────────╯`);
            await sleep(300);
            try {
                await sock.communityUpdateDescription(jid, desc);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Community description updated_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── NEW: COMMUNITY SETTINGS ─────────────────────────────────────────
    {
        name: 'cset',
        alias: ['csetting'],
        desc: 'Update community settings',
        category: 'Community',
        ownerOnly: true,
        usage: '.cset <community_jid> <open/close>',
        examples: ['.cset 1234567890@community close'],
        reactions: { start: '⚙️', success: '✧', error: '✗' },

        execute: async (sock, m, { args, prefix, reply }) => {
            const jid = args[0];
            const setting = args[1];
            if (!jid ||!setting) return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *COMMUNITY HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CSET*\n│ ❏ Usage : ${prefix}cset <community_jid> <open/close>\n╰─────────────────────────╯`);
            await sleep(300);
            try {
                await sock.communitySettingUpdate(jid, setting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Community set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    }
];