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

// ── Command ────────────────────────────────────────────────────
module.exports = {
    name: 'antigm',
    alias: ['antigroupmention', 'antigroupmsg', 'antieveryone'],
    desc: 'Prevent status mentions in group',
    category: 'Tools',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🛡️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const db = loadDB();
        const group = m.chat;
        if (!db[group]) db[group] = { enabled: false, action: 'delete' };

        const sub = args[0]?.toLowerCase();

        if (!sub) {
            const cfg = db[group];
            let actionDisplay;
            if (cfg.action === 'delete') actionDisplay = 'DELETE';
            else if (cfg.action === 'warn') actionDisplay = 'WARN 3x KICK';
            else if (cfg.action === 'kick') actionDisplay = 'KICK';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • ANTI STATUS MENTION •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Toggle : antigm on/off
│ ❏ Mode : antigm delete/warn/kick
│ ❏ Reset : antigm resetwarn @user/reply/number
╰─────────────────────────╯`
            );
        }

        if (sub === 'on') {
            db[group].enabled = true;
            saveDB(db);
            let actionText = db[group].action.toUpperCase();
            return reply(`_*◉ Anti Status Mention ACTIVE*_\n❏ Mode : ${actionText}`);
        }
        if (sub === 'off') {
            db[group].enabled = false;
            saveDB(db);
            return reply('_*◉ Anti Status Mention INACTIVE*_');
        }
        if (sub === 'delete') {
            db[group].action = 'delete';
            saveDB(db);
            return reply('_*◉ Action SET*_\n❏ Mode : DELETE');
        }
        if (sub === 'warn') {
            db[group].action = 'warn';
            saveDB(db);
            return reply('_*◉ Action SET*_\n❏ Mode : WARN 3x KICK');
        }
        if (sub === 'kick') {
            db[group].action = 'kick';
            saveDB(db);
            return reply('_*◉ Action SET*_\n❏ Mode : KICK');
        }
        if (sub === 'resetwarn') {
            // Support reply, mention, phone number
            let target = m.mentionedJid?.[0] || m.quoted?.sender;
            if (!target && args[1]) {
                const num = args[1].replace(/[^0-9]/g, '');
                if (num) target = num + '@s.whatsapp.net';
            }
            if (!target) return reply('_*✐ Usage*_ : ֎antigm resetwarn @user/reply/number');

            const warns = loadWarns();
            const key = `${group}_${target}`;
            if (warns[key]) {
                delete warns[key];
                saveWarns(warns);
                return reply(`_*❏ Warnings Reset*_ \n◉ User : @${target.split('@')[0]}`, { mentions: [target] });
            }
            return reply('_*❏ No Warnings Found*_');
        }

        reply('_*✐ Usage*_ : ֎antigm on/off/delete/warn/kick/resetwarn @user/reply/number');
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

        const meta = await sock.groupMetadata(group).catch(() => null);
        if (!meta) return;

        const admins = meta.participants
           .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
           .map(p => p.id.replace(/:\d+@/, '@'));
        const senderNorm = (m.sender || '').replace(/:\d+@/, '@');
        if (admins.includes(senderNorm)) return;

        const sender = m.sender;

        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `_*❏ Status Mention Blocked*_ \n◉ User : @${sender.split('@')[0]}\n◉ Action : Message Deleted`,
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
                    text: `_*◉ User Removed*_ \n❏ Target : @${sender.split('@')[0]}\n❏ Reason : 3/3 Warnings - Status Mention`,
                    mentions: [sender]
                }).catch(() => {});

                await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            } else {
                await sock.sendMessage(group, {
                    text: `_*❏ Warning Issued*_ \n◉ User : @${sender.split('@')[0]}\n◉ Count : ${warnCount}/3\n◉ Note : ${3 - warnCount} more result in removal`,
                    mentions: [sender]
                }).catch(() => {});
            }
        }
        else if (action === 'kick') {
            await sock.sendMessage(group, {
                text: `_*◉ User Removed*_ \n❏ Target : @${sender.split('@')[0]}\n❏ Reason : Status Mention Violation`,
                mentions: [sender]
            }).catch(() => {});

            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }

        console.log(`[ANTIGM] ${action} → ${sender.split('@')[0]} | status mention`);

    } catch (err) {
        console.error('[ANTIGM ERROR]', err.message);
    }
};