const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const execPromise = promisify(exec);
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'tts',
    alias: ['say', 'speak', 'voice', 'gtts'],
    category: 'Tools',
    desc: 'Text to speech with 20+ languages',
    usage: '.tts <text> |.tts <lang> <text> |.tts (reply to text)',

    execute: async (sock, m, { reply, args, quoted, prefix }) => {
        let text = args.join(' ') || quoted?.text;
        if (!text) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} TEXT TO SPEECH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ ${prefix}tts Hello world
│ ❏ ${prefix}tts en Hello world
│ ❏ ${prefix}tts (reply to message)
╰─────────────────────────╯
╭─֎ *SUPPORTED LANGS*
│ ❏ en, es, fr, de, id, ja, ko
│ ❏ ar, pt, ru, hi, zh, yo, ha, ig
│ ❏ tr, it, nl, pl, th, vi
╰─────────────────────────╯`;
            return reply(help);
        }

        // Language detection
        let lang = 'en';
        const possibleLang = args[0]?.toLowerCase();
        const LANGUAGES = ['en','es','fr','de','id','ja','ko','ar','pt','ru','hi','zh','yo','ha','ig','tr','it','nl','pl','th','vi'];

        if (possibleLang && LANGUAGES.includes(possibleLang)) {
            lang = possibleLang;
            args.shift();
            text = args.join(' ') || quoted?.text;
        }

        const finalText = text.trim();
        if (finalText.length > 500) {
            return reply('✘ ֎ Text too long. Max 500 characters');
        }

        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const timestamp = Date.now();
        const mp3Path = path.join(tempDir, `tts_${timestamp}.mp3`);
        const oggPath = path.join(tempDir, `tts_${timestamp}.ogg`);

        try {
            await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
            await reply(`֎ Generating ${lang.toUpperCase()} speech...`);

            // 1. Download TTS audio from Google Translate TTS
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(finalText)}&tl=${lang}&client=tw-ob`;
            const response = await axios.get(ttsUrl, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 30000
            });
            fs.writeFileSync(mp3Path, Buffer.from(response.data));

            // 2. Convert to WhatsApp voice note format
            let usePtt = true;
            try {
                await execPromise(
                    `ffmpeg -i "${mp3Path}" -c:a libopus -b:a 16k -ac 1 -ar 16000 -vbr off -application voip "${oggPath}"`,
                    { timeout: 15000 }
                );
                fs.unlinkSync(mp3Path);
            } catch (ffmpegErr) {
                console.warn('[TTS] FFmpeg not available, sending as MP3');
                usePtt = false;
            }

            // 3. Send to WhatsApp
            if (usePtt && fs.existsSync(oggPath)) {
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(oggPath),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: m });
                fs.unlinkSync(oggPath);
            } else {
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(mp3Path),
                    mimetype: 'audio/mpeg',
                    fileName: `TTS_${lang}_${timestamp}.mp3`
                }, { quoted: m });
                fs.unlinkSync(mp3Path);
            }

            await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });

        } catch (error) {
            console.error('[TTS ERROR]:', error.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Failed to generate speech\n❏ Error: ${error.message}`);
        } finally {
            // Cleanup
            [mp3Path, oggPath].forEach(p => {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            });
        }
    }
};