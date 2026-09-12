/**
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * XADON AI • ANTI DELETE
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * Recovers deleted msgs: text, media, docs, stickers, contacts, location
 */

const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@musteqeem/baileys');

const DB_PATH = path.join(process.cwd(), 'database', 'antidelete.json');
const CACHE_TTL = 60 * 60 * 1000; // 1hr cache

if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}');

const loadDB = () => {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
};
const saveDB = (data) => {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// ✅ In-memory cache for deleted msgs
const messageCache = new Map();

function getTime(timestamp) {
    const date = new Date((timestamp || Date.now() / 1000) * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
}

function normJid(jid) { return jid?.replace(/:\d+@/, '@'); }

function resolveType(message) {
    if (!message) return null;
    const types = [
        'imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage',
        'documentMessage', 'contactMessage', 'extendedTextMessage',
        'locationMessage', 'conversation'
    ];
    return types.find(type => message[type]) || null;
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

async function buildCaption(sock, msgObj, chatJid, isGroup) {
    let participant = msgObj?.key?.participant || msgObj?.key?.remoteJid;
    if (!participant && msgObj?.message) {
        for (const type of Object.keys(msgObj.message)) {
            if (msgObj.message[type]?.contextInfo?.participant) {
                participant = msgObj.message[type].contextInfo.participant;
                break;
            }
        }
    }
    if (!participant) return { header: '', footer: '', sender: null };

    const sender = normJid(participant);
    const senderNum = sender.split('@')[0];
    const pushName = msgObj.pushName || senderNum;
    const timeStr = getTime(msgObj.messageTimestamp);

    let header = '';
    if (isGroup) {
        let groupName = 'Unknown Group';
        try { groupName = (await sock.groupMetadata(chatJid)).subject || groupName; } catch {}
        header += `│ ❏ Group : ${groupName}\n`;
    }
    header += `│ ❏ User : @${senderNum}`;
    if (pushName!== senderNum) header += ` (${pushName})`;
    header += `\n`;

    return {
        header: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - DELETED MESSAGE •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RECOVERY CORE*\n${header}╰─────────────────────────╯\n\n`,
        footer: `\n╭─֎ *TIMESTAMP*\n│ ❏ ${timeStr}\n╰─────────────────────────╯`,
        sender
    };
}

async function sendDeletedMsg(sock, targetJid, msgObj, chatJid, isGroup) {
    const message = msgObj?.message;
    if (!message) return;

    const msgType = resolveType(message);
    if (!msgType) return;

    const { header, footer, sender } = await buildCaption(sock, msgObj, chatJid, isGroup);
    if (!sender) return;
    const mentions = [sender];

    try {
        if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
            const text = message.conversation || message.extendedTextMessage?.text || '[empty]';
            return sock.sendMessage(targetJid, { text: header + `│ ❏ ${text}` + footer, mentions });
        }
        if (msgType === 'imageMessage') {
            const buffer = await downloadMedia(message, msgType);
            const caption = message.imageMessage?.caption || '[No caption]';
            return buffer
               ? sock.sendMessage(targetJid, { image: buffer, caption: header + `│ ❏ ${caption}` + footer, mentions })
                : sock.sendMessage(targetJid, { text: header + `│ ❏ [Image - Failed to recover]` + footer, mentions });
        }
        if (msgType === 'videoMessage') {
            const buffer = await downloadMedia(message, msgType);
            const caption = message.videoMessage?.caption || '[No caption]';
            return buffer
               ? sock.sendMessage(targetJid, { video: buffer, caption: header + `│ ❏ ${caption}` + footer, mentions })
                : sock.sendMessage(targetJid, { text: header + `│ ❏ [Video - Failed to recover]` + footer, mentions });
        }
        if (msgType === 'audioMessage') {
            const buffer = await downloadMedia(message, msgType);
            const isPtt = message.audioMessage?.ptt || false;
            if (buffer) {
                await sock.sendMessage(targetJid, { audio: buffer, mimetype: 'audio/mpeg', ptt: isPtt });
                return sock.sendMessage(targetJid, { text: header + `│ ❏ [Voice Note]` + footer, mentions });
            }
            return sock.sendMessage(targetJid, { text: header + `│ ❏ [Voice - Failed to recover]` + footer, mentions });
        }
        if (msgType === 'stickerMessage') {
            const buffer = await downloadMedia(message, msgType);
            if (buffer) {
                await sock.sendMessage(targetJid, { sticker: buffer });
                return sock.sendMessage(targetJid, { text: header + `│ ❏ [Sticker]` + footer, mentions });
            }
            return sock.sendMessage(targetJid, { text: header + `│ ❏ [Sticker - Failed to recover]` + footer, mentions });
        }
        if (msgType === 'documentMessage') {
            const buffer = await downloadMedia(message, msgType);
            const fileName = message.documentMessage?.fileName || 'document';
            const mimetype = message.documentMessage?.mimetype || 'application/octet-stream';
            return buffer
               ? sock.sendMessage(targetJid, { document: buffer, mimetype, fileName, caption: header + `│ ❏ ${fileName}` + footer, mentions })
                : sock.sendMessage(targetJid, { text: header + `│ ❏ [Document: ${fileName} - Failed]` + footer, mentions });
        }
        if (msgType === 'contactMessage') {
            const name = message.contactMessage?.displayName || 'Unknown';
            return sock.sendMessage(targetJid, { text: header + `│ ❏ [Contact: ${name}]` + footer, mentions });
        }
        if (msgType === 'locationMessage') {
            const { degreesLatitude, degreesLongitude } = message.locationMessage;
            await sock.sendMessage(targetJid, { location: { degreesLatitude, degreesLongitude } });
            return sock.sendMessage(targetJid, { text: header + `│ ❏ [Location]` + footer, mentions });
        }
        return sock.sendMessage(targetJid, { text: header + `│ ❏ [Unsupported type]` + footer, mentions });
    } catch (err) {
        console.error('[XADON AI ANTIDELETE ERROR]', err.message);
    }
}

// ── COMMAND MODULE ──────────────────────────────────────────────
module.exports = {
    name: 'antidelete',
    alias: ['ad'],
    desc: 'Recover deleted messages with core',
    category: 'Admin',
    groupOnly: false,
    adminOnly: true,
    reactions: { start: '🗑️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const db = loadDB();
        const chat = m.chat;
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            const chatStatus = db[chat]? 'ACTIVE' : 'INACTIVE';
            const globalDM = db._globalDM? 'ACTIVE' : 'INACTIVE';
            const mode = db._mode || 'dm';
            const chatsOn = Object.keys(db).filter(k =>!k.startsWith('_') && db[k]).length;

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • ANTI DELETE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Chat Status : ${chatStatus}
│ ❏ Global DMs : ${globalDM}
│ ❏ Mode : ${mode.toUpperCase()}
│ ❏ Chats ON : ${chatsOn}
│ ❏ Toggle : antidelete on/off
│ ❏ Global : antidelete onall/offall
│ ❏ Mode : antidelete mode dm/chat
│ ❏ Stats : antidelete stats
│ ❏ Clear : antidelete clear
│ ❏ List : antidelete list
╰─────────────────────────╯`
            );
        }

        if (sub === 'on') {
            db[chat] = true;
            saveDB(db);
            return reply(`_*◉ Anti Delete ACTIVE*_\n❏ Scope : This Chat`);
        }
        if (sub === 'off') {
            delete db[chat];
            saveDB(db);
            return reply(`_*◉ Anti Delete INACTIVE*_\n❏ Scope : This Chat`);
        }
        if (sub === 'onall') {
            db._globalDM = true;
            saveDB(db);
            return reply(`_*◉ Anti Delete ACTIVE*_\n❏ Scope : All Private Chats`);
        }
        if (sub === 'offall') {
            db._globalDM = false;
            saveDB(db);
            return reply(`_*◉ Anti Delete INACTIVE*_\n❏ Scope : All Private Chats`);
        }
        if (sub === 'mode') {
            const mode = args[1]?.toLowerCase();
            if (!mode ||!['dm', 'chat'].includes(mode)) return reply('_*✐ Usage*_ : ֎antidelete mode dm/chat');
            db._mode = mode;
            saveDB(db);
            return reply(`_*✓ Mode SET*_\n❏ Target : ${mode === 'dm'? 'Your DM' : 'Same Chat'}`);
        }
        if (sub === 'stats') {
            const chatsOn = Object.keys(db).filter(k =>!k.startsWith('_') && db[k]).length;
            const cached = messageCache.size;
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
          • STATS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ANTIDELETE STATS*
│ ❏ Status : ${db[chat]? 'ACTIVE' : 'INACTIVE'}
│ ❏ Global DMs : ${db._globalDM? 'ACTIVE' : 'INACTIVE'}
│ ❏ Mode : ${(db._mode || 'dm').toUpperCase()}
│ ❏ Chats ON : ${chatsOn}
│ ❏ Cache Size : ${cached} msgs
╰─────────────────────────╯`
            );
        }
        if (sub === 'clear') {
            db[chat] = false;
            delete db._globalDM;
            delete db._mode;
            saveDB(db);
            messageCache.clear();
            return reply(`_*֎ Settings Cleared*_\n❏ Status : OFF\n❏ Cache : Wiped`);
        }
        if (sub === 'list') {
            const active = Object.keys(db).filter(k =>!k.startsWith('_') && db[k]);
            if (!active.length) return reply('_*❏ No Active Chats*_');
            let txt = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - ACTIVE LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ENABLED CHATS*\n`;
            active.slice(0, 20).forEach((id, i) => txt += `│ ${i+1}. ${id.includes('@g.us')? 'Group' : 'DM'} : ${id.split('@')[0]}\n`);
            txt += `╰─────────────────────────╯`;
            return reply(txt);
        }

        return reply('_*✐ Usage*_ : ֎antidelete on/off/onall/offall/mode/stats/clear/list');
    },

    cacheMessage: (msg) => {
        if (!msg?.key?.id ||!msg?.key?.remoteJid) return;
        const key = msg.key.remoteJid + ':' + msg.key.id;
        messageCache.set(key, msg);
        setTimeout(() => messageCache.delete(key), CACHE_TTL);
    },

    onDelete: async (sock, updates, store) => {
        try {
            const db = loadDB();
            const botId = normJid(sock.user?.id);

            for (const update of updates) {
                if (!update?.key) continue;
                const isDeleted = update.update?.message === null || update.update?.messageStubType === 1;
                if (!isDeleted) continue;

                const remoteJid = update.key.remoteJid;
                if (!remoteJid) continue;

                const isGroup = remoteJid.includes('@g.us');
                const chatEnabled =!!db[remoteJid];
                const globalEnabled =!isGroup &&!!db._globalDM;
                if (!chatEnabled &&!globalEnabled) continue;

                const cacheKey = remoteJid + ':' + update.key.id;
                let msgObj = messageCache.get(cacheKey);

                if (!msgObj && store?.loadMessage) {
                    try { msgObj = await store.loadMessage(remoteJid, update.key.id); } catch {}
                }
                if (!msgObj && store?.messages?.get) {
                    msgObj = store.messages.get(cacheKey)?.message || store.messages.get(cacheKey);
                }
                if (!msgObj) continue;

                const mode = db._mode || 'dm';
                const targetJid = mode === 'chat'? remoteJid : botId;
                await sendDeletedMsg(sock, targetJid, msgObj, remoteJid, isGroup);
                console.log(`[XADON AI ANTIDELETE] ${normJid(update.key.participant || remoteJid).split('@')[0]} → ${mode}`);
            }
        } catch (err) {
            console.error('[XADON AI ANTIDELETE FATAL]', err);
        }
    }
};