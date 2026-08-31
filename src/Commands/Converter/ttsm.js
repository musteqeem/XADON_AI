const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const voiceNames = {
    1: 'Adult Female 1', 2: 'Adult Female 2', 3: 'Adult Male 1', 4: 'Adult Male 2',
    5: 'Adult Male 3', 6: 'Adult Male 4', 7: 'Adult Male 5', 8: 'Adult Male 6',
    9: 'Adult Male 7', 10: 'Adult Male 8', 11: 'Female Whisper', 12: 'Male Whisper',
    13: 'Mary', 14: 'Mary Telephone', 15: 'Mary Hall', 16: 'Mary Space', 17: 'Mary Stadium',
    18: 'Mike', 19: 'Mike Telephone', 20: 'Mike Hall', 21: 'Mike Space', 22: 'Mike Stadium',
    23: 'Robo Soft 5', 24: 'Robo Soft 4', 25: 'Robo Soft 1', 26: 'Robo Soft 6',
    27: 'Robo Soft 3', 28: 'Robo Soft 2', 29: 'Sam', 30: 'Bonzi'
};

module.exports = {
    name: 'xttsm',
    alias: ['xvoice', 'xttsvoice'],
    desc: 'Text to speech with voice selection + preview',
    category: 'AI',
    usage: '.ttsm <voice_number> <text> |.ttsm <voice_number> preview',

    execute: async (sock, m, { args, reply, prefix }) => {
        try {
            if (args.length < 1) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} MULTI VOICE TTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ ${prefix}ttsm <voice_number> <text>
│ ❏ ${prefix}ttsm <voice_number> preview
│ ❏ Example: ${prefix}ttsm 13 Hello world
│ ❏ Example: ${prefix}ttsm 29 preview
╰─────────────────────────╯
❏ First use ${prefix}listvoice to see all 30 voices
❏ Range: 1-30 | Max 500 chars`;
                return reply(help);
            }

            const voiceNum = parseInt(args[0]);
            if (isNaN(voiceNum) || voiceNum < 1 || voiceNum > 30) {
                return reply('✘ ֎ Use voice number 1-30. Check with.listvoice');
            }

            let text = args.slice(1).join(' ').trim();

            // PREVIEW MODE
            if (text.toLowerCase() === 'preview') {
                text = `Hello, this is voice number ${voiceNum}. My name is ${voiceNames[voiceNum]}. How do I sound?`;
            }

            if (!text) return reply('✘ ֎ Give text to speak');
            if (text.length > 500) return reply('✘ ֎ Max 500 characters');

            await sock.sendPresenceUpdate('recording', m.chat);
            await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

            const voiceEndpoints = {
                1: 'tts-adult-female--1-american-english-truvoice', 2: 'tts-adult-female--2-american-english-truvoice',
                3: 'tts-adult-male--1-american-english-truvoice', 4: 'tts-adult-male--2-american-english-truvoice',
                5: 'tts-adult-male--3-american-english-truvoice', 6: 'tts-adult-male--4-american-english-truvoice',
                7: 'tts-adult-male--5-american-english-truvoice', 8: 'tts-adult-male--6-american-english-truvoice',
                9: 'tts-adult-male--7-american-english-truvoice', 10: 'tts-adult-male--8-american-english-truvoice',
                11: 'tts-female-whisper', 12: 'tts-male-whisper', 13: 'tts-mary', 14: 'tts-mary--for-telephone-',
                15: 'tts-mary-in-hall', 16: 'tts-mary-in-space', 17: 'tts-mary-in-stadium', 18: 'tts-mike',
                19: 'tts-mike--for-telephone-', 20: 'tts-mike-in-hall', 21: 'tts-mike-in-space', 22: 'tts-mike-in-stadium',
                23: 'tts-robo-soft-five', 24: 'tts-robo-soft-four', 25: 'tts-robo-soft-one', 26: 'tts-robo-soft-six',
                27: 'tts-robo-soft-three', 28: 'tts-robo-soft-two', 29: 'tts-sam', 30: 'tts-bonzi'
            };

            const endpoint = voiceEndpoints[voiceNum];
            const apiUrl = `https://apis.prexzyvilla.site/tts/${endpoint}?text=${encodeURIComponent(text)}`;

            // 1. Get JSON with audio URL
            const res = await axios.get(apiUrl, { timeout: 30000 });
            const json = res.data;
            const audioUrl = json.audio_url?.result || json.audio_url?.url || json.audio_url;

            if (!audioUrl || typeof audioUrl!== 'string') {
                return reply('✘ ֎ No audio URL in response');
            }

            // 2. Fetch audio
            const audioRes = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const buffer = Buffer.from(audioRes.data);
            if (buffer.length < 1000) {
                return reply('✘ ֎ Audio file too small/empty');
            }

            // 3. Send as PTT
            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });

            // Send caption with voice info
            await sock.sendMessage(m.chat, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • VOICE ${voiceNum} •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Name: ${voiceNames[voiceNum]}
❏ Text: ${text.slice(0, 100)}${text.length > 100? '...' : ''}`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[TTSM ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ TTS failed\n❏ Error: ${err.message}`);
        }
    }
};