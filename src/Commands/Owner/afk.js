const fs = require('fs');
const path = require('path');

const AFK_FILE = path.join(process.cwd(), 'database', 'afk.json');
const MARKER = '\u200E';

let afkData = {};

const normalizeJid = (jid) => (jid || '').replace(/:\d+@/, '@').toLowerCase().trim();
const makeKey = (userId, chatId) => `${normalizeJid(userId)}_${chatId}`;

const loadAfk = () => {
    try {
        if (fs.existsSync(AFK_FILE)) {
            afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('[XDN AFK LOAD]', e.message);
        afkData = {};
    }
};

const saveAfk = () => {
    try {
        fs.mkdirSync(path.dirname(AFK_FILE), { recursive: true });
        fs.writeFileSync(AFK_FILE, JSON.stringify(afkData, null, 2));
    } catch (e) {
        console.error('[XDN AFK SAVE]', e.message);
    }
};

const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
};

loadAfk();

module.exports = {
    name: 'afk',
    alias: ['away', 'brb'],
    desc: 'AFK system with XDN defense core',
    category: 'Utility',
    usage: '.afk [reason] |.afk off',
    reactions: { start: '💤', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const userId = (sock.user?.id || m.sender || '').replace(/:\d+@/, '@s.whatsapp.net');
        const chatId = m.chat;
        const key = makeKey(userId, chatId);
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'status') {
            const active = afkData[key]?.enabled;
            const afkList = Object.keys(afkData).filter(k => k.endsWith(`_${chatId}`) && afkData[k].enabled);

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AFK SYSTEM STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Your Status : ${active? 'ACTIVE' : 'INACTIVE'}
│ ❏ Group AFK Count : ${afkList.length}
│ ❏ Auto Detect : ON
╰─────────────────────────╯

Commands:
֎.afk <reason> → Set AFK
֎.afk off → Disable AFK
֎.afk list → Show all AFK users
֎.afk clear → Clear all AFK in group
֎.afk info @user → Check AFK info
֎.afk reason @user new reason → Update reason
֎.afk silent on/off → Silent AFK replies
֎.afk notify on/off → Notify on mention
֎.afk log on/off → Log AFK actions
֎.afk reset → Reset your AFK data`
            );
        }

        if (sub === 'off') {
            const wasActive = afkData[key] && afkData[key].enabled;
            if (wasActive) delete afkData[key];
            saveAfk();
            return reply(wasActive
               ? `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • AFK DEACTIVATED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\nWelcome back.` + MARKER
                : '֎ You were not AFK' + MARKER);
        }

        if (sub === 'list') {
            const afkList = Object.keys(afkData).filter(k => k.endsWith(`_${chatId}`) && afkData[k].enabled);
            if (!afkList.length) return reply('֎ No users are AFK in this group.');
            let text = `֎ *AFK Users*\n`;
            afkList.forEach((k, i) => {
                const data = afkData[k];
                const user = k.slice(0, k.lastIndexOf(`_${chatId}`));
                const time = formatTime(Date.now() - data.timestamp);
                text += `${i+1}. @${user.split('@')[0]} - ${time}\n`;
            });
            return reply(text, { mentions: afkList.map(k => k.slice(0, k.lastIndexOf(`_${chatId}`))) });
        }

        if (sub === 'clear') {
            const afkList = Object.keys(afkData).filter(k => k.endsWith(`_${chatId}`));
            afkList.forEach(k => delete afkData[k]);
            saveAfk();
            return reply('֎ Cleared all AFK users in this group.');
        }

        if (sub === 'info') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.afk info @user');
            const targetKey = makeKey(mentioned, chatId);
            const data = afkData[targetKey];
            if (!data?.enabled) return reply('֎ User is not AFK.');
            return reply(
`֎ *AFK Info*
❏ User : @${mentioned.split('@')[0]}
❏ Reason : ${data.reason}
❏ Since : ${formatTime(Date.now() - data.timestamp)} ago
❏ Mentions : ${data.mentions || 0}`,
                { mentions: [mentioned] }
            );
        }

        if (sub === 'reason') {
            const mentioned = m.mentionedJid?.[0];
            if (!mentioned) return reply('֎ Usage:.afk reason @user new reason');
            const targetKey = makeKey(mentioned, chatId);
            if (!afkData[targetKey]?.enabled) return reply('֎ User is not AFK.');
            const newReason = args.slice(2).join(' ') || 'AFK';
            afkData[targetKey].reason = newReason;
            saveAfk();
            return reply(`֎ Updated AFK reason for @${mentioned.split('@')[0]} to: ${newReason}`, { mentions: [mentioned] });
        }

        if (sub === 'silent') {
            const mode = args[1]?.toLowerCase();
            if (!afkData[key]) afkData[key] = {};
            if (!afkData[key].settings) afkData[key].settings = {};
            afkData[key].settings.silent = mode === 'on';
            saveAfk();
            return reply(`֎ Silent mode ${mode.toUpperCase()}.`);
        }

        if (sub === 'notify') {
            const mode = args[1]?.toLowerCase();
            if (!afkData[key]) afkData[key] = {};
            if (!afkData[key].settings) afkData[key].settings = {};
            afkData[key].settings.notify = mode === 'on';
            saveAfk();
            return reply(`֎ Notify on mention ${mode.toUpperCase()}.`);
        }

        if (sub === 'log') {
            const mode = args[1]?.toLowerCase();
            if (!afkData[key]) afkData[key] = {};
            if (!afkData[key].settings) afkData[key].settings = {};
            afkData[key].settings.log = mode === 'on';
            saveAfk();
            return reply(`֎ Log system ${mode.toUpperCase()}.`);
        }

        if (sub === 'reset') {
            delete afkData[key];
            saveAfk();
            return reply('֎ Your AFK data has been reset.');
        }

        // Set AFK
        const reason = args.join(' ') || 'AFK';
        afkData[key] = {
            enabled: true,
            reason: reason,
            timestamp: Date.now(),
            mentions: 0,
            settings: afkData[key]?.settings || { silent: false, notify: true, log: false }
        };
        saveAfk();

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AFK ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Reason : ${reason}
❏ Send any message to turn off.` + MARKER
        );
    }
};

