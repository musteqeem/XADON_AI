// ZEE BOT V2 — Anti Tag / Anti Mass Mention
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'antitag.json');
const WARN_DB_PATH = path.join(process.cwd(), 'database', 'antitag_warns.json');

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

// Extract mentions from ALL possible locations
function getMentions(m) {
    const raw = m.message || {};
    const mentions = [];
    let nonJidMentionCount = 0;

    const ctxInfo =
        raw.extendedTextMessage?.contextInfo ||
        raw.conversation?.contextInfo ||
        raw.imageMessage?.contextInfo ||
        raw.videoMessage?.contextInfo ||
        raw.documentMessage?.contextInfo ||
        raw.audioMessage?.contextInfo ||
        raw.stickerMessage?.contextInfo ||
        m.msg?.contextInfo;

    if (ctxInfo?.mentionAll) mentions.push('__ALL__');
    if (ctxInfo?.nonJidMentions > 0) {
        nonJidMentionCount = ctxInfo.nonJidMentions;
        mentions.push('__NONJID__');
    }

    const ext = raw.extendedTextMessage;
    if (ext?.contextInfo?.mentionedJid?.length) {
        mentions.push(...ext.contextInfo.mentionedJid);
    }

    for (const type of ['imageMessage','videoMessage','documentMessage','audioMessage','stickerMessage']) {
        if (raw[type]?.contextInfo?.mentionedJid?.length) {
            mentions.push(...raw[type].contextInfo.mentionedJid);
        }
    }

    if (m.mentionedJid?.length) mentions.push(...m.mentionedJid);
    if (m.msg?.contextInfo?.mentionedJid?.length) mentions.push(...m.msg.contextInfo.mentionedJid);

    return { mentions: [...new Set(mentions)], nonJidMentionCount };
}

function norm(jid) {
    return (jid || '').replace(/:\d+@/, '@').replace('@lid', '@s.whatsapp.net');
}

function ensureGroupConfig(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            minTags: 2,
            blacklist: [],
            log: false
        };
    } else {
        if (!db[group].hasOwnProperty('blacklist')) db[group].blacklist = [];
        if (!db[group].hasOwnProperty('log')) db[group].log = false;
        if (!db[group].hasOwnProperty('action')) db[group].action = 'delete';
        if (!db[group].hasOwnProperty('enabled')) db[group].enabled = false;
        if (!db[group].hasOwnProperty('minTags')) db[group].minTags = 2;
    }
    return db[group];
}

module.exports = {
    name: 'antitag',
    alias: ['antimention', 'antitagall'],
    desc: 'Prevent mass tagging with XDN defense system',
    category: 'Admin',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🛡️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const db = loadDB();
        const group = m.chat;
        const cfg = ensureGroupConfig(db, group);
        saveDB(db);

        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'status') {
            const blacklist = cfg.blacklist.length? cfg.blacklist.map(u => `❏ ${u}`).join('\n') : '❏ none';
            const actionDisplay = cfg.action === 'delete'? 'DELETE' :
                                 cfg.action === 'warn'? 'WARN 3x → KICK' :
                                 cfg.action === 'kick'? 'IMMEDIATE KICK' : 'UNKNOWN';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTITAG DEFENSE SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE STATUS*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Min Tags : ${cfg.minTags}
│ ❏ Log : ${cfg.log? 'ENABLED' : 'DISABLED'}
│ ❏ Blacklist : ${cfg.blacklist.length} users
╰─────────────────────────╯

Commands:
֎.antitag on/off → Toggle system
֎.antitag delete/warn/kick → Set action
֎.antitag min <number> → Set min mentions
֎.antitag blacklist @user → Force punish
֎.antitag immune @user → Grant immunity
֎.antitag log on/off → Toggle logs
֎.antitag scan → Test detection
֎.antitag clear → Clear blacklist
֎.antitag resetwarn @user`
            );
        }

        if (sub === 'on') {
            cfg.enabled = true;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTITAG ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ONLINE
│ ❏ Action : ${cfg.action.toUpperCase()}
│ ❏ Min Tags : ${cfg.minTags}
│ ❏ Shield : ACTIVE
╰─────────────────────────╯
Mass mentions will be blocked.`
            );
        }

        if (sub === 'off') {
            cfg.enabled = false;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTITAG DEACTIVATED •
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

        if (sub === 'min' && args[1]) {
            const num = parseInt(args[1]);
            if (isNaN(num) || num < 1) return reply('֎ Must be a number greater than 0');
            cfg.minTags = num;
            saveDB(db);
            return reply(`֎ Min mentions set to: ${num}`);
        }

        if (sub === 'blacklist') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antitag blacklist @user');
            if (!cfg.blacklist.includes(mentioned)) cfg.blacklist.push(mentioned);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} blacklisted. Auto punish enabled.`, { mentions: [mentioned] });
        }

        if (sub === 'immune') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antitag immune @user');
            if (!cfg.blacklist.includes(mentioned)) {
                // Immunity = remove from blacklist if present
                const idx = cfg.blacklist.indexOf(mentioned);
                if (idx!== -1) cfg.blacklist.splice(idx, 1);
            }
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} granted immunity. Detection bypassed.`, { mentions: [mentioned] });
        }

        if (sub === 'log') {
            const mode = args[1]?.toLowerCase();
            if (mode === 'on') cfg.log = true;
            else if (mode === 'off') cfg.log = false;
            else return reply('֎ Usage:.antitag log on/off');
            saveDB(db);
            return reply(`֎ Log system ${mode.toUpperCase()}.`);
        }

        if (sub === 'scan') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTITAG SCAN MODE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
System is ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}.
Scanning for mass mentions, @all, and hidetag.
Min tags: ${cfg.minTags}
Action: ${cfg.action.toUpperCase()}`
            );
        }

        if (sub === 'clear') {
            cfg.blacklist = [];
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • BLACKLIST CLEARED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
All users removed from blacklist.`
            );
        }

        if (sub === 'resetwarn') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antitag resetwarn @user');
            const warns = loadWarns();
            const key = `${group}_${mentioned}`;
            if (warns[key]) {
                delete warns[key];
                saveWarns(warns);
                return reply(`֎ Warnings reset for @${mentioned.split('@')[0]}`, { mentions: [mentioned] });
            }
            return reply('֎ User has no warnings.');
        }

        reply('֎ Invalid subcommand. Use.antitag status for help.');
    }
};

// ── Message Handler ────────────────────────────────────────────
module.exports.handleAntiTag = async function(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadDB();
        const group = m.chat;
        if (!db[group]?.enabled) return;

        const cfg = db[group];
        const minTags = cfg.minTags || 2;
        const action = cfg.action || 'delete';

        const { mentions, nonJidMentionCount } = getMentions(m);
        const hasAllMention = mentions.includes('__ALL__');
        const hasNonJid = mentions.includes('__NONJID__');
        const uniqueMentions = [...new Set(mentions)].filter(m =>!m.startsWith('__'));
        const mentionCount = uniqueMentions.length;

        const text = m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const invisibleCount = (text.match(/[\u200e\u200f\u200b\u2060\u061c\ufeff]/g) || []).length;
        const isHideTag = invisibleCount >= 2;

        const shouldTrigger = hasAllMention || hasNonJid || isHideTag || mentionCount >= minTags;
        if (!shouldTrigger) return;

        const meta = await sock.groupMetadata(group).catch(() => null);
        if (!meta) return;

        const admins = meta.participants.filter(p => p.admin).map(p => norm(p.id));
        const senderNorm = norm(m.sender);
        if (admins.includes(senderNorm)) return;

        const botJid = norm(sock.user?.id || '');
        if (senderNorm === botJid) return;

        const sender = m.sender;

        // Blacklist check = instant kick
        if (cfg.blacklist?.includes(senderNorm)) {
            await sock.sendMessage(group, { delete: m.key }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} KICKED\nBlacklisted user detected mass tagging.`,
                mentions: [sender]
            }).catch(() => {});
            return;
        }

        let triggerReason;
        if (hasAllMention) triggerReason = '@all mention';
        else if (hasNonJid) triggerReason = `hidetag (${nonJidMentionCount} non-JID mentions)`;
        else if (isHideTag) triggerReason = 'hidetag detected';
        else triggerReason = `${mentionCount} tags [min: ${minTags}]`;

        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        if (cfg.log) {
            console.log(`[XDN ANTITAG] ${action} → ${sender.split('@')[0]} | ${triggerReason}`);
        }

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} Mass tagging detected!\n${triggerReason}\nMessage deleted.`,
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
                    text: `֎ @${sender.split('@')[0]} KICKED\n3/3 warnings exceeded.\n${triggerReason}`,
                    mentions: [sender]
                }).catch(() => {});
                await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            } else {
                await sock.sendMessage(group, {
                    text: `֎ @${sender.split('@')[0]} Warning ${warnCount}/3\n${3 - warnCount} more = kick.\n${triggerReason}`,
                    mentions: [sender]
                }).catch(() => {});
            }
        }

        else if (action === 'kick') {
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} KICKED\nMass tagging detected.\n${triggerReason}`,
                mentions: [sender]
            }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }

    } catch (err) {
        console.error('[XDN ANTITAG ERROR]', err.message);
    }
};