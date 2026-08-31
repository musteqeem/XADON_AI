const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker } = require('wa-sticker-formatter');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "take",
    alias: ['takesticker', 'takes', 'steal'],
    desc: 'Steal sticker and save with custom pack',
    category: "Tools",
    usage: ".take",
    examples: [".take - reply to a sticker"],
    reactions: { start: '🥏', success: '😎', error: '✘' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🥏', key: m.key } });

        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        if (!/webp/.test(mime)) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Reply to a sticker._`);
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

            const reencodeWithQuality = async (q) => {
                const sticker = new Sticker(buffer, {
                    pack: BOT_NAME,
                    author: 'XADON',
                    type: 'full',
                    quality: q
                });
                return await sticker.toBuffer();
            };

            // If under 500KB, just apply metadata
            if (originalSizeKB <= 500) {
                finalBuffer = await reencodeWithQuality(80);
            } else {
                // Try decreasing quality
                const qualities = [70, 60, 50, 40, 30];
                for (const q of qualities) {
                    finalBuffer = await reencodeWithQuality(q);
                    if (finalBuffer.length / 1024 <= 500) break;
                }

                // FFmpeg fallback for animated stickers
                if (finalBuffer.length / 1024 > 500 && isAnimated) {
                    const tempDir = path.join(__dirname, '../../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                    const inputPath = path.join(tempDir, `take_${Date.now()}.webp`);
                    const outputPath = path.join(tempDir, `take_out_${Date.now()}.webp`);

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
                        const sticker = new Sticker(finalBuffer, {
                            pack: BOT_NAME,
                            author: 'XADON',
                            type: 'full',
                            quality: 30
                        });
                        finalBuffer = await sticker.toBuffer();
                    }
                }

                if (finalBuffer.length / 1024 > 500) {
                    await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                    return reply(`✘ _Sticker too complex to fit WhatsApp limit even after compression._`);
                }
            }

            await sock.sendMessage(m.chat, { sticker: finalBuffer }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '😎', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} TAKE ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            reply(`✘ _Failed to take sticker._`);
        }
    }
};