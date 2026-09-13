const BOT_NAME = process.env.BOT_NAME || 'XADON AI'

// ── ALL PROFILE & PRIVACY COMMANDS ──────────────────────────────────────
module.exports = [

    // ── UPDATE LAST SEEN PRIVACY ─────────────────────────────────────────
    {
        name: 'ls',
        alias: ['last', 'lastseen'],
        desc: 'Update who can see your last seen',
        category: 'Privacy',
        owner: true,
        usage: '.ls <all/contacts/blacklist/none>',
        reactions: { start: '👁️', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'contacts', 'blacklist', 'none'];
            const map = { 'blacklist': 'contact_blacklist' }
            const realSetting = map[setting] || setting;

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *LAST SEEN*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}ls <all/contacts/blacklist/none>\n│ ❏ Example : ${prefix}ls contacts\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '👁️', key: m.key } });

            try {
                await sock.updateLastSeenPrivacy(realSetting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PRIVACY UPDATED*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ Last Seen : ${setting}\n│ ❏ Bot : ${BOT_NAME}\n╰─────────────────────────╯`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE ONLINE PRIVACY ────────────────────────────────────────────
    {
        name: 'online',
        alias: ['on', 'pon'],
        desc: 'Update who can see when you\'re online',
        category: 'Privacy',
        owner: true,
        usage: '.online <all/match>',
        reactions: { start: '🟢', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'match'];
            const map = { 'match': 'match_last_seen' }
            const realSetting = map[setting] || setting;

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ONLINE PRIVACY*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}online <all/match>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '🟢', key: m.key } });

            try {
                await sock.updateOnlinePrivacy(realSetting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Online privacy set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE PROFILE PICTURE PRIVACY ───────────────────────────────────
    {
        name: 'pfp',
        alias: ['pp', 'pppriv'],
        desc: 'Update who can see your profile picture',
        category: 'Privacy',
        owner: true,
        usage: '.pfp <all/contacts/blacklist/none>',
        reactions: { start: '🖼️', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'contacts', 'blacklist', 'none'];
            const map = { 'blacklist': 'contact_blacklist' }
            const realSetting = map[setting] || setting;

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PFP PRIVACY*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}pfp <all/contacts/blacklist/none>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });

            try {
                await sock.updateProfilePicturePrivacy(realSetting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Profile picture privacy set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE STATUS PRIVACY ────────────────────────────────────────────
    {
        name: 'status',
        alias: ['st', 'stpriv'],
        desc: 'Update who can see your status updates',
        category: 'Privacy',
        owner: true,
        usage: '.status <all/contacts/blacklist/none>',
        reactions: { start: '📱', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'contacts', 'blacklist', 'none'];
            const map = { 'blacklist': 'contact_blacklist' }
            const realSetting = map[setting] || setting;

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *STATUS PRIVACY*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}status <all/contacts/blacklist/none>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '📱', key: m.key } });

            try {
                await sock.updateStatusPrivacy(realSetting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Status privacy set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE GROUPS ADD PRIVACY ────────────────────────────────────────
    {
        name: 'gadd',
        alias: ['group', 'gpriv'],
        desc: 'Update who can add you to groups',
        category: 'Privacy',
        owner: true,
        usage: '.gadd <all/contacts/blacklist/none>',
        reactions: { start: '👥', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'contacts', 'blacklist', 'none'];
            const map = { 'blacklist': 'contact_blacklist' }
            const realSetting = map[setting] || setting;

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *GROUP PRIVACY*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}gadd <all/contacts/blacklist/none>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '👥', key: m.key } });

            try {
                await sock.updateGroupsAddPrivacy(realSetting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Groups add privacy set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE READ RECEIPTS ─────────────────────────────────────────────
    {
        name: 'read',
        alias: ['blue', 'rtick'],
        desc: 'Update read receipts (blue ticks) privacy',
        category: 'Privacy',
        owner: true,
        usage: '.read <all/none>',
        reactions: { start: '💙', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'none'];

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *READ RECEIPTS*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}read <all/none>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '💙', key: m.key } });

            try {
                await sock.updateReadReceiptsPrivacy(setting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Read receipts set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE CALL PRIVACY ──────────────────────────────────────────────
    {
        name: 'call',
        alias: ['cpriv'],
        desc: 'Update who can call you',
        category: 'Privacy',
        owner: true,
        usage: '.call <all/known>',
        reactions: { start: '📞', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'known'];

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *CALL PRIVACY*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}call <all/known>\n│ ❏ all : Everyone\n│ ❏ known : Contacts only\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '📞', key: m.key } });

            try {
                await sock.updateCallPrivacy(setting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Call privacy set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE MESSAGES PRIVACY ──────────────────────────────────────────
    {
        name: 'msg',
        alias: ['mpriv'],
        desc: 'Update who can send you messages',
        category: 'Privacy',
        owner: true,
        usage: '.msg <all/contacts/blacklist/none>',
        reactions: { start: '💬', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            const valid = ['all', 'contacts', 'blacklist', 'none'];
            const map = { 'blacklist': 'contact_blacklist' }
            const realSetting = map[setting] || setting;

            if (!setting ||!valid.includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *MESSAGE PRIVACY*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}msg <all/contacts/blacklist/none>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '💬', key: m.key } });

            try {
                await sock.updateMessagesPrivacy(realSetting);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Messages privacy set to_ ${setting}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── DISABLE LINK PREVIEWS ────────────────────────────────────────────
    {
        name: 'link',
        alias: ['lprev'],
        desc: 'Enable or disable link previews',
        category: 'Privacy',
        owner: true,
        usage: '.link <on/off>',
        reactions: { start: '🔗', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const setting = args[0]?.toLowerCase();
            if (!setting ||!['on', 'off'].includes(setting)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *LINK PREVIEW*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}link <on/off>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });

            try {
                await sock.updateDisableLinkPreviewsPrivacy(setting === 'off');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _Link previews_ ${setting.toUpperCase()}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UPDATE DEFAULT DISAPPEARING MODE ─────────────────────────────────
    {
        name: 'disap',
        alias: ['timer', 'vanish'],
        desc: 'Set default disappearing message timer',
        category: 'Privacy',
        owner: true,
        usage: '.disap <seconds>',
        reactions: { start: '⏳', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const seconds = parseInt(args[0]);

            if (isNaN(seconds) || seconds < 0) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *DISAPPEARING*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}disap <seconds>\n│ ❏ 0 : OFF\n│ ❏ 86400 : 24h\n│ ❏ 604800 : 7d\n│ ❏ 2592000 : 30d\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            try {
                await sock.updateDefaultDisappearingMode(seconds);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });

                const displayTime = seconds === 0? 'OFF' : seconds === 86400? '24 hours' : seconds === 604800? '7 days' : seconds === 2592000? '30 days' : `${seconds} seconds`;

                return reply(`*✧ Success:* _Default disappearing set to_ ${displayTime}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── VIEW ALL PRIVACY SETTINGS ────────────────────────────────────────
    {
        name: 'priv',
        alias: ['privacy', 'mpriv'],
        desc: 'View all your current privacy settings',
        category: 'Privacy',
        owner: true,
        usage: '.priv',
        reactions: { start: '🔒', success: '✧', error: '✗' },

        execute: async (sock, m, { reply, prefix }) => {
            await sock.sendMessage(m.chat, { react: { text: '🔒', key: m.key } });

            try {
                const s = await sock.fetchPrivacySettings(true);
                if (!s) return reply(`*✗ Could not fetch privacy settings*`);

                await sock.sendMessage(m.chat, {
                    headerText: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PRIVACY SETTINGS*`,
                    contentText: '---',
                    title: BOT_NAME,
                    table: [
                        ['👁️ Last Seen', s.last || 'N/A'],
                        ['🟢 Online', s.online || 'N/A'],
                        ['🖼️ Profile Pic', s.profile || 'N/A'],
                        ['📱 Status', s.status || 'N/A'],
                        ['👥 Groups Add', s.groupadd || 'N/A'],
                        ['📞 Calls', s.calladd || 'N/A'],
                        ['💬 Messages', s.messages || 'N/A'],
                        ['💙 Read Receipts', s.readreceipts || 'N/A'],
                    ],
                    footerText: `Powered by ${BOT_NAME}`,
                    raw: true
                }, { quoted: m });

                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── BLOCK USER ───────────────────────────────────────────────────────
    {
        name: 'block',
        alias: ['blk'],
        desc: 'Block a user',
        category: 'Moderation',
        owner: true,
        usage: '.block (reply) |.block @user |.block <number>',
        reactions: { start: '🚫', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            let targetJid = null;
            if (m.quoted) targetJid = m.quoted.sender || m.quoted.participant || m.quoted.key?.participant;
            else if (m.mentionedJid?.length) targetJid = m.mentionedJid[0];
            else if (args[0]) targetJid = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
            targetJid = targetJid?.includes('234')? '<bot owner number>@s.whatsapp.net' : targetJid;

            if (!targetJid) return reply(`*✗ Reply to a message, mention, or provide a number*`);

            await sock.sendMessage(m.chat, { react: { text: '🚫', key: m.key } });

            try {
                await sock.updateBlockStatus(targetJid, 'block');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Blocked:* ${targetJid.split('@')[0]}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── UNBLOCK USER ─────────────────────────────────────────────────────
    {
        name: 'unblock',
        alias: ['ublk'],
        desc: 'Unblock a user',
        category: 'Moderation',
        owner: true,
        usage: '.unblock (reply) |.unblock @user |.unblock <number>',
        reactions: { start: '🔓', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            let targetJid = null;
            if (m.quoted) targetJid = m.quoted.sender || m.quoted.participant || m.quoted.key?.participant;
            else if (m.mentionedJid?.length) targetJid = m.mentionedJid[0];
            else if (args[0]) targetJid = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
            targetJid = targetJid?.includes('234')? '<bot owner number>@s.whatsapp.net' : targetJid;

            if (!targetJid) return reply(`*✗ Reply to a message, mention, or provide a number*`);

            await sock.sendMessage(m.chat, { react: { text: '🔓', key: m.key } });

            try {
                await sock.updateBlockStatus(targetJid, 'unblock');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Unblocked:* ${targetJid.split('@')[0]}`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── FETCH BLOCKLIST ──────────────────────────────────────────────────
    {
        name: 'blist',
        alias: ['blocked'],
        desc: 'Get list of blocked users',
        category: 'Moderation',
        owner: true,
        usage: '.blist',
        reactions: { start: '📋', success: '✧', error: '✗' },

        execute: async (sock, m, { reply, prefix }) => {
            await sock.sendMessage(m.chat, { react: { text: '📋', key: m.key } });

            try {
                const blocked = await sock.fetchBlocklist();
                if (!blocked || blocked.length === 0) {
                    await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *BLOCKLIST*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *INFO*\n│ ❏ Status : No blocked users\n╰─────────────────────────╯`);
                }

                const contacts = sock.store?.contacts || {};
                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *BLOCKED USERS*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *LIST*\n`;
                blocked.forEach((jid, i) => {
                    const number = jid.split('@')[0];
                    const name = contacts[jid]?.name || contacts[jid]?.notify || number;
                    text += `│ ❏ ${i + 1}. ${name} (+${number})\n`;
                });
                text += `│ ❏ Total : ${blocked.length}\n╰─────────────────────────╯`;

                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(text);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── VIDEO CALL LINK ──────────────────────────────────────────────────
    {
        name: 'vcall',
        alias: ['vcl'],
        desc: 'Generate a WhatsApp video call link',
        category: 'Utility',
        owner: true,
        usage: '.vcall',
        reactions: { start: '📹', success: '✧', error: '✗' },

        execute: async (sock, m, { reply, prefix }) => {
            await sock.sendMessage(m.chat, { react: { text: '📹', key: m.key } });

            try {
                const token = await sock.createCallLink('video');
                if (!token) return reply(`*✗ Failed to generate call link*`);

                const link = `https://call.whatsapp.com/video/${token}`;

                await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *VIDEO CALL LINK*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *LINK*\n│ ❏ ${link}\n│ ❏ Status : Anyone with link can join\n╰─────────────────────────╯`
                }, { quoted: m });

                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── META AI BOTS ─────────────────────────────────────────────────────
    {
        name: 'bots',
        alias: ['ailist'],
        desc: 'List available Meta AI bots',
        category: 'Utility',
        usage: '.bots',
        reactions: { start: '🤖', success: '✧', error: '✗' },

        execute: async (sock, m, { reply, prefix }) => {
            await sock.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

            try {
                const list = await sock.getBotListV2();
                if (!list || list.length === 0) return reply(`*✗ No Meta AI bots found*`);

                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *META AI BOTS*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *LIST*\n`;
                list.forEach((b, i) => text += `│ ❏ Bot ${i + 1} : ${b.jid}\n│ ❏ Persona : ${b.personaId || 'N/A'}\n`);
                text += `│ ❏ Total : ${list.length}\n╰─────────────────────────╯`;

                await sock.sendMessage(m.chat, { text, quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── FIND USER (PN ↔ LID) ─────────────────────────────────────────────
    {
        name: 'whois',
        alias: ['find', 'lookup'],
        desc: 'Resolve a phone number or LID',
        category: 'Utility',
        owner: true,
        usage: '.whois <number or LID>',
        reactions: { start: '🔍', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const input = args[0]?.trim();
            if (!input) return reply(`*✗ Usage:* ${prefix}whois <number or LID>`);

            await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

            try {
                const jid = input.includes('@')? input : `${input.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
                const finalJid = jid.includes('234')? '<bot owner number>@s.whatsapp.net' : jid;
                const result = await sock.findUserId(finalJid);

                await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *USER LOOKUP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ Phone JID : ${result.phoneNumber || 'N/A'}\n│ ❏ LID : ${result.lid || 'N/A'}\n╰─────────────────────────╯`
                }, { quoted: m });

                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── STAR / UNSTAR MESSAGE ─────────────────────────────────────────────
    {
        name: 'star',
        alias: ['unstar', 'bm'],
        desc: 'Star or unstar a message',
        category: 'Utility',
        usage: '.star |.unstar',
        reactions: { start: '⭐', success: '✧', error: '✗' },

        execute: async (sock, m, { reply, prefix }) => {
            const isUnstar = m.text?.toLowerCase().includes('unstar');
            if (!m.quoted) return reply(`*✗ Reply to a message to ${isUnstar? 'unstar' : 'star'} it*`);

            await sock.sendMessage(m.chat, { react: { text: isUnstar? '💫' : '⭐', key: m.key } });

            try {
                await sock.star(m.chat, [{ id: m.quoted.key.id, fromMe: m.quoted.key.fromMe }],!isUnstar);
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ ${isUnstar? 'Unstarred' : 'Starred'}*`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── ADD / EDIT / REMOVE CONTACT ──────────────────────────────────────
    {
        name: 'contact',
        alias: ['cont', 'cadd'],
        desc: 'Add, edit or remove a contact',
        category: 'Utility',
        owner: true,
        usage: '.contact add <number> <name> |.contact remove <number>',
        reactions: { start: '👤', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const action = args[0]?.toLowerCase();
            if (!action ||!['add', 'remove'].includes(action)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *CONTACT*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Add : ${prefix}contact add <number> <name>\n│ ❏ Remove : ${prefix}contact remove <number>\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(m.chat, { react: { text: '👤', key: m.key } });

            try {
                if (action === 'add') {
                    let number = args[1];
                    const name = args.slice(2).join(' ').trim();
                    if (!number ||!name) return reply(`*✗ Usage:* ${prefix}contact add <number> <name>`);
                    number = String(number).replace(/\D/g, '');
                    const jid = `${number}@s.whatsapp.net`;
                    await sock.addOrEditContact(jid, { notify: name });
                    await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                    return reply(`*✧ Contact saved:* ${name} (+${number})`);
                }

                if (action === 'remove') {
                    let number = args[1];
                    if (!number) return reply(`*✗ Usage:* ${prefix}contact remove <number>`);
                    number = String(number).replace(/\D/g, '');
                    const jid = `${number}@s.whatsapp.net`;
                    await sock.removeContact(jid);
                    await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                    return reply(`*✧ Contact removed:* +${number}`);
                }
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── NEW: RESET ALL PRIVACY ───────────────────────────────────────────
    {
        name: 'pres',
        alias: ['pReset'],
        desc: 'Reset all privacy to default',
        category: 'Privacy',
        owner: true,
        usage: '.pres',
        reactions: { start: '♻️', success: '✧', error: '✗' },

        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '♻️', key: m.key } });
            try {
                await sock.updateLastSeenPrivacy('all');
                await sock.updateOnlinePrivacy('all');
                await sock.updateProfilePicturePrivacy('all');
                await sock.updateStatusPrivacy('all');
                await sock.updateGroupsAddPrivacy('all');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`*✧ Success:* _All privacy reset to default_`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },
// ── NEW: PRIVACY PROFILE ─────────────────────────────────────────────
    {
        name: 'pprofile',
        alias: ['pprof'],
        desc: 'Save privacy preset: public/private/stealth',
        category: 'Privacy',
        owner: true,
        usage: '.pprofile <public/private/stealth>',
        reactions: { start: '💾', success: '✧', error: '✗' },

        execute: async (sock, m, { args, reply, prefix }) => {
            const mode = args[0]?.toLowerCase();
            if (!['public', 'private', 'stealth'].includes(mode)) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PRIVACY PROFILE*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}pprofile <public/private/stealth>\n│ ❏ public : All visible\n│ ❏ private : Contacts only\n│ ❏ stealth : None\n╰─────────────────────────╯`);
            }
            try {
                const setting = mode === 'public'? 'all' : mode === 'private'? 'contacts' : 'none';
                await sock.updateLastSeenPrivacy(setting);
                await sock.updateOnlinePrivacy(setting === 'all'? 'all' : 'match_last_seen');
                await sock.updateProfilePicturePrivacy(setting);
                await sock.updateStatusPrivacy(setting);
                await sock.updateReadReceiptsPrivacy(mode === 'stealth'? 'none' : 'all');

                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PRIVACY PROFILE*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *APPLIED*\n│ ❏ Mode : ${mode.toUpperCase()}\n│ ❏ Bot : ${BOT_NAME}\n╰─────────────────────────╯`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── NEW: BACKUP PRIVACY SETTINGS ─────────────────────────────────────
    {
        name: 'pbackup',
        alias: ['psave'],
        desc: 'Backup current privacy settings to file',
        category: 'Privacy',
        owner: true,
        usage: '.pbackup',
        reactions: { start: '📦', success: '✧', error: '✗' },

        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '📦', key: m.key } });
            try {
                const s = await sock.fetchPrivacySettings(true);
                const fs = require('fs');
                const path = require('path');
                const backupPath = path.join(__dirname, '..', '..', 'database', 'privacy_backup.json');
                fs.mkdirSync(path.dirname(backupPath), { recursive: true });
                fs.writeFileSync(backupPath, JSON.stringify(s, null, 2));

                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PRIVACY BACKUP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *SUCCESS*\n│ ❏ Status : Settings backed up\n│ ❏ File : privacy_backup.json\n╰─────────────────────────╯`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    },

    // ── NEW: AUDIT PRIVACY CHANGES ───────────────────────────────────────
    {
        name: 'paudit',
        alias: ['plog'],
        desc: 'Show last privacy changes log',
        category: 'Privacy',
        owner: true,
        usage: '.paudit',
        reactions: { start: '📜', success: '✧', error: '✗' },

        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '📜', key: m.key } });
            try {
                const fs = require('fs');
                const path = require('path');
                const logPath = path.join(__dirname, '..', '..', 'database', 'privacy_log.txt');

                if (!fs.existsSync(logPath)) {
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PRIVACY AUDIT*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *INFO*\n│ ❏ Status : No logs found yet\n╰─────────────────────────╯`);
                }

                const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-10).join('\n');
                await sock.sendMessage(m.chat, { react: { text: '✧', key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PRIVACY AUDIT LOG*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *LAST 10 CHANGES*\n${logs}\n╰─────────────────────────╯`);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                return reply(`*✗ Error:* ${err.message}`);
            }
        }
    }
];
