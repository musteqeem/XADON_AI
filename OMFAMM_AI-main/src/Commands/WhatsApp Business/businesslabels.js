const config = require('../../../settings/config');
const fs = require('fs');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const STORE_PATH = path.join(__dirname, '../../../data/labels.json');

// WhatsApp's app-state sync collection categories
const WA_PATCH_NAMES = ['critical_block', 'critical_unblock_low', 'regular_high', 'regular_low', 'regular'];

const getPhone = (jid) => jid?.split('@')[0]?.split(':')[0] || '';

// ── Local store ────────────────────────────────────────────────────
const loadStore = () => {
    try {
        if (fs.existsSync(STORE_PATH)) return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    } catch {}
    return { definitions: {}, chatLabels: {}, messageLabels: {} };
};

const saveStore = (data) => {
    try {
        fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    } catch {}
};

// ── Persistent listener ────────────────────────────────────────────
const attachListeners = (sock) => {
    if (sock.__labelsListenerAttached) return;

    sock.ev.on('labels.edit', (label) => {
        const store = loadStore();
        if (label.deleted) {
            delete store.definitions[label.id];
        } else {
            store.definitions[label.id] = {
                id: label.id,
                name: label.name,
                color: label.color,
                predefinedId: label.predefinedId
            };
        }
        saveStore(store);
    });

    sock.ev.on('labels.association', ({ type, association }) => {
        const store = loadStore();
        const isMessage = association.messageId!== undefined;
        const bucket = isMessage? store.messageLabels : store.chatLabels;
        const key = isMessage? `${association.chatId}:${association.messageId}` : association.chatId;

        if (!bucket[key]) bucket[key] = [];
        if (type === 'add') {
            if (!bucket[key].includes(association.labelId)) bucket[key].push(association.labelId);
        } else {
            bucket[key] = bucket[key].filter(id => id!== association.labelId);
        }
        saveStore(store);
    });

    sock.__labelsListenerAttached = true;
};

// ── Force full app-state sync ──────────────────────────────────────
const performFullSync = async (sock) => {
    const resetMap = {};
    for (const name of WA_PATCH_NAMES) resetMap[name] = null;
    await sock.authState.keys.set({ 'app-state-sync-version': resetMap });

    sock.ev.buffer?.();
    await sock.resyncAppState(WA_PATCH_NAMES, true);
    sock.ev.flush?.();

    await new Promise(r => setTimeout(r, 4000));
};

// Format a single label entry
const formatLabel = (label) =>
`❏ Name : ${label.name || 'Unnamed'}
❏ Color : ${label.color?? 'N/A'}${label.predefinedId? `\n❏ Type : Predefined (${label.predefinedId})` : ''}
❏ ID : ${label.id}`;

