const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "tovv",
    alias: ["viewonce", "vonce", "vv"],
    category: "Converter",
    desc: "Convert media to view once",
    usage: ".tovv (reply to image/video/document)",

    reactions: {
        start: "👁️",
        success: "✓"
    },

    execute: async (sock, m, { reply, prefix }) => {

        try {
            // ── Detect Media ─────────────────────────
            const quoted = m.quoted ? m.quoted : m;
            const msg = quoted.msg || quoted;
            const mime = msg.mimetype || "";

            if (!/image|video|document/.test(mime)) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VIEW ONCE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Reply to an image, video, or document
│ ❏ ${prefix}tovv
│ ❏ Converts to view once message
╰─────────────────────────╯
❏ Note: Can only be opened 1 time`;
                return reply(help);
            }

            await sock.sendMessage(m.chat, {
                react: { text: "⏳", key: m.key }
            });
            await reply('֎ Converting to view once...');

            // ── Download Media ───────────────────────
            const type = mime.startsWith("video") ? "video" : mime.startsWith("document") ? "document" : "image";

            const stream = await downloadContentFromMessage(
                msg,
                type
            );

            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (buffer.length < 1000) {
                return reply('✘ ֎ Media file is too small or corrupted');
            }

            // ── Send as View Once ────────────────────
            const caption = quoted.text || quoted.caption || `֎ Sent via ${BOT_NAME}`;

            const sendObj = {
                viewOnce: true,
                caption: caption
            };

            if (type === "image") {
                sendObj.image = buffer;
            } else if (type === "video") {
                sendObj.video = buffer;
            } else {
                sendObj.document = buffer;
                sendObj.fileName = `XADON_VONCE_${Date.now()}`;
                sendObj.mimetype = mime;
            }

            await sock.sendMessage(m.chat, sendObj, { quoted: m });

            await sock.sendMessage(m.chat, {
                react: { text: "✓", key: m.key }
            });

        } catch (err) {
            console.error("[TOVV ERROR]:", err);
            await sock.sendMessage(m.chat, {
                react: { text: "✘", key: m.key }
            });
            reply(`✘ ֎ Failed to convert media to view once\n❏ Error: ${err.message}`);
        }
    }
};