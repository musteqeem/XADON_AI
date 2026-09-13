const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const ffmpegPath = require('ffmpeg-static');

module.exports = {
    name: 'emojimix',
    alias: ['mixemoji'],
    category: 'Hype-Fun',
    desc: 'Mix two supported emojis into a sticker using a public image endpoint',
    usage: '.emojimix 😎 + 🥰',
    reactions: { start: '🧩', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const input = args.join(' ').trim();
        const [first, second] = input.split('+').map(value => value.trim());

        if (!first || !second) {
            return reply('🧩 Usage: .emojimix 😎 + 🥰');
        }

        const encoded = `${encodeURIComponent(first)}_${encodeURIComponent(second)}`;
        const imageUrl = `https://emojik.vercel.app/s/${encoded}?size=512`;
        const tempDir = path.join(process.cwd(), 'temp', 'emojimix');
        const pngFile = path.join(tempDir, `${Date.now()}-${process.pid}.png`);
        const webpFile = path.join(tempDir, `${Date.now()}-${process.pid}.webp`);

        try {
            fs.mkdirSync(tempDir, { recursive: true });

            const response = await fetch(imageUrl, {
                headers: { 'User-Agent': 'XADON-AI/3.0' }
            });
            if (!response.ok) throw new Error(`Emoji service returned HTTP ${response.status}.`);

            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(pngFile, buffer);

            if (!ffmpegPath) throw new Error('FFmpeg is not available.');

            await execFileAsync(ffmpegPath, [
                '-y', '-i', pngFile,
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-c:v', 'libwebp',
                '-lossless', '1',
                webpFile
            ]);

            if (!fs.existsSync(webpFile)) throw new Error('Sticker conversion failed.');

            await sock.sendMessage(m.chat, {
                sticker: fs.readFileSync(webpFile)
            }, { quoted: m });
        } catch (error) {
            console.error('[EMOJIMIX ERROR]', error);
            return reply(`❌ Emoji mix failed: ${error.message}`);
        } finally {
            for (const file of [pngFile, webpFile]) {
                try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {}
            }
        }
    }
};
