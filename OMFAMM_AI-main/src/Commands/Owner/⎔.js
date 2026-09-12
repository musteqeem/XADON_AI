// =============================================
// SSCMD TRIGGER - SAVE STATUS TO DM
// =============================================

const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const DB_PATH = path.join(process.cwd(), 'database', 'sscmd.json');
let triggers = {};

try {
    if (fs.existsSync(DB_PATH)) {
        triggers = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
} catch {}

function saveDB() {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(triggers, null, 2));
}

function getOwnerJid() {
    const num = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
    return num ? `${num}@s.whatsapp.net` : null;
}

// ═══════════════
// REPLY TRIGGER - SAME AS .savestatus DOWNLOAD
// ═══════════════
async function handleSSReply(sock, m) {
    try {
        const sender = m.sender;
        const trigger = triggers[sender];
        if (!trigger) return;

        // Text extraction
        const text = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            ''
        ).trim();

        if (text !== trigger) return;

        // Must reply to a media message
        if (!m.quoted) return;
        const quoted = m.quoted;
        const mtype = quoted.mtype;
        const validTypes = [
            'imageMessage',
            'videoMessage',
            'audioMessage',
            'stickerMessage',
            'documentMessage'
        ];
        if (!validTypes.includes(mtype)) return;

        // Download buffer
        const buffer = await quoted.download();
        if (!buffer || !buffer.length) return;

        const caption = quoted.text || quoted.caption || '';
        const target = getOwnerJid() || sender;

        // Send to DM
        if (mtype === 'imageMessage') {
            await sock.sendMessage(target, {
                image: buffer,
                caption: caption || `📸 _Saved status by ${BOT_NAME}_`
            });
        } else if (mtype === 'videoMessage') {
            await sock.sendMessage(target, {
                video: buffer,
                caption: caption || `🎥 _Saved status by ${BOT_NAME}_`,
                mimetype: 'video/mp4'
            });
        } else if (mtype === 'audioMessage') {
            await sock.sendMessage(target, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false
            });
        } else if (mtype === 'stickerMessage') {
            await sock.sendMessage(target, { sticker: buffer });
        } else if (mtype === 'documentMessage') {
            await sock.sendMessage(target, {
                document: buffer,
                mimetype: quoted.mimetype || 'application/octet-stream',
                fileName: quoted.fileName || 'status_file'
            });
        }

        // Delete the trigger reply
        await sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});

        console.log(`[${BOT_NAME} SSCMD] Status saved to ${target.split('@')[0]} via "${trigger}"`);

    } catch (err) {
        console.error(`[${BOT_NAME} SSCMD ERROR]`, err.message);
    }
}

// ═══════════════════════════════════════════════
// SSCMD COMMAND
// ═══════════════════════════════════════════════
module.exports = {
    name: 'sscmd',
    alias: ['setss', 'sstrigger'],
    desc: 'Set emoji trigger to save status to your DM',
    category: 'Owner',
    ownerOnly: true,
    usage: '.sscmd <emoji> | off | status',
    examples: ['.sscmd 🔥', '.sscmd off', '.sscmd status'],
    reactions: { start: '📥', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const sender = m.sender;
        const input = args[0];

        // SET trigger
        if (input && input !== 'off' && input !== 'status') {
            triggers[sender] = input;
            saveDB();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SS TRIGGER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SET*
│ ❏ Emoji : ${input}
│
╭─֎ *HOW TO USE*
│ ❏ Reply to any status with ${input}
│ ❏ It will be saved to your DM
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // REMOVE
        if (input === 'off') {
            delete triggers[sender];
            saveDB();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SS TRIGGER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *REMOVED*
│ ❏ Status: Trigger deleted
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // CHECK
        if (input === 'status') {
            const current = triggers[sender];
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SS TRIGGER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Current : ${current || 'NOT SET'}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // HELP
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SS TRIGGER HELP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}sscmd <emoji>  → set trigger
│ ❏ ${prefix}sscmd off      → remove trigger
│ ❏ ${prefix}sscmd status   → check trigger
│
╭─֎ *INFO*
│ ❏ Reply to any status with your emoji
│ ❏ Status will be forwarded to your DM
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};

// Export the reply handler for your message handler
module.exports.handleSSReply = handleSSReply;