module.exports.getAfk = (userId, chatId) => {
    const record = afkData[makeKey(userId, chatId)];
    return (record && record.enabled === true)? record : null;
};

module.exports.disableAfk = (userId, chatId) => {
    const key = makeKey(userId, chatId);
    if (afkData[key]) {
        delete afkData[key];
        saveAfk();
        return true;
    }
    return false;
};

module.exports.incrementMention = (userId, chatId) => {
    const key = makeKey(userId, chatId);
    if (afkData[key] && afkData[key].enabled) {
        afkData[key].mentions = (afkData[key].mentions || 0) + 1;
        saveAfk();
    }
};

module.exports.getAllAfkUsers = (chatId) => {
    const users = [];
    for (const key in afkData) {
        if (key.endsWith(`_${chatId}`) && afkData[key]?.enabled === true) {
            const userId = key.slice(0, key.lastIndexOf(`_${chatId}`));
            users.push(userId);
        }
    }
    return users;
};

module.exports.isAfkUserMentioned = (m, mek, sock) => {
    const rawMsg = mek?.message || {};
    const ctxInfo = rawMsg.extendedTextMessage?.contextInfo ||
                    rawMsg.imageMessage?.contextInfo ||
                    rawMsg.videoMessage?.contextInfo ||
                    rawMsg.documentMessage?.contextInfo || {};

    const norm = (j) => (j || '').replace(/:\d+@/, '@').toLowerCase().trim();

    const allMentions = [
       ...(ctxInfo.mentionedJid || []),
       ...(m.mentionedJid || []),
       ...(m.msg?.contextInfo?.mentionedJid || []),
    ];
    const uniqueMentions = [...new Set(allMentions)].filter(Boolean);

    const allText = [
        rawMsg.conversation,
        rawMsg.extendedTextMessage?.text,
        rawMsg.imageMessage?.caption,
        rawMsg.videoMessage?.caption,
        m.text,
        m.body
    ].filter(Boolean).join(' ');

    const botPnJid = (sock.user?.id || '').replace(/:\d+@/, '@s.whatsapp.net');
    const botLid = sock.user?.lid || '';

    const afkUsers = module.exports.getAllAfkUsers(m.chat);

    for (const afkUser of afkUsers) {
        const afkNumber = afkUser.split('@')[0].replace(/[^0-9]/g, '');
        let isMentioned = false;

        for (const jid of uniqueMentions) {
            const normalized = norm(jid);
            if (normalized === norm(afkUser) || normalized === norm(botPnJid)) {
                isMentioned = true; break;
            }
            if (botLid && normalized === norm(botLid)) {
                isMentioned = true; break;
            }
            try {
                const decoded = sock.decodeJid(jid);
                if (decoded && norm(decoded) === norm(afkUser)) { isMentioned = true; break; }
            } catch {}
            const participantAlt = ctxInfo.participantAlt || m.msg?.contextInfo?.participantAlt;
            if (participantAlt && norm(participantAlt) === norm(afkUser)) { isMentioned = true; break; }
        }

        if (!isMentioned) {
            const quotedParticipant = ctxInfo.participant || '';
            if (quotedParticipant) {
                const qNorm = norm(quotedParticipant);
                if (
                    qNorm === norm(afkUser) ||
                    qNorm === norm(botPnJid) ||
                    (botLid && qNorm === norm(botLid))
                ) {
                    isMentioned = true;
                } else {
                    try {
                        const decoded = sock.decodeJid(quotedParticipant);
                        if (decoded && norm(decoded) === norm(afkUser)) isMentioned = true;
                    } catch {}
                    if (!isMentioned) {
                        const participantAlt = ctxInfo.participantAlt || m.msg?.contextInfo?.participantAlt;
                        if (participantAlt && norm(participantAlt) === norm(afkUser)) isMentioned = true;
                    }
                }
            }
        }

        if (!isMentioned) {
            const waLink1 = `wa.me/${afkNumber}`;
            const waLink2 = `https://wa.me/${afkNumber}`;
            const waLink3 = `https://api.whatsapp.com/send?phone=${afkNumber}`;
            isMentioned =
                allText.includes(afkNumber) ||
                allText.includes(`@${afkNumber}`) ||
                allText.includes(afkUser) ||
                allText.includes(waLink1) ||
                allText.includes(waLink2) ||
                allText.includes(waLink3);
        }

        if (isMentioned) return afkUser;
    }

    return null;
};

module.exports.loadAfk = loadAfk;
module.exports.saveAfk = saveAfk;
module.exports.MARKER = MARKER;