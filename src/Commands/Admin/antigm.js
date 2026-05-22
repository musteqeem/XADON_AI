const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'antigm.json');
const WARN_DB_PATH = path.join(process.cwd(), 'database', 'antigm_warns.json');

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

function isStatusMention(mek) {
    const raw = mek?.message || {};
    return!!raw.groupStatusMentionMessage;
}

module.exports = {
    name: 'antigm',
    alias: ['antigroupmention', 'antigroupmsg', 'antieveryone'],
    desc: 'Prevent status mentions in group with defense system',
    category: 'Tools',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🛡️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const db = loadDB();
        const group = m.chat;
        if (!db[group]) db[group] = { enabled: false, action: 'delete', whitelist: [], blacklist: [], log: false };

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'status') {
            const cfg = db[group];
            const actionDisplay = cfg.action === 'delete'? 'DELETE' :
                                 cfg.action === 'warn'? 'WARN 3x → KICK' :
                                 cfg.action === 'kick'? 'IMMEDIATE KICK' : 'UNKNOWN';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIGM DEFENSE SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE STATUS*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Log : ${cfg.log? 'ENABLED' : 'DISABLED'}
│ ❏ Whitelist : ${cfg.whitelist.length} users
│ ❏ Blacklist : ${cfg.blacklist.length} users
╰─────────────────────────╯

Commands:
֎.antigm on/off → Toggle system
֎.antigm delete/warn/kick → Set action
֎.antigm whitelist @user → Exempt user
֎.antigm blacklist @user → Force punish
֎.antigm immune @user → Add immunity
֎.antigm log on/off → Toggle logs
֎.antigm test → Test detection
֎.antigm resetwarn @user → Reset warnings`
            );
        }

        if (sub === 'on') {
            db[group].enabled = true;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIGM ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ONLINE
│ ❏ Action : ${db[group].action.toUpperCase()}
│ ❏ Shield : ACTIVE
╰─────────────────────────╯
Status mentions will be blocked.`
            );
        }

        if (sub === 'off') {
            db[group].enabled = false;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIGM DEACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Defense system is now OFFLINE.`
            );
        }

        if (sub === 'delete' || sub === 'warn' || sub === 'kick') {
            db[group].action = sub;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ACTION UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Action set to: ${sub.toUpperCase()}`
            );
        }

        if (sub === 'whitelist') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antigm whitelist @user');
            if (!db[group].whitelist.includes(mentioned)) db[group].whitelist.push(mentioned);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} added to whitelist. Immune to detection.`, { mentions: [mentioned] });
        }

        if (sub === 'blacklist') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antigm blacklist @user');
            if (!db[group].blacklist.includes(mentioned)) db[group].blacklist.push(mentioned);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} added to blacklist. Auto punish enabled.`, { mentions: [mentioned] });
        }

        if (sub === 'immune') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antigm immune @user');
            if (!db[group].whitelist.includes(mentioned)) db[group].whitelist.push(mentioned);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} granted immunity. Detection bypassed.`, { mentions: [mentioned] });
        }

        if (sub === 'log') {
            const mode = args[1]?.toLowerCase();
            if (mode === 'on') db[group].log = true;
            else if (mode === 'off') db[group].log = false;
            else return reply('֎ Usage:.antigm log on/off');
            saveDB(db);
            return reply(`֎ Log system ${mode.toUpperCase()}.`);
        }

        if (sub === 'test') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIGM TEST MODE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Detection system is ${db[group].enabled? 'ACTIVE' : 'INACTIVE'}.
Send a status mention to test.
Current action: ${db[group].action.toUpperCase()}`
            );
        }

        if (sub === 'resetwarn') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antigm resetwarn @user');
            const warns = loadWarns();
            const key = `${group}_${mentioned}`;
            if (warns[key]) {
                delete warns[key];
                saveWarns(warns);
                return reply(`֎ Warnings reset for @${mentioned.split('@')[0]}`, { mentions: [mentioned] });
            }
            return reply('֎ User has no warnings.');
        }

        reply('֎ Invalid subcommand. Use.antigm status for help.');
    }
};

// ── Message Handler ────────────────────────────────────────────
module.exports.handleAntiGM = async function(sock, m, mek) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;
        if (!isStatusMention(mek)) return;

        const db = loadDB();
        const group = m.chat;
        if (!db[group]?.enabled) return;

        const action = db[group].action || 'delete';
        const cfg = db[group];

        const meta = await sock.groupMetadata(group).catch(() => null);
        if (!meta) return;

        const admins = meta.participants
           .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
           .map(p => p.id.replace(/:\d+@/, '@'));
        const senderNorm = (m.sender || '').replace(/:\d+@/, '@');

        if (admins.includes(senderNorm)) return;
        if (cfg.whitelist?.includes(senderNorm)) return;

        const sender = m.sender;
        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        if (cfg.log) {
            console.log(`[XDN ANTIGM] ${action} → ${sender.split('@')[0]} | status mention`);
        }

        if (cfg.blacklist?.includes(senderNorm)) {
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} KICKED\nBlacklisted user detected.`,
                mentions: [sender]
            }).catch(() => {});
            return;
        }

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} Status mention detected!\nMessage deleted. Defense active.`,
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
                text: `֎ @${sender.split('@')[0]} KICKED\nStatus mention detected.`,
                mentions: [sender]
            }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }

    } catch (err) {
        console.error('[XDN ANTIGM ERROR]', err.message);
    }
};