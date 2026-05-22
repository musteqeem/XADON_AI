const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'antiword.json');
const WARN_DB_PATH = path.join(process.cwd(), 'database', 'antiword_warns.json');

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
    const lowerText = text.toLowerCase();
    return bannedWords.some(word => lowerText.includes(word.toLowerCase()));
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

function ensureGroupConfig(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            words: [],
            action: 'delete',
            blacklist: [],
            log: false
        };
    } else {
        if (!db[group].hasOwnProperty('blacklist')) db[group].blacklist = [];
        if (!db[group].hasOwnProperty('log')) db[group].log = false;
        if (!db[group].hasOwnProperty('action')) db[group].action = 'delete';
        if (!db[group].hasOwnProperty('enabled')) db[group].enabled = false;
        if (!db[group].hasOwnProperty('words')) db[group].words = [];
    }
    return db[group];
}

module.exports = {
    name: 'antiword',
    alias: ['banword', 'wordban'],
    desc: 'Delete messages containing banned words with XDN defense system',
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
            const wordList = cfg.words.length
             ? cfg.words.map(w => `❏ ${w}`).join('\n')
              : '❏ none';
            const blacklist = cfg.blacklist.length
             ? cfg.blacklist.map(u => `❏ ${u}`).join('\n')
              : '❏ none';

            const actionDisplay = cfg.action === 'delete'? 'DELETE' :
                                 cfg.action === 'warn'? 'WARN 3x → KICK' :
                                 cfg.action === 'kick'? 'IMMEDIATE KICK' : 'UNKNOWN';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIWORD DEFENSE SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE STATUS*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Log : ${cfg.log? 'ENABLED' : 'DISABLED'}
│ ❏ Words : ${cfg.words.length}
│ ❏ Blacklist : ${cfg.blacklist.length} users
╰─────────────────────────╯

Commands:
֎.antiword on/off → Toggle system
֎.antiword delete/warn/kick → Set action
֎.antiword add <word1> <word2> → Add words
֎.antiword remove <word> → Remove word
֎.antiword list → Show banned words
֎.antiword blacklist @user → Force punish
֎.antiword immune @user → Grant immunity
֎.antiword log on/off → Toggle logs
֎.antiword scan → Test detection
֎.antiword clear → Clear all words
֎.antiword resetwarn @user`
            );
        }

        if (sub === 'on') {
            cfg.enabled = true;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIWORD ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ONLINE
│ ❏ Action : ${cfg.action.toUpperCase()}
│ ❏ Shield : ACTIVE
╰─────────────────────────╯
Banned words will be blocked.`
            );
        }

        if (sub === 'off') {
            cfg.enabled = false;
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIWORD DEACTIVATED •
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

        if (sub === 'add') {
            const words = args.slice(1).filter(w => w && w.trim());
            if (!words.length) return reply('֎ Usage:.antiword add <word1> <word2>...');

            const newWords = [];
            for (const w of words) {
                const word = w.toLowerCase();
                if (!cfg.words.includes(word)) {
                    cfg.words.push(word);
                    newWords.push(word);
                }
            }
            saveDB(db);
            if (newWords.length) {
                return reply(`֎ Added banned words:\n${newWords.map(w => `❏ ${w}`).join('\n')}`);
            } else {
                return reply('֎ All words already banned.');
            }
        }

        if (sub === 'remove') {
            const word = args[1]?.toLowerCase();
            if (!word) return reply('֎ Usage:.antiword remove <word>');
            const idx = cfg.words.indexOf(word);
            if (idx === -1) return reply(`֎ "${word}" not found.`);
            cfg.words.splice(idx, 1);
            saveDB(db);
            return reply(`֎ Removed: ❏ ${word}`);
        }

        if (sub === 'list') {
            if (!cfg.words.length) return reply('֎ No banned words in this group.');
            return reply(`֎ *Banned Words*\n${cfg.words.map((w, i) => `❏ ${w}`).join('\n')}`);
        }

        if (sub === 'blacklist') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antiword blacklist @user');
            if (!cfg.blacklist.includes(mentioned)) cfg.blacklist.push(mentioned);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} blacklisted. Auto punish enabled.`, { mentions: [mentioned] });
        }

        if (sub === 'immune') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antiword immune @user');
            const idx = cfg.blacklist.indexOf(mentioned);
            if (idx!== -1) cfg.blacklist.splice(idx, 1);
            saveDB(db);
            return reply(`֎ @${mentioned.split('@')[0]} granted immunity. Detection bypassed.`, { mentions: [mentioned] });
        }

        if (sub === 'log') {
            const mode = args[1]?.toLowerCase();
            if (mode === 'on') cfg.log = true;
            else if (mode === 'off') cfg.log = false;
            else return reply('֎ Usage:.antiword log on/off');
            saveDB(db);
            return reply(`֎ Log system ${mode.toUpperCase()}.`);
        }

        if (sub === 'scan') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTIWORD SCAN MODE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
System is ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}.
Scanning all messages for banned words.
Words loaded: ${cfg.words.length}
Action: ${cfg.action.toUpperCase()}`
            );
        }

        if (sub === 'clear') {
            cfg.words = [];
            cfg.blacklist = [];
            saveDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • DEFENSE LISTS CLEARED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
All banned words and blacklist cleared.`
            );
        }

        if (sub === 'resetwarn') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.antiword resetwarn @user');
            const warns = loadWarns();
            const key = `${group}_${mentioned}`;
            if (warns[key]) {
                delete warns[key];
                saveWarns(warns);
                return reply(`֎ Warnings reset for @${mentioned.split('@')[0]}`, { mentions: [mentioned] });
            }
            return reply('֎ User has no warnings.');
        }

        return reply('֎ Invalid subcommand. Use.antiword status for help.');
    }
};

// ── Message Handler ──────────────────────────────────────────────
module.exports.handleAntiWord = async function(sock, m, mek) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadDB();
        const group = m.chat;
        const cfg = db[group];
        if (!cfg?.enabled) return;
        if (!cfg.words?.length) return;

        const text = extractText(m);
        if (!text) return;
        if (!containsBannedWord(text, cfg.words)) return;

        const meta = await sock.groupMetadata(group).catch(() => null);
        if (!meta) return;

        const sender = m.sender;
        const senderNorm = (sender || '').replace(/:\d+@/, '@');

        const admins = meta.participants
         .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
         .map(p => p.id.replace(/:\d+@/, '@'));
        if (admins.includes(senderNorm)) return;

        if (cfg.blacklist?.includes(senderNorm)) {
            await sock.sendMessage(group, { delete: m.key }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} KICKED\nBlacklisted user detected using banned words.`,
                mentions: [sender]
            }).catch(() => {});
            return;
        }

        const action = cfg.action || 'delete';

        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        if (cfg.log) {
            console.log(`[XDN ANTIWORD] ${action} → ${sender.split('@')[0]} | banned word detected`);
        }

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `֎ @${sender.split('@')[0]} Banned word detected!\nMessage deleted. Defense active.`,
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
                text: `֎ @${sender.split('@')[0]} KICKED\nBanned word detected.`,
                mentions: [sender]
            }).catch(() => {});
            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }
    } catch (err) {
        console.error('[XDN ANTIWORD ERROR]', err.message);
    }
};