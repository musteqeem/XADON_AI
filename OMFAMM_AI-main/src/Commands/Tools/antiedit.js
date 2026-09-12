/**
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * XADON AI • ANTI EDIT
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * Detects message edits and sends old + new content
 */

const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@musteqeem/baileys');

const DB_PATH = path.join(__dirname, '../../database/antiedit.json');
const CACHE_TTL = 600000; // 10min

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ chats: {}, _globalDM: false, _mode: 'dm' }, null, 2));
}

const loadDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// ✅ Cache original msgs before edit
const originalCache = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of originalCache.entries()) {
        if (now - val.timestamp > CACHE_TTL) originalCache.delete(key);
    }
}, 300000);

function getTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
}

function normJid(jid) { return jid?.replace(/:\d+@/, '@'); }

function getMessageContent(msg) {
    if (!msg) return '[Empty message]';
    const layers = ['ephemeralMessage', 'viewOnceMessage', 'message', 'editedMessage', 'templateMessage', 'productMessage'];
    for (const layer of layers) {
        if (msg[layer]) return getMessageContent(msg[layer]);
    }
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage) return msg.imageMessage.caption || '';
    if (msg.videoMessage) return msg.videoMessage.caption || '';
    if (msg.documentMessage) return msg.documentMessage.fileName || '[Document]';
    if (msg.audioMessage) return 'Voice message';
    if (msg.stickerMessage) return '[Sticker]';
    if (msg.locationMessage) return '[Location]';
    if (msg.contactMessage) return msg.contactMessage.displayName || 'contact';
    if (msg.buttonsResponseMessage?.selectedDisplayText) return msg.buttonsResponseMessage.selectedDisplayText;
    if (msg.listResponseMessage?.title) return msg.listResponseMessage.title;
    try {
        const match = JSON.stringify(msg).match(/"text":"(.*?)"/);
        if (match) return match[1];
    } catch {}
    return '[Unsupported message]';
}

function unwrapMsg(msg) {
    if (!msg) return null;
    const layers = ['ephemeralMessage', 'viewOnceMessage', 'protocolMessage', 'editedMessage', 'templateMessage', 'productMessage'];
    for (const layer of layers) {
        if (msg[layer]) return unwrapMsg(msg[layer]);
    }
    return msg;
}

function resolveMediaType(msg) {
    if (!msg) return null;
    const types = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
    return types.find(t => msg[t]) || null;
}

async function downloadMedia(message, type) {
    try {
        const typeMap = {
            'imageMessage': 'image', 'videoMessage': 'video',
            'audioMessage': 'audio', 'documentMessage': 'document',
            'stickerMessage': 'sticker'
        };
        const mediaType = typeMap[type];
        if (!mediaType) return null;
        const stream = await downloadContentFromMessage(message[type], mediaType);
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    } catch { return null; }
}

function cacheOriginal(msgId, msgObj) {
    if (!originalCache.has(msgId)) {
        originalCache.set(msgId, {
            msgObj: msgObj,
            text: getMessageContent(msgObj),
            pushName: msgObj?.pushName || null,
            timestamp: Date.now()
        });
    }
}

async function buildCaption(sock, chatJid, senderJid, isGroup, timeStr, oldText, newText) {
    const senderNum = senderJid.split('@')[0];
    let header = '';
    if (isGroup) {
        let groupName = 'Unknown Group';
        try { groupName = (await sock.groupMetadata(chatJid)).subject || groupName; } catch {}
        header += `│ ❏ Group : ${groupName}\n`;
    }
    header += `│ ❏ User : @${senderNum}\n`;

    return `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 - EDITED MESSAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RECOVERY CORE*
${header}╰─────────────────────────╯

╭─֎ *BEFORE*
│ ❏ ${oldText}
╰─────────────────────────╯

╭─֎ *AFTER*
│ ❏ ${newText}
╰─────────────────────────╯

╭─֎ *TIMESTAMP*
│ ❏ ${timeStr}
╰─────────────────────────╯`;
}

