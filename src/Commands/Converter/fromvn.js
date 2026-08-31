const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { spawn } = require('child_process');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "fromvn",
    alias: ["tomp3", "vn2mp3", "voicetomp3"],
    category: "Tools",
    desc: "Convert voice note to MP3 file",
    usage: ".fromvn (reply to voice note)",
    reactions: {
        start: '🎙️',
        success: '🎵'
    },

    execute: async (sock, m, { reply }) => {
        try {
            const quoted = m.quoted ? m.quoted : m;
            const msg = quoted.msg || quoted;
            const mime = msg.mimetype || '';

            // Check if it's a voice note or audio
            if (!mime.includes('audio')) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VOICE TO MP3 •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Reply to any voice note
│ ❏ ${prefix}fromvn
│ ❏ Converts PTT to MP3 file
╰─────────────────────────╯
❏ Output: 320kbps MP3 file`;
                return reply(help);
            }

            await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
            await reply('֎ Converting voice note to MP3...');

            // 1. Download voice note
            const stream = await downloadContentFromMessage(msg, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            if (buffer.length < 1000) {
                return reply('✘ ֎ Voice note is too small or corrupted');
            }

            // 2. Convert ogg/opus to mp3 using ffmpeg
            const ffmpeg = spawn('ffmpeg', [
                '-i', 'pipe:0',
                '-c:a', 'libmp3lame',
                '-b:a', '320k', // High quality
                '-ar', '44100',
                '-ac', '2',
                '-f', 'mp3',
                'pipe:1'
            ]);

            ffmpeg.stdin.write(buffer);
            ffmpeg.stdin.end();

            let mp3Buffer = Buffer.from([]);
            ffmpeg.stdout.on('data', chunk => mp3Buffer = Buffer.concat([mp3Buffer, chunk]));

            const ffErr = [];
            ffmpeg.stderr.on('data', d => ffErr.push(d.toString()));

            ffmpeg.on('close', async code => {
                if (code !== 0 || !mp3Buffer.length) {
                    console.error('[FROMVN FFMPEG ERROR]:', ffErr.join(''));
                    await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
                    return reply(`✘ ֎ Failed to convert to MP3\n❏ FFmpeg error: ${ffErr.join('').slice(-200)}`);
                }

                // 3. Send as MP3 document
                await sock.sendMessage(m.chat, { 
                    document: mp3Buffer,
                    fileName: `XADON_VN_${Date.now()}.mp3`,
                    mimetype: 'audio/mpeg',
                    caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} MP3 CONVERTED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Format: MP3 320kbps
❏ Size: ${(mp3Buffer.length / 1024).toFixed(2)} KB`
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
            console.error('[FROMVN ERROR]:', err);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Failed to convert voice note\n❏ Error: ${err.message}`);
        }
    }
};