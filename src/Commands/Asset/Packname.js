const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "stickerpk",
    alias: ['stpk', 'setpack', 'pk', 'steal'],
    desc: 'Steal sticker with custom pack and author name',
    category: "Tools",
    usage: ".pk <author name>",
    examples: [".pk XADON - reply to a sticker"],
    reactions: { start: '🥏', success: '😎', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🥏', key: m.key } });

        const author = args.join(' ').trim();
        if (!author) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} STICKER PK*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to a sticker with ${prefix}pk <author name>
╰─────────────────────────╯
╭─֎ *EXAMPLE*
│ ❏ ${prefix}pk ${BOT_NAME}
╰─────────────────────────╯`
            );
        }

        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        if (!/webp/.test(mime)) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Reply to a sticker only_`);
        }

        try {
            // Download original sticker buffer
            const stream = await downloadContentFromMessage(quoted.msg || quoted, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const originalSizeKB = buffer.length / 1024;
            const isAnimated = buffer.toString('hex', 0, 16).includes('414e494d');

            let finalBuffer = buffer;
            const qualities = [80, 70, 60, 50, 40, 30];

            // Re-encode helper
            const reencodeWithQuality = async (q, inputBuffer) => {
                const sticker = new Sticker(inputBuffer, {
                    pack: BOT_NAME,
                    author: author,
                    type: 'full',
                    quality: q
                });
                return await sticker.toBuffer();
            };

            // If already under 500KB, just apply metadata
            if (originalSizeKB <= 500) {
                finalBuffer = await reencodeWithQuality(80, buffer);
            } else {
                // Try decreasing quality
                for (const q of qualities) {
                    finalBuffer = await reencodeWithQuality(q, buffer);
                    if (finalBuffer.length / 1024 <= 500) break;
                }

                // FFmpeg fallback for animated stickers
                if (finalBuffer.length / 1024 > 500 && isAnimated) {
                    const tempDir = path.join(__dirname, '../../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                    const inputPath = path.join(tempDir, `steal_${Date.now()}.webp`);
                    const outputPath = path.join(tempDir, `steal_out_${Date.now()}.webp`);

                    fs.writeFileSync(inputPath, buffer);

                    const cmd = `ffmpeg -y -i "${inputPath}" -vf "fps=8,scale=512:512:force_original_aspect_ratio=increase,crop=512:512:(iw-ow)/2:(ih-oh)/2,format=yuva420p" -c:v libwebp -lossless 0 -q:v 30 -loop 0 -an -preset default -compression_level 6 "${outputPath}"`;

                    await new Promise((resolve, reject) => {
                        exec(cmd, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });

                    finalBuffer = fs.readFileSync(outputPath);
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);

                    if (finalBuffer.length / 1024 <= 500) {
                        finalBuffer = await reencodeWithQuality(30, finalBuffer);
                    }
                }

                if (finalBuffer.length / 1024 > 500) {
                    await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                    return reply(`✘ _Sticker too complex. Try a smaller sticker_`);
                }
            }

            await sock.sendMessage(m.chat, { sticker: finalBuffer }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '😎', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} STICKERPK ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} STICKER PK*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to steal sticker
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};