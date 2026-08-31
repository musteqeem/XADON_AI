const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { spawn } = require('child_process');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "tovn",
    alias: ["tovoice", "mediavoice", "voice", "tomp3"],
    category: "Tools",
    desc: "Convert any audio/video to a voice note",
    usage: ".tovn (reply to audio/video)",
    reactions: {
        start: '🔊',
        success: '✓'
    },

    execute: async (sock, m, { reply }) => {
        try {
            // 1. Check for quoted media
            const quoted = m.quoted ? m.quoted : m;
            const msg = quoted.msg || quoted;
            const mime = msg.mimetype || '';

            if (!/audio|video/.test(mime)) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} MEDIA TO VOICE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Reply to any audio or video
│ ❏ ${prefix}tovn
│ ❏ Converts to WhatsApp voice note
╰─────────────────────────╯
❏ Supported: mp4, mp3, wav, ogg, webm`;
                return reply(help);
            }

            await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
            await reply('֎ Converting to voice note...');

            // 2. Download media
            const type = mime.startsWith('video') ? 'video' : 'audio';
            const stream = await downloadContentFromMessage(msg, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            if (buffer.length < 1000) {
                return reply('✘ ֎ Media file is too small or corrupted');
            }

            // 3. Convert media to voice note (ogg/opus) using ffmpeg
            const ffmpeg = spawn('ffmpeg', [
                '-i', 'pipe:0',
                '-vn', // no video
                '-c:a', 'libopus',
                '-b:a', '64k',
                '-ar', '48000',
                '-ac', '1',
                '-vbr', 'on',
                '-f', 'ogg',
                'pipe:1'
            ]);

            ffmpeg.stdin.write(buffer);
            ffmpeg.stdin.end();

            let voBuffer = Buffer.from([]);
            ffmpeg.stdout.on('data', chunk => voBuffer = Buffer.concat([voBuffer, chunk]));

            const ffErr = [];
            ffmpeg.stderr.on('data', d => ffErr.push(d.toString()));

            ffmpeg.on('close', async code => {
                if (code !== 0 || !voBuffer.length) {
                    console.error('[TOVN FFMPEG ERROR]:', ffErr.join(''));
                    await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
                    return reply(`✘ ֎ Failed to convert media to voice note\n❏ FFmpeg error: ${ffErr.join('').slice(-200)}`);
                }

                // 4. Send as voice note
                await sock.sendMessage(m.chat, { 
                    audio: voBuffer, 
                    ptt: true,
                    mimetype: 'audio/ogg; codecs=opus'
                }, { quoted: m });
                
                await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });
            });

            // Timeout protection
            setTimeout(() => {
                if (!ffmpeg.killed) {
                    ffmpeg.kill('SIGKILL');
                    reply('✘ ֎ Conversion timed out');
                }
            }, 60000);

        } catch (err) {
            console.error('[TOVN ERROR]:', err);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Failed to convert media to voice note\n❏ Error: ${err.message}`);
        }
    }
};