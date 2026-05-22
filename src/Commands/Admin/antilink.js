const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'antilink.json');
const WARN_DB_PATH = path.join(process.cwd(), 'database', 'antilink_warns.json');

function loadDB() {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
}

function saveDB(data) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function loadWarns() {
    if (!fs.existsSync(WARN_DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(WARN_DB_PATH, 'utf8')); } catch { return {}; }
}

function saveWarns(data) {
    fs.mkdirSync(path.dirname(WARN_DB_PATH), { recursive: true });
    fs.writeFileSync(WARN_DB_PATH, JSON.stringify(data, null, 2));
}

function ensureGroupConfig(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            whitelist: [],
            permit: [],
            blacklist: [],
            log: false
        };
    } else {
        if (!db[group].hasOwnProperty('whitelist')) db[group].whitelist = [];
        if (!db[group].hasOwnProperty('permit')) db[group].permit = [];
        if (!db[group].hasOwnProperty('blacklist')) db[group].blacklist = [];
        if (!db[group].hasOwnProperty('log')) db[group].log = false;
        if (!db[group].hasOwnProperty('action')) db[group].action = 'delete';
        if (!db[group].hasOwnProperty('enabled')) db[group].enabled = false;
    }
    return db[group];
}

function hasLink(text) {
    return /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i.test(text);
}

function extractUrls(text) {
    const matches = text.match(/https?:\/\/[^\s<>]+/gi);
    return matches || [];
}

function isUrlAllowed(urls, whitelist) {
    if (!whitelist?.length) return false;
    return urls.some(url => whitelist.some(allowed => url === allowed));
}

function isPermitted(urls, permitList) {
    if (!permitList?.length) return false;
    return urls.some(url => permitList.some(permitted =>
        url.toLowerCase().startsWith(permitted.toLowerCase())
    ));
}

module.exports = {
    name: 'antilink',
    alias: ['al'],
    desc: 'Block links with XDN defense system',
    category: 'Admin',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🖇️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        if (!m.isGroup) return reply('֎ Group only command');

        const db = loadDB();
        const group = m.chat;
        const cfg = ensureGroupConfig(db, group);
        saveDB(db);

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'status') {
            const whitelist = cfg.whitelist.length? cfg.whitelist.map(u => `❏ ${u}`).join('\n') : '❏ none';
            const permit = cfg.permit.length? cfg.permit.map(u => `❏ ${u}`).join('\n') : '❏ none';
            const blacklist = cfg.blacklist.length? cfg.blacklist.map(u => `❏ ${u}`).join('\n') : '❏ none';

            const actionDisplay = cfg.action === 'delete'? 'DELETE' :
                                 cfg.action === 'warn'? 'WARN 3x → KICK' :
                                 cfg.action === 'kick'? 'IMMEDIATE KICK' : 'UNKNOWN';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTILINK DEFENSE SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE STATUS*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Log : ${cfg.log? 'ENABLED' : 'DISABLED'}
│ ❏ Whitelist : ${cfg.whitelist.length} links
│ ❏ Permit : ${cfg.permit.length} prefixes
│ ❏ Blacklist : ${cfg.blacklist.length} users
╰─────────────────────────╯

Commands:
֎.antilink on/off → Toggle system
֎.antilink delete/warn/kick → Set action
֎.antilink allow <link> → Exact allow
֎.antilink disallow <link> → Remove allow
֎.antilink permit <prefix> → Prefix allow
֎.antilink unpermit <prefix> → Remove permit
֎.antilink blacklist @user → Force punish
֎.antilink immune @user → Grant immunity
֎.antilink log on/off → Toggle logs
֎.antilink scan → Scan recent messages
֎.antilink clear → Clear all lists
֎.antilink allowlist/permitlist
֎.antilink resetwarn @user`
            );
        }

        if (sub === 'on') {
            cfg.enabled = true;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTILINK ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ONLINE
│ ❏ Action : ${cfg.action.toUpperCase()}
│ ❏ Shield : ACTIVE
╰─────────────────────────╯
Links will be blocked and processed.`
            );
        }

        if (sub === 'off') {
            cfg.enabled = false;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTILINK DEACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Defense system is now OFFLINE.`
            );
        }

        if (['delete','warn','kick'].includes(sub)) {
            cfg.action = sub;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ACTION UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Action set to: ${sub.toUpperCase()}`
            );
        }

        if (sub === 'allow') {
            const url = args[1]?.trim();
            if (!url ||!url.startsWith('http')) return reply('֎ Usage:.antilink allow <full_link>');
            if (cfg.whitelist.includes(url)) return reply('֎ Link already allowed.');
            cfg.whitelist.push(url);
            saveDB(db);
            return reply(`֎ Link added to whitelist:\n❏ ${url}`);
        }

        if (sub === 'disallow') {
            const url = args[1]?.trim();
            if (!url) return reply('֎ Usage:.antilink disallow <full_link>');
            const idx = cfg.whitelist.indexOf(url);
            if (idx === -1) return reply('֎ Link not found in whitelist.');
            cfg.whitelist.splice(idx, 1);
            saveDB(db);
            return reply(`֎ Removed from whitelist:\n❏ ${url}`);
        }

        if (sub === 'permit') {
            const url = args[1]?.trim();
            if (!url ||!url.startsWith('http')) return reply('֎ Usage:.antilink permit <url_prefix>');
            if (cfg.permit.includes(url)) return reply('֎ Prefix already permitted.');
            cfg.permit.push(url);
            saveDB(db);
            return reply(`֎ Prefix added to permit:\n❏ ${url}`);
        }

        if (sub === 'unpermit') {
            const url = args.slice(1).join(' ')?.trim();
            if (!url) return reply('֎ Usage:.antilink unpermit <url_prefix>');
            const idx = cfg.permit.findIndex(p => p === url);
            if (idx === -1) return reply('֎ Prefix not found in permit list.');
            const removed = cfg.permit.splice(idx, 1);
            saveDB(db);
            return reply(`֎ Removed from permit:\n❏ ${removed[0]}`);
        }

        if (sub === 'blacklist') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antilink blacklist @user');
            if (!cfg.blacklist.includes(mentioned)) cfg.blacklist.push(mentioned);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} blacklisted. Auto punish enabled.`, { mentions: [mentioned] });
        }

        if (sub === 'immune') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antilink immune @user');
            if (!cfg.whitelist.includes(mentioned)) cfg.whitelist.push(mentioned);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} granted immunity. Link detection bypassed.`, { mentions: [mentioned] });
        }

        if (sub === 'log') {
            const mode = args[1]?.toLowerCase();
            if (mode === 'on') cfg.log = true;
            else if (mode === 'off') cfg.log = false;
            else return reply('֎ Usage:.antilink log on/off');
            saveDB(db);
            return reply(`֎ Log system ${mode.toUpperCase()}.`);
        }

        if (sub === 'scan') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTILINK SCAN MODE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
