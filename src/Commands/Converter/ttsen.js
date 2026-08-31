const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'ttsen',
    alias: ['englishtts', 'envoice', 'speaken'],
    category: 'Tools',
    desc: 'Text to speech in English',
    usage: '.ttsen <text>',
    reactions: { start: '🇬🇧', success: '🎤' },
    
    execute: async (sock, m, { args, reply, prefix }) => {
        const text = args.join(' ').trim();
        if (!text) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ENGLISH TTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ENGLISH VOICE*
│ ❏ Usage : ${prefix}ttsen <text>
│ ❏ Example : ${prefix}ttsen Hello how are you
│ ❏ Output : Voice note in English
╰─────────────────────────╯`;
            return reply(help);
        }
        
        if (text.length > 500) {
            return reply('✘ ֎ Text too long. Max 500 characters');
        }
        
        try {
            await sock.sendMessage(m.chat, { 
                react: { text: '🇬🇧', key: m.key } 
            });
            await reply('֎ Generating English voice...');

            const res = await axios.get(
                `https://apis.prexzyvilla.site/tts/tts-en?text=${encodeURIComponent(text)}`, 
                { responseType: 'arraybuffer', timeout: 30000 }
            );
            
            const buffer = Buffer.from(res.data);
            if (buffer.length < 1000) {
                return reply('✘ ֎ Failed to generate audio');
            }
            
            await sock.sendMessage(m.chat, {
                audio: buffer,
                ptt: true,
                mimetype: 'audio/mpeg'
            }, { quoted: m });
            
            await sock.sendMessage(m.chat, { 
                react: { text: '✓', key: m.key } 
            });
            
        } catch (err) {
            console.error('[TTSEN ERROR]:', err.message);
            await sock.sendMessage(m.chat, { 
                react: { text: '✘', key: m.key } 
            });
            reply(`✘ ֎ English TTS failed\n❏ Error: ${err.message}`);
        }
    }
};