const { applyEffect } = require("../Core/,,.js");
const axios = require("axios");
const FormData = require("form-data");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const CDN_URL = "https://cdn.crysnovax.link";

async function uploadToCDN(buffer) {
    const form = new FormData();
    form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
    const res = await axios.post(CDN_URL + "/upload", form, {
        headers: form.getHeaders(),
        timeout: 30000
    });
    return res.data?.url || res.data?.file || res.data?.link || null;
}

async function downloadQuotedImage(msg) {
    try {
        if (typeof msg.download === "function") return await msg.download();
    } catch {}
    const { downloadContentFromMessage } = require("@crysnovax/baileys-stable");
    const type = msg.message?.imageMessage? "imageMessage" : "stickerMessage";
    const stream = await downloadContentFromMessage(msg.message[type], "image");
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function getProfilePicture(sock, jid) {
    try {
        return await sock.profilePictureUrl(jid, "image");
    } catch {
        return null;
    }
}

module.exports = {
    name: "fakecall",
    alias: ['fcall', 'fakephone'],
    desc: 'Create a fake incoming call screenshot',
    category: "Maker",
    usage: ".fakecall <name> | <status> - reply to image/user",
    examples: [".fakecall John | Calling...", ".fakecall reply to image", ".fakecall @user"],
    reactions: { start: '📞', success: '✨', error: '🎭' },

    execute: async (sock, m, { args, reply, mentioned, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '📞', key: m.key } });

        const text = args.join(" ").trim();
        const [nameRaw, statusRaw] = text.split("|").map(v => v.trim());
        const name = nameRaw || "Unknown";
        const status = statusRaw || "Calling...";

        let avatarUrl = "https://avatars.githubusercontent.com/u/214034378?v=4";
        let avatarType = "default";

        try {
            let gotImage = false;

            // 1. Quoted image
            if (m.quoted) {
                const qType = m.quoted.mtype || "";
                if (qType.includes("image") || qType.includes("sticker")) {
                    const buf = await downloadQuotedImage(m.quoted);
                    if (buf && buf.length > 0) {
                        avatarUrl = await uploadToCDN(buf);
                        avatarType = "quoted image";
                        gotImage = true;
                    }
                }
                // 2. Quoted user profile
                else if (m.quoted.sender) {
                    const pp = await getProfilePicture(sock, m.quoted.sender);
                    if (pp) {
                        avatarUrl = pp;
                        avatarType = "quoted user";
                        gotImage = true;
                    }
                }
            }

            // 3. Mentioned user
            if (!gotImage && mentioned?.length > 0) {
                const pp = await getProfilePicture(sock, mentioned[0]);
                if (pp) {
                    avatarUrl = pp;
                    avatarType = "tagged user";
                    gotImage = true;
                }
            }

            // 4. Sender profile
            if (!gotImage) {
                const pp = await getProfilePicture(sock, m.sender);
                if (pp) {
                    avatarUrl = pp;
                    avatarType = "your profile";
                }
            }

            // Call external API
            const { data } = await axios.get("https://api.zenzxz.my.id/maker/fakecall", {
                params: { nama: name, durasi: status, avatar: avatarUrl },
                responseType: "arraybuffer",
                timeout: 30000
            });

            if (!data) return reply(`✘ Failed to create fake call`);

            await sock.sendMessage(m.chat, {
                image: Buffer.from(data),
                mimetype: "image/jpeg",
                caption: `📞 _Fake call from ${name} by ${BOT_NAME}_\n_Using ${avatarType}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} FAKECALL ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });

            if (err.code === "ECONNABORTED")
                return reply(`✘ Request timed out. Try again.`);

            return reply(`✘ Failed to generate fake call image`);
        }
    }
};