System is ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}.
All new messages will be scanned for links.
Current action: ${cfg.action.toUpperCase()}`
            );
        }

        if (sub === 'clear') {
            cfg.whitelist = [];
            cfg.permit = [];
            cfg.blacklist = [];
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • DEFENSE LISTS CLEARED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Whitelist, permit, and blacklist emptied.`
            );
        }

        if (sub === 'allowlist') {
            if (!cfg.whitelist.length) return reply('֎ No allowed links.');
            return reply(`֎ *Allowed Links*\n${cfg.whitelist.map(u => `❏ ${u}`).join('\n')}`);
        }

        if (sub === 'permitlist') {
            if (!cfg.permit.length) return reply('֎ No permitted prefixes.');
            return reply(`֎ *Permitted Prefixes*\n${cfg.permit.map(u => `❏ ${u}`).join('\n')}`);
        }

        if (sub === 'resetwarn') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antilink resetwarn @user');
            const warns = loadWarns();
            const key = `${group}_${mentioned}`;
            if (warns[key]) {
                delete warns[key];
                saveWarns(warns);
                return reply(`֎ Warnings reset for @${mentioned.split('@')[0]}`, { mentions: [mentioned] });
            }
            return reply('֎ User has no warnings.');
        }

        return reply('֎ Invalid subcommand. Use.antilink status for help.');
    }
};

// ── Message Handler ──────────────────────────────────────────────
module.exports.handleAntiLink = async function(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadDB();
        const group = m.chat;
        if (!db[group]) return;

        const cfg = db[group];
        if (!cfg.enabled) return;

        const msg = m.message || {};
        const parts = [
            m.text,
            m.body,
            msg.conversation,
            msg.extendedTextMessage?.text,
            msg.extendedTextMessage?.matchedText,
            msg.imageMessage?.caption,
            msg.videoMessage?.caption,
            msg.documentMessage?.caption,
            msg.audioMessage?.caption,
        ].filter(Boolean);

        const text = parts.join(' ');
        if (!text ||!hasLink(text)) return;

        const urls = extractUrls(text);

        // Check allowlist and permit
        if (isUrlAllowed(urls, cfg.whitelist)) return;
        if (isPermitted(urls, cfg.permit)) return;

        const meta = await sock.groupMetadata(group).catch(() => null);
        if (!meta) return;

        const sender = m.sender;
        const senderNorm = sender.replace(/:\d+@/, '@');

        const admins = meta.participants
          .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
          .map(p => p.id.replace(/:\d+@/, '@'));

        if (admins.includes(senderNorm)) return;
        if (cfg.whitelist?.includes(senderNorm)) return;

        if (cfg.log) {
            console.log(`[XDN ANTILINK] ${cfg.action} → ${sender.split('@')[0]} | ${urls.join(', ')}`);
        }

        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        // Blacklist check = instant kick
        if (cfg.blacklist?.includes(senderNorm)) {
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} KICKED\nBlacklisted user detected sending links.`,
                mentions: [sender]
            }).catch(() => {});
            return;
        }

        const action = cfg.action || 'delete';

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} Link detected!\nMessage deleted. Defense active.`,
                mentions: [sender]
            }).catch(() => {});
        }

        else if (action === 'warn') {
            const warns = loadWarns();
            const warnKey = `${group}_${sender}`;

            if (!warns[warnKey]) warns[warnKey] = { count: 0, user: sender };
            warns[warnKey].count++;
            saveWarns(warns);

            const warnCount = warns[warnKey].count;

            if (warnCount >= 3) {
                delete warns[warnKey];
                saveWarns(warns);
                await sock.sendMessage(group, {
                    text: `֎ @${sender.split('@')[0]} KICKED\n3/3 warnings exceeded.`,
                    mentions: [sender]
                }).catch(() => {});
                await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            } else {
                await sock.sendMessage(group, {
                    text: `֎ @${sender.split('@')[0]} Warning ${warnCount}/3\n${3 - warnCount} more = kick.`,
                    mentions: [sender]
                }).catch(() => {});
            }
        }

        else if (action === 'kick') {
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} KICKED\nLink detected.`,
                mentions: [sender]
            }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }

    } catch (err) {
        console.error('[XDN ANTILINK ERROR]', err.message);
    }
};