const axios = require('axios');
const FormData = require('form-data');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'scan',
    alias: ['ocr', 'read', 'gettext'],
    category: 'Documents',
    desc: 'Extract text from image (OCR)',
    usage: '.scan (reply to image)',
    reactions: { start: '֎', success: '🔍' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const quoted = m.quoted;
        if (!quoted) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} OCR SCANNER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *TEXT EXTRACTOR*
│ ❏ Usage : Reply to image with ${prefix}scan
│ ❏ Example : ${prefix}scan eng
│ ❏ Languages : eng, spa, fra, por, deu
│ ❏ Note : Works best with clear images
╰─────────────────────────╯`;
            return reply(help);
        }

        const mtype = quoted.mtype || quoted.type || '';
        if (!mtype.includes('image')) {
            return reply('✘ ֎ Reply to an image');
        }

        // Optional language arg: .scan spa
        const lang = args[0]?.toLowerCase() || 'eng';
        const validLangs = ['eng', 'spa', 'fra', 'por', 'deu', 'ita', 'rus'];
        const language = validLangs.includes(lang)? lang : 'eng';

        try {
            await sock.sendMessage(m.chat, { react: { text: '֎', key: m.key } });
            await reply('֎ Scanning image for text...');

            const buffer = await quoted.download();
            if (!buffer) return reply('✘ ֎ Failed to download image');

            const form = new FormData();
            form.append('apikey', 'K82707468388957');
            form.append('language', language);
            form.append('isOverlayRequired', 'false');
            form.append('detectOrientation', 'true');
            form.append('file', buffer, { filename: 'scan.jpg' });

            const res = await axios.post(
                'https://api.ocr.space/parse/image',
                form,
                { headers: form.getHeaders(), timeout: 120000 }
            );

            const data = res.data;

            if (!data?.ParsedResults?.[0]) {
                return reply('✘ ֎ No text detected in image');
            }

            const result = data.ParsedResults[0];
            const text = result.ParsedText?.trim();
            const confidence = result.FileParseExitCode === 1? 'High' : 'Low';

            if (!text) return reply('✘ ֎ No readable text found');

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} OCR RESULT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *EXTRACTED TEXT*
│ ❏ Language : ${language.toUpperCase()}
│ ❏ Confidence : ${confidence}
│ ❏ Length : ${text.length} characters
╰─────────────────────────╯

${text}

╭─֎ *POWERED BY*
│ ❏ ${BOT_NAME} OCR
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, { text: caption }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        } catch (err) {
            console.error('[SCAN ERROR]', err.message);
            reply(`✘ ֎ OCR scan failed\n❏ Error: ${err.response?.data?.ErrorMessage || err.message}`);
        }
    }
};