const USAGE = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LABELS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏.labels list : List all labels
│ ❏.labels sync : Force resync from WA
│ ❏.labels add [jid] [labelId] : Label chat
│ ❏.labels remove [jid] [labelId] : Remove label
│ ❏.labels msg [jid] [msgId] [labelId] : Label message
│ ❏.labels unmsg [jid] [msgId] [labelId] : Unlabel message
╰─────────────────────────╯
❏ Note: Only works on WhatsApp Business`;

module.exports = {
    name: 'labels',
    alias: ['label', 'tag', 'blabel'],
    desc: 'Manage WhatsApp Business labels',
    category: 'Business',
    usage: '.labels [list|sync|add|remove|msg|unmsg]',
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        attachListeners(sock);

        const action = args[0]?.toLowerCase();
        if (!action) return reply(USAGE);

        try {
            await sock.sendMessage(m.chat, { react: { text: '🏷️', key: m.key } });

            switch (action) {

                // ── LIST ───────────────────────────────────────────
                case 'list': {
                    let store = loadStore();
                    let all = Object.values(store.definitions);

                    if (all.length === 0) {
                        await reply(`⏳ ֎ No cached labels. Syncing from WhatsApp...`);
                        try {
                            await performFullSync(sock);
                        } catch (e) {
                            return reply(`✘ ֎ Sync failed: ${e.message}`);
                        }
                        store = loadStore();
                        all = Object.values(store.definitions);
                    }

                    if (all.length === 0) {
                        return reply(`✘ ֎ No labels found on this account.`);
                    }

                    const lines = all.map(formatLabel).join('\n\n─────────────────\n\n');
                    return await sock.sendMessage(m.chat, {
                        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LABELS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Total : ${all.length} label${all.length > 1? 's' : ''}

${lines}`
                    }, { quoted: m });
                }

                // ── SYNC ───────────────────────────────────────────
                case 'sync': {
                    await reply(`⏳ ֎ Resetting app-state and requesting full snapshot...`);
                    try {
                        await performFullSync(sock);
                    } catch (e) {
                        return reply(`✘ ֎ Sync failed: ${e.message}`);
                    }

                    const store = loadStore();
                    const all = Object.values(store.definitions);

                    if (all.length === 0) {
                        return reply(`✘ ֎ Sync complete but no labels found.`);
                    }

                    const lines = all.map(formatLabel).join('\n\n─────────────────\n\n');
                    return await sock.sendMessage(m.chat, {
                        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LABELS SYNC •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Status : Synced Successfully
❏ Total : ${all.length} labels

${lines}`
                    }, { quoted: m });
                }

                // ── ADD ────────────────────────────────────────────
                case 'add': {
                    const targetJid = args[1] || m.chat;
                    const labelId = args[2];
                    if (!labelId) return reply('✘ ֎ Usage:.labels add [jid] [labelId]');

                    await sock.addChatLabel(targetJid, labelId);

                    return await sock.sendMessage(m.chat, {
                        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LABEL •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Add
❏ Label : ${labelId}
❏ Chat : ${getPhone(targetJid)}
❏ Status : Applied Successfully`
                    }, { quoted: m });
                }

                // ── REMOVE ─────────────────────────────────────────
                case 'remove': {
                    const targetJid = args[1] || m.chat;
                    const labelId = args[2];
                    if (!labelId) return reply('✘ ֎ Usage:.labels remove [jid] [labelId]');

                    await sock.removeChatLabel(targetJid, labelId);

                    return await sock.sendMessage(m.chat, {
                        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LABEL •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Remove
❏ Label : ${labelId}
❏ Chat : ${getPhone(targetJid)}
❏ Status : Removed Successfully`
                    }, { quoted: m });
                }

                // ── MSG ────────────────────────────────────────────
                case 'msg':
                case 'message': {
                    const targetJid = args[1] || m.chat;
                    const msgId = args[2];
                    const labelId = args[3];
                    if (!msgId ||!labelId) return reply('✘ ֎ Usage:.labels msg [jid] [msgId] [labelId]');

                    await sock.addMessageLabel(targetJid, msgId, labelId);

                    return await sock.sendMessage(m.chat, {
                        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LABEL •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Label Message
❏ Label : ${labelId}
❏ Msg ID : ${msgId}
❏ Status : Applied Successfully`
                    }, { quoted: m });
                }

                // ── UNMSG ──────────────────────────────────────────
                case 'unmsg':
                case 'unmessage': {
                    const targetJid = args[1] || m.chat;
                    const msgId = args[2];
                    const labelId = args[3];
                    if (!msgId ||!labelId) return reply('✘ ֎ Usage:.labels unmsg [jid] [msgId] [labelId]');

                    await sock.removeMessageLabel(targetJid, msgId, labelId);

                    return await sock.sendMessage(m.chat, {
                        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LABEL •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Unlabel Message
❏ Label : ${labelId}
❏ Msg ID : ${msgId}
❏ Status : Removed Successfully`
                    }, { quoted: m });
                }

                default:
                    return reply(USAGE);
            }

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error('[LABELS ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Labels Error\n❏ Error: ${err.message}`);
        }
    }
};