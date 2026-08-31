// XADON AI — Anti Word / Ban Words
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'antiword.json');
const WARN_DB_PATH = path.join(process.cwd(), 'database', 'antiword_warns.json');

const normJid = jid => jid?.replace(/:\d+@/, '@');

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

function containsBannedWord(text, bannedWords) {
    if (!text) return { found: false, word: null };
    const lowerText = text.toLowerCase();
    // Word boundary check to avoid false positives like "class" triggering "ass"
    const regex = new RegExp(`\\b(${bannedWords.map(w => w.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
    const match = lowerText.match(regex);
    return { found:!!match, word: match? match[0] : null };
}

function extractText(m) {
    if (m.text) return m.text;
    if (m.body) return m.body;
    const msg = m.message || m.msg || {};
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;
    if (msg.documentMessage?.caption) return msg.documentMessage.caption;
    if (msg.audioMessage?.caption) return msg.audioMessage.caption;
    if (m.quoted?.text) return m.quoted.text;
    return '';
}

module.exports = {
    name: 'antiword',
    alias: ['banword', 'wordban'],
    desc: 'Delete messages containing banned words',
    category: 'Admin',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🛡️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const db = loadDB();
        const group = m.chat;
        if (!db[group]) db[group] = { enabled: false, words: [], action: 'delete' };

        const sub = args[0]?.toLowerCase();

        if (!sub) {
            const cfg = db[group];
            const wordList = cfg.words.length
               ? cfg.words.map(w => `│ ❏ ${w}`).join('\n')
                : '│ ❏ none';

            let actionDisplay;
            if (cfg.action === 'delete') actionDisplay = 'DELETE';
            else if (cfg.action === 'warn') actionDisplay = 'WARN 3x KICK';
            else if (cfg.action === 'kick') actionDisplay = 'KICK';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    - ANTI WORD •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Words : ${cfg.words.length}
${wordList}
│ ❏ Toggle : antiword on/off
│ ❏ Mode : antiword delete/warn/kick
│ ❏ Add : antiword add <word1> <word2>
│ ❏ Remove : antiword remove <word>
│ ❏ List : antiword list
│ ❏ Check : antiword warncount @user
│ ❏ List Warns : antiword listwarns
│ ❏ Reset : antiword resetwarn @user
│ ❏ Nuke : antiword resetall
│ ❏ Clear : antiword clear
╰─────────────────────────╯`
            );
        }

        if (sub === 'on') {
            db[group].enabled = true;
            saveDB(db);
            let actionText = db[group].action.toUpperCase();
            return reply(`_*◉ Anti Word ACTIVE*_\n❏ Mode : ${actionText}\n❏ Words : ${db[group].words.length}`);
        }
        if (sub === 'off') {
            db[group].enabled = false;
            saveDB(db);
            return reply('_*◉ Anti Word INACTIVE*_');
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

        if (sub === 'add') {
            const words = args.slice(1).filter(w => w && w.trim());
            if (!words.length) return reply('_*✐ Usage*_ : ֎antiword add <word1> <word2>');

            const newWords = [];
            for (const w of words) {
                const word = w.toLowerCase().trim();
                if (!db[group].words.includes(word)) {
                    db[group].words.push(word);
                    newWords.push(word);
                }
            }
            saveDB(db);
            if (newWords.length) {
                return reply(`_*✓ Words Added*_\n${newWords.map(w => `❏ ${w}`).join('\n')}`);
            } else {
                return reply('_*❏ All Words Already Banned*_');
            }
        }

        if (sub === 'remove') {
            const word = args[1]?.toLowerCase().trim();
            if (!word) return reply('_*✐ Usage*_ : ֎antiword remove <word>');
            const idx = db[group].words.indexOf(word);
            if (idx === -1) return reply('_*❏ Word Not Found*_');
            db[group].words.splice(idx, 1);
            saveDB(db);
            return reply(`_*֎ Removed*_\n❏ ${word}`);
        }

        if (sub === 'list') {
            const words = db[group].words;
            if (!words.length) return reply('_*❏ No Banned Words*_');
            let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - BANNED WORDS •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *WORD LIST*\n`;
            text += words.map((w, i) => `│ ${i+1}. ${w}`).join('\n');
            text += `\n╰─────────────────────────╯`;
            return reply(text);
        }

        if (sub === 'clear') {
            db[group].words = [];
            saveDB(db);
            return reply('_*֎ Word List Cleared*_\n❏ All banned words removed');
        }

        if (sub === 'resetwarn') {
            let target = m.mentionedJid?.[0] || m.quoted?.sender;
            if (!target && args[1]) {
                const num = args[1].replace(/[^0-9]/g, '');
                if (num) target = num + '@s.whatsapp.net';
            }
            if (!target) return reply('_*✐ Usage*_ : ֎antiword resetwarn @user/reply/number');

            target = normJid(target);
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
            if (!target) return reply('_*✐ Usage*_ : ֎antiword warncount @user/reply/number');

            target = normJid(target);
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
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - STATS •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ANTIWORD STATS*\n│ ❏ Status : ${db[group].enabled? 'ACTIVE' : 'INACTIVE'}\n│ ❏ Action : ${db[group].action.toUpperCase()}\n│ ❏ Words : ${db[group].words.length}\n│ ❏ Users Warned : ${groupWarns.length}\n│ ❏ Total Warns : ${totalWarns}\n╰─────────────────────────╯`);
        }

        reply('_*✐ Usage*_ : ֎antiword on/off/delete/warn/kick/add/remove/list/clear/warncount/listwarns/resetwarn/resetall/stats');
    }
};

// ── Message Handler ──────────────────────────────────────────────
module.exports.handleAntiWord = async function(sock, m, mek) {
    try {
        if (!m.isGroup) return;
        if (m.key?.fromMe) return;

        const db = loadDB();
        const group = m.chat;
        const cfg = db[group];
        if (!cfg?.enabled) return;
        if (!cfg.words?.length) return;

        const text = extractText(m);
        if (!text) return;

        const { found, word } = containsBannedWord(text, cfg.words);
        if (!found) return;

        const meta = await sock.groupMetadata(group).catch(() => null);
        if (!meta) return;

        const sender = normJid(m.sender);
        const admins = meta.participants
           .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
           .map(p => normJid(p.id));
        if (admins.includes(sender)) return;

        const action = cfg.action || 'delete';
        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `_*❏ Banned Word Blocked*_\n◉ User : @${sender.split('@')[0]}\n◉ Word : ${word}\n◉ Action : Message Deleted`,
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
                    text: `_*◉ User Removed*_\n❏ Target : @${sender.split('@')[0]}\n❏ Reason : 3/3 Warnings - Banned Word`,
                    mentions: [sender]
                }).catch(() => {});

                await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            } else {
                await sock.sendMessage(group, {
                    text: `_*❏ Warning Issued*_\n◉ User : @${sender.split('@')[0]}\n◉ Count : ${warnCount}/3\n◉ Word : ${word}`,
                    mentions: [sender]
                }).catch(() => {});
            }
        }
        else if (action === 'kick') {
            await sock.sendMessage(group, {
                text: `_*◉ User Removed*_\n❏ Target : @${sender.split('@')[0]}\n❏ Reason : Banned Word Violation`,
                mentions: [sender]
            }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }

        console.log(`[XADON AI ANTIWORD] ${action} → ${sender.split('@')[0]} | word: ${word}`);

    } catch (err) {
        console.error('[XADON AI ANTIWORD ERROR]', err.message);
    }
};