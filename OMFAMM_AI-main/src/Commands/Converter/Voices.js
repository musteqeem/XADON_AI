const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'ttsm',
    alias: ['voice', 'ttsvoice'],
    desc: 'Text to speech with voice selection',
    category: 'AI',
    usage: '.ttsm <voice_number> <text>',

    execute: async (sock, m, { args, reply, prefix }) => {
        try {
            if (args.length < 2) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} MULTI VOICE TTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ ${prefix}ttsm <voice_number> <text>
│ ❏ Example: ${prefix}ttsm 13 Hello world
╰─────────────────────────╯
❏ First use ${prefix}listvoice to see voices
❏ Range: 1-30 | Max 500 chars`;
                return reply(help);
            }

            const voiceNum = parseInt(args[0]);
            if (isNaN(voiceNum) || voiceNum < 1 || voiceNum > 30) {
                return reply('✘ ֎ Use voice number 1-30. Check with.listvoice');
            }

            const text = args.slice(1).join(' ').trim();
            if (!text) return reply('✘ ֎ Give text to speak');
            if (text.length > 500) return reply('✘ ֎ Max 500 characters');

            await sock.sendPresenceUpdate('recording', m.chat);
            await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

            const voiceEndpoints = {
                1: 'tts-adult-female--1-american-english-truvoice',
                2: 'tts-adult-female--2-american-english-truvoice',
                3: 'tts-adult-male--1-american-english-truvoice',
                4: 'tts-adult-male--2-american-english-truvoice',
                5: 'tts-adult-male--3-american-english-truvoice',
                6: 'tts-adult-male--4-american-english-truvoice',
                7: 'tts-adult-male--5-american-english-truvoice',
                8: 'tts-adult-male--6-american-english-truvoice',
                9: 'tts-adult-male--7-american-english-truvoice',
                10: 'tts-adult-male--8-american-english-truvoice',
                11: 'tts-female-whisper',
                12: 'tts-male-whisper',
                13: 'tts-mary',
                14: 'tts-mary--for-telephone-',
                15: 'tts-mary-in-hall',
                16: 'tts-mary-in-space',
                17: 'tts-mary-in-stadium',
                18: 'tts-mike',
                19: 'tts-mike--for-telephone-',
                20: 'tts-mike-in-hall',
                21: 'tts-mike-in-space',
                22: 'tts-mike-in-stadium',
                23: 'tts-robo-soft-five',
                24: 'tts-robo-soft-four',
                25: 'tts-robo-soft-one',
                26: 'tts-robo-soft-six',
                27: 'tts-robo-soft-three',
                28: 'tts-robo-soft-two',
                29: 'tts-sam',
                30: 'tts-bonzi'
            };

            const endpoint = voiceEndpoints[voiceNum];
            const apiUrl = `https://apis.prexzyvilla.site/tts/${endpoint}?text=${encodeURIComponent(text)}`;

            console.log('[TTSM] Requesting:', apiUrl);

            // 1. Get JSON with audio URL
            const res = await axios.get(apiUrl, { timeout: 30000 });
            const json = res.data;

            const audioUrl = json.audio_url?.result || json.audio_url?.url || json.audio_url;

            if (!audioUrl || typeof audioUrl!== 'string') {
                console.log('[TTSM] No valid URL found:', json);
                return reply('✘ ֎ No audio URL in response');
            }

            console.log('[TTSM] Audio URL:', audioUrl);

            // 2. Fetch audio with headers
            const audioRes = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'audio/wav,audio/*,*/*'
                }
            });

            const buffer = Buffer.from(audioRes.data);
            console.log('[TTSM] Buffer size:', buffer.length);

            if (buffer.length < 1000) {
                return reply('✘ ֎ Audio file too small/empty');
            }

            // 3. Send as PTT voice note
            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[TTSM ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ TTS failed\n❏ Error: ${err.message}`);
        }
    }
};