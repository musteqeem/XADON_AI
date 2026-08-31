// XADON AI — Anti Tag / Anti Mass Mention
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

    if (ctxInfo?.mentionAll) {
        mentions.push('__ALL__');
    }

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

// Helper to normalize JID
function norm(jid) {
    return (jid || '').replace(/:\d+@/, '@').replace('@lid', '@s.whatsapp.net');
}

// ── Command ────────────────────────────────────────────────────
module.exports = {
    name: 'antitag',
    alias: ['antimention', 'antitagall'],
    desc: 'Prevent mass tagging / @everyone mentions in group',
    category: 'Admin',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🛡️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const db = loadDB();
        const group = m.chat;
        if (!db[group]) db[group] = { enabled: false, action: 'delete', minTags: 2 };

        const sub = args[0]?.toLowerCase();

        if (!sub) {
            const cfg = db[group];
            let actionDisplay;
            if (cfg.action === 'delete') actionDisplay = 'DELETE';
            else if (cfg.action === 'warn') actionDisplay = 'WARN 3x KICK';
            else if (cfg.action === 'kick') actionDisplay = 'KICK';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    - ANTI TAG •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Min Tags : ${cfg.minTags || 2} mentions
│ ❏ Toggle : antitag on/off
│ ❏ Mode : antitag delete/warn/kick
│ ❏ Setting : antitag min <number>
│ ❏ Check : antitag warncount @user
│ ❏ List : antitag listwarns
│ ❏ Reset : antitag resetwarn @user
│ ❏ Nuke : antitag resetall
╰─────────────────────────╯`
            );
        }

        if (sub === 'on') {
            db[group].enabled = true;
            saveDB(db);
            let actionText = db[group].action.toUpperCase();
            return reply(`_*◉ Anti Tag ACTIVE*_\n❏ Mode : ${actionText}\n❏ Min Tags : ${db[group].minTags}`);
        }
        if (sub === 'off') {
            db[group].enabled = false;
            saveDB(db);
            return reply('_*◉ Anti Tag INACTIVE*_');
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
        if (sub === 'min' && args[1]) {
            const num = parseInt(args[1]);
            if (isNaN(num) || num < 1) return reply('_*❏ Min 1 mention required*_');
            db[group].minTags = num;
            saveDB(db);
            return reply(`_*✓ Min Tags Updated*_\n❏ ${num} mentions`);
        }
        if (sub === 'resetwarn') {
            let target = m.mentionedJid?.[0] || m.quoted?.sender;
            if (!target && args[1]) {
                const num = args[1].replace(/[^0-9]/g, '');
                if (num) target = num + '@s.whatsapp.net';
            }
            if (!target) return reply('_*✐ Usage*_ : ֎antitag resetwarn @user/reply/number');

            target = norm(target);
            const warns = loadWarns();
            const key = `${group}_${target}`;
            if (warns[key]) {
                delete warns[key];
                saveWarns(warns);
                return reply(`_*❏ Warnings Reset*_\n◉ User : @${target.split('@')[0]}`, { mentions: [target] });
            }
            return reply('_*❏ No Warnings Found*_');
        }
        if (sub === 'warncount') {
            let target = m.mentionedJid?.[0] || m.quoted?.sender;
            if (!target && args[1]) {
                const num = args[1].replace(/[^0-9]/g, '');
                if (num) target = num + '@s.whatsapp.net';
            }
            if (!target) return reply('_*✐ Usage*_ : ֎antitag warncount @user/reply/number');

            target = norm(target);
            const warns = loadWarns();
            const key = `${group}_${target}`;
            const count = warns[key]?.count || 0;
            return reply(`_*❏ Warn Status*_\n◉ User : @${target.split('@')[0]}\n◉ Count : ${count}/3`, { mentions: [target] });
        }
        if (sub === 'listwarns') {
            const warns = loadWarns();
            const groupWarns = Object.entries(warns)
           .filter(([k]) => k.startsWith(group + '_'))
           .sort((a, b) => b[1].count - a[1].count)
           .slice(0, 10);

            if (!groupWarns.length) return reply('_*❏ No Active Warnings*_');

            let txt = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - WARN LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *TOP OFFENDERS*\n`;
            const mentions = [];
            groupWarns.forEach(([k, v], i) => {
                const user = v.user;
                mentions.push(user);
                txt += `│ ${i+1}. @${user.split('@')[0]} - ${v.count}/3\n`;
            });
            txt += `╰─────────────────────────╯`;
            return reply(txt, { mentions });
        }
        if (sub === 'resetall') {
            const warns = loadWarns();
            let cleared = 0;
            for (const key of Object.keys(warns)) {
                if (key.startsWith(group + '_')) {
                    delete warns[key];
                    cleared++;
                }
            }
            saveWarns(warns);
            return reply(`_*֎ Reset Complete*_\n❏ Cleared : ${cleared} warning records`);
        }
        if (sub === 'stats') {
            const warns = loadWarns();
            const groupWarns = Object.keys(warns).filter(k => k.startsWith(group + '_'));
            const totalWarns = groupWarns.reduce((sum, k) => sum + warns[k].count, 0);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - STATS •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ANTITAG STATS*\n│ ❏ Status : ${db[group].enabled? 'ACTIVE' : 'INACTIVE'}\n│ ❏ Action : ${db[group].action.toUpperCase()}\n│ ❏ Min Tags : ${db[group].minTags}\n│ ❏ Users Warned : ${groupWarns.length}\n│ ❏ Total Warns : ${totalWarns}\n╰─────────────────────────╯`);
        }

        reply('_*✐ Usage*_ : ֎antitag on/off/delete/warn/kick/min <n>/warncount/listwarns/resetwarn/resetall/stats');
    }
};

// ── Message Handler ────────────────────────────────────────────
module.exports.handleAntiTag = async function(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadDB();
        const group = m.chat;
        if (!db[group]?.enabled) return;

        const minTags = db[group].minTags || 2;
        const action = db[group].action || 'delete';

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

        const sender = norm(m.sender);
        const admins = meta.participants.filter(p => p.admin).map(p => norm(p.id));
        const botJid = norm(sock.user?.id || '');
        if (admins.includes(sender) || sender === botJid) return;

        let triggerReason;
        if (hasAllMention) triggerReason = '@all mention';
        else if (hasNonJid) triggerReason = `hidetag (${nonJidMentionCount} non-JID)`;
        else if (isHideTag) triggerReason = 'hidetag invisible chars';
        else triggerReason = `${mentionCount} tags (min: ${minTags})`;

        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `_*❏ Mass Tag Blocked*_\n◉ User : @${sender.split('@')[0]}\n◉ Reason : ${triggerReason}\n◉ Action : Message Deleted`,
                mentions: [sender]
            }).catch(() => {});
        }
        else if (action === 'warn') {
            const warns = loadWarns();
            const warnKey = `${group}_${sender}`;

            if (!warns[warnKey]) {
                warns[warnKey] = { count: 0, user: sender };
            }
            warns[warnKey].count++;
            saveWarns(warns);

            const warnCount = warns[warnKey].count;

            if (warnCount >= 3) {
                delete warns[warnKey];
                saveWarns(warns);

                await sock.sendMessage(group, {
                    text: `_*◉ User Removed*_\n❏ Target : @${sender.split('@')[0]}\n❏ Reason : 3/3 Warnings - Mass Tag`,
                    mentions: [sender]
                }).catch(() => {});

                await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            } else {
                await sock.sendMessage(group, {
                    text: `_*❏ Warning Issued*_\n◉ User : @${sender.split('@')[0]}\n◉ Count : ${warnCount}/3\n◉ Note : ${3 - warnCount} more result in removal`,
                    mentions: [sender]
                }).catch(() => {});
            }
        }
        else if (action === 'kick') {
            await sock.sendMessage(group, {
                text: `_*◉ User Removed*_\n❏ Target : @${sender.split('@')[0]}\n❏ Reason : Mass Tag Violation`,
                mentions: [sender]
            }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }

        console.log(`[XADON AI ANTITAG] ${action} → ${sender.split('@')[0]} | ${triggerReason}`);

    } catch (err) {
        console.error('[XADON AI ANTITAG ERROR]', err.message);
    }
};