async function sendEditReport(sock, targetJid, senderJid, chatJid, isGroup, timeStr, cached, newMsg) {
    const mentions = [senderJid];
    const newMsgUnwrapped = unwrapMsg(newMsg);
    const newText = getMessageContent(newMsg);
    const oldText = cached?.text || '[Original not cached]';

    const oldMediaType = cached?.msgObj? resolveMediaType(unwrapMsg(cached.msgObj)) : null;
    const newMediaType = resolveMediaType(newMsgUnwrapped);
    const mediaMsg = cached?.msgObj && oldMediaType? unwrapMsg(cached.msgObj) : newMsgUnwrapped && newMediaType? newMsgUnwrapped : null;
    const mediaType = oldMediaType || newMediaType || null;

    const caption = await buildCaption(sock, chatJid, senderJid, isGroup, timeStr, oldText, newText);

    if (mediaMsg && mediaType) {
        const buffer = await downloadMedia(mediaMsg, mediaType);
        if (mediaType === 'imageMessage') {
            return buffer
               ? sock.sendMessage(targetJid, { image: buffer, caption, mentions })
                : sock.sendMessage(targetJid, { text: caption, mentions });
        }
        if (mediaType === 'videoMessage') {
            return buffer
               ? sock.sendMessage(targetJid, { video: buffer, caption, mentions })
                : sock.sendMessage(targetJid, { text: caption, mentions });
        }
        if (mediaType === 'audioMessage') {
            const isPtt = mediaMsg.audioMessage?.ptt || false;
            if (buffer) {
                await sock.sendMessage(targetJid, { audio: buffer, mimetype: 'audio/mpeg', ptt: isPtt });
                return sock.sendMessage(targetJid, { text: caption, mentions });
            }
            return sock.sendMessage(targetJid, { text: caption, mentions });
        }
        if (mediaType === 'stickerMessage') {
            if (buffer) {
                await sock.sendMessage(targetJid, { sticker: buffer });
                return sock.sendMessage(targetJid, { text: caption, mentions });
            }
            return sock.sendMessage(targetJid, { text: caption, mentions });
        }
        if (mediaType === 'documentMessage') {
            const fileName = mediaMsg.documentMessage?.fileName || 'document';
            const mimetype = mediaMsg.documentMessage?.mimetype || 'application/octet-stream';
            return buffer
               ? sock.sendMessage(targetJid, { document: buffer, mimetype, fileName, caption, mentions })
                : sock.sendMessage(targetJid, { text: caption, mentions });
        }
    } else {
        return sock.sendMessage(targetJid, { text: caption, mentions });
    }
}

// ── COMMAND MODULE ──────────────────────────────────────────────
module.exports = {
    name: 'antiedit',
    alias: ['editdetect'],
    category: 'Admin',
    desc: 'Detect edits and recover old + new content',
    groupOnly: false,
    adminOnly: true,
    reactions: { start: '✎', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const db = loadDB();
        const chat = m.chat;
        const sub = args[0]?.toLowerCase();
        const sub2 = args[1]?.toLowerCase();

        if (!sub) {
            const chatStatus = db.chats[chat]? 'ACTIVE' : 'INACTIVE';
            const globalDM = db._globalDM? 'ACTIVE' : 'INACTIVE';
            const mode = db._mode || 'dm';
            const chatsOn = Object.keys(db.chats).length;

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    - ANTI EDIT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Chat Status : ${chatStatus}
│ ❏ Global DMs : ${globalDM}
│ ❏ Mode : ${mode.toUpperCase()}
│ ❏ Chats ON : ${chatsOn}
│ ❏ Toggle : antiedit on/off
│ ❏ Global : antiedit onall/offall
│ ❏ Mode : antiedit mode dm/chat
│ ❏ Stats : antiedit stats
│ ❏ Clear : antiedit clear
│ ❏ List : antiedit list
╰─────────────────────────╯`
            );
        }

        if (sub === 'on' &&!sub2) {
            db.chats[chat] = true;
            saveDB(db);
            return reply(`_*◉ Anti Edit ACTIVE*_\n❏ Scope : This Chat`);
        }
        if (sub === 'on' && sub2 === 'all') {
            db._globalDM = true;
            saveDB(db);
            return reply(`_*◉ Anti Edit ACTIVE*_\n❏ Scope : All Private Chats`);
        }
        if (sub === 'off' &&!sub2) {
            delete db.chats[chat];
            saveDB(db);
            return reply(`_*◉ Anti Edit INACTIVE*_\n❏ Scope : This Chat`);
        }
        if (sub === 'off' && sub2 === 'all') {
            db._globalDM = false;
            saveDB(db);
            return reply(`_*◉ Anti Edit INACTIVE*_\n❏ Scope : All Private Chats`);
        }
        if (sub === 'mode') {
            if (!sub2 ||!['dm', 'chat'].includes(sub2)) return reply('_*✐ Usage*_ : ֎antiedit mode dm/chat');
            db._mode = sub2;
            saveDB(db);
            return reply(`_*✓ Mode SET*_\n❏ Target : ${sub2 === 'dm'? 'Your DM' : 'Same Chat'}`);
        }
        if (sub === 'stats') {
            const chatsOn = Object.keys(db.chats).length;
            const cached = originalCache.size;
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
          - STATS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ANTIEDIT STATS*
│ ❏ Status : ${db.chats[chat]? 'ACTIVE' : 'INACTIVE'}
│ ❏ Global DMs : ${db._globalDM? 'ACTIVE' : 'INACTIVE'}
│ ❏ Mode : ${(db._mode || 'dm').toUpperCase()}
│ ❏ Chats ON : ${chatsOn}
│ ❏ Cache Size : ${cached} msgs
╰─────────────────────────╯`
            );
        }
        if (sub === 'clear') {
            db.chats = {};
            db._globalDM = false;
            db._mode = 'dm';
            saveDB(db);
            originalCache.clear();
            return reply(`_*֎ Settings Cleared*_\n❏ Status : OFF\n❏ Cache : Wiped`);
        }
        if (sub === 'list') {
            const active = Object.keys(db.chats);
            if (!active.length) return reply('_*❏ No Active Chats*_');
            let txt = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - ACTIVE LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ENABLED CHATS*\n`;
            active.slice(0, 20).forEach((id, i) => txt += `│ ${i+1}. ${id.includes('@g.us')? 'Group' : 'DM'} : ${id.split('@')[0]}\n`);
            txt += `╰─────────────────────────╯`;
            return reply(txt);
        }

        return reply('_*✐ Usage*_ : ֎antiedit on/off/onall/offall/mode/stats/clear/list');
    },

    cacheOriginal: (msgId, msgObj) => cacheOriginal(msgId, msgObj),

    onEdit: async (sock, updates) => {
        try {
            const db = loadDB();
            const botId = normJid(sock.user?.id);

            for (const update of updates) {
                if (!update.update?.editedMessage) continue;
                const remoteJid = update.key.remoteJid;
                if (!remoteJid) continue;

                const isGroup = remoteJid.includes('@g.us');
                const chatEnabled =!!db.chats[remoteJid];
                const globalEnabled =!isGroup &&!!db._globalDM;
                if (!chatEnabled &&!globalEnabled) continue;

                await new Promise(r => setTimeout(r, 800)); // wait for edit to process

                const senderJid = update.key.participant || remoteJid;
                if (!senderJid) continue;

                const timeStr = getTime(update.update.messageTimestamp || Math.floor(Date.now() / 1000));
                const cached = originalCache.get(update.key.id);
                const newMsg = update.update.editedMessage;

                const mode = db._mode || 'dm';
                const targetJid = mode === 'chat'? remoteJid : botId;

                await sendEditReport(sock, targetJid, senderJid, remoteJid, isGroup, timeStr, cached, newMsg)
                   .catch(e => console.error('[XADON AI ANTIEDIT SEND ERROR]', e.message));

                // update cache with new version
                originalCache.set(update.key.id, {
                    msgObj: newMsg,
                    text: getMessageContent(newMsg),
                    pushName: cached?.pushName || null,
                    timestamp: Date.now()
                });

                console.log(`[XADON AI ANTIEDIT] ${senderJid.split('@')[0]} edited in ${isGroup? 'Group' : 'DM'} → ${mode}`);
            }
        } catch (e) {
            console.error('[XADON AI ANTIEDIT ERROR]', e);
        }
    }
};