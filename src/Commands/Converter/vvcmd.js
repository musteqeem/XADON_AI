const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const DB_PATH = path.join(process.cwd(), 'database', 'vvcmd.json')

let triggers = {}
try {
    if (fs.existsSync(DB_PATH)) triggers = JSON.parse(fs.readFileSync(DB_PATH))
} catch {}

function saveDB() {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(triggers, null, 2))
}

// ── Called on every message — exact same flow as.vvp ────────
module.exports.handleVVReply = async function(sock, m) {
    try {
        const sender = m.sender
        const trigger = triggers[sender]
        if (!trigger) return

        // Text must be exactly the trigger emoji
        const text = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            ''
        ).trim()
        if (text!== trigger) return

        // ── EXACT SAME AS.vvp FROM HERE ─────────────────────

        // Must reply to something
        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted) return

        // unwrap ephemeral
        if (quoted.ephemeralMessage) quoted = quoted.ephemeralMessage.message
        // unwrap viewOnce
        if (quoted.viewOnceMessage) quoted = quoted.viewOnceMessage.message

        const type = Object.keys(quoted)[0]
        if (!['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage'].includes(type)) return

        await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        // Download
        const stream = await downloadContentFromMessage(
            quoted[type],
            type.replace('Message', '').toLowerCase()
        )

        let buffer = Buffer.alloc(0)
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (buffer.length < 1000) return

        const sendType =
            type === 'videoMessage'? 'video' :
            type === 'imageMessage'? 'image' :
            type === 'stickerMessage'? 'sticker' :
            type === 'audioMessage'? 'audio' : null

        if (!sendType) return

        // Send to DM — same as.vvp
        await sock.sendMessage(sender, {
            [sendType]: buffer,
            caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV AUTO SAVE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ View-once saved privately
❏ Trigger: ${trigger}`
        })

        // Delete the emoji reply to keep chat clean
        await sock.sendMessage(m.chat, { delete: m.key }).catch(() => {})
        await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });

        console.log(`[VVCMD] Sent to ${sender.split('@')[0]} via "${trigger}"`)

    } catch (err) {
        console.error('[VVCMD ERROR]', err.message)
    }
}

// ── Command ───────────────────────────────────────────────────
module.exports = {
    name: 'vvcmd',
    alias: ['setvv', 'vvtrigger'],
    category: 'Media',
    desc: 'Set emoji trigger to auto-save view-once to DM',
    usage: '.vvcmd <emoji> |.vvcmd off |.vvcmd status',
    reactions: { start: '👁️', success: '✓' },

    execute: async (sock, m, { args, reply, prefix }) => {

        const sender = m.sender
        const sub = args[0]

        //.vvcmd 👌 — set emoji
        if (sub && sub!== 'off' && sub!== 'status') {
            triggers[sender] = sub
            saveDB()
            let msg = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV TRIGGER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Trigger set: ${sub}
❏ How it works:
❏ 1. Reply to any view-once
❏ 2. Send only: ${sub}
❏ 3. Bot auto DMs you the media
❏ 4. Your emoji gets deleted`;
            return reply(msg)
        }

        //.vvcmd off
        if (sub === 'off') {
            delete triggers[sender]
            saveDB()
            return reply('✓ ֎ VV Trigger removed successfully')
        }

        //.vvcmd status
        if (sub === 'status') {
            const current = triggers[sender]
            let msg = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Current Trigger: ${current || '✘ Not set'}
❏ Use ${prefix}vvcmd <emoji> to set`;
            return reply(msg)
        }

        // Help
        let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VV CMD •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}vvcmd 😈 : Set emoji trigger
│ ❏ ${prefix}vvcmd off : Remove trigger
│ ❏ ${prefix}vvcmd status: Check trigger
╰─────────────────────────╯
❏ Reply to view-once with your emoji
❏ Bot will auto send to your DM and delete the reply`;
        return reply(help)
    }
}