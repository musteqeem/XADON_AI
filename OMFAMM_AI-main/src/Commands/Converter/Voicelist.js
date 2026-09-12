const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'listvoice',
    alias: ['voicelist', 'ttslang'],
    desc: 'List available TTS voices',
    category: 'AI',
    usage: '.listvoice',

    execute: async (sock, m, { reply, prefix }) => {
        try {
            await sock.sendPresenceUpdate('composing', m.chat);
            await sock.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

            const apiUrl = 'https://apis.prexzyvilla.site/tts/tts-voices';
            const res = await axios.get(apiUrl, { timeout: 15000 });
            
            if (res.status !== 200) return reply('✘ ֎ Failed to fetch voice list');

            const json = res.data;
            const voices = json.voices || [];

            if (!voices.length) return reply('✘ ֎ No voices found');

            // Format voice list with actual names
            let voiceList = voices.slice(0, 20).map((voice, index) => {
                return `│ ❏ ${index + 1}. ${voice}`;
            }).join('\n');

            const message = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} TTS VOICES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *AVAILABLE VOICES*
${voiceList}
╰─────────────────────────╯
❏ Total: ${voices.length} voices

╭─֎ *HOW TO USE*
│ ❏ ${prefix}ttsm <voice_number> <text>
│ ❏ Example: ${prefix}ttsm 3 Hello world
╰─────────────────────────╯`;

            await reply(message);
            await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[TTSVOICES ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Failed to fetch voices\n❏ Error: ${err.message}`);
        }
    }
};