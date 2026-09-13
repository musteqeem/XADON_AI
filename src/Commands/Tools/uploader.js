const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'xupload',
    alias: ['upl', 'link'],
    desc: 'Upload media to get direct link. Reply to any image/video/audio/doc',
    category: 'General',
    usage: '.upload | Reply to media',
    reactions: { start: '📤', success: '✅', error: '❌' },

    execute: async (sock, m, { quoted }) => {
        const chatId = m.key.remoteJid;

        try {
            await sock.sendMessage(chatId, { react: { text: '📤', key: m.key } });

            // 1. Must reply to media
            if (!quoted ||!quoted.message) {
                return sock.sendMessage(chatId, { text: '❌ Reply to an image, video, audio, or document to upload' }, { quoted: m });
            }

            // 2. Download the media
            const msgType = Object.keys(quoted.message)[0];
            const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
            if (!mediaTypes.includes(msgType)) {
                return sock.sendMessage(chatId, { text: '❌ Only image/video/audio/doc/sticker supported' }, { quoted: m });
            }

            const buffer = await sock.downloadMediaMessage(quoted);
            const mime = quoted.message[msgType].mimetype || 'application/octet-stream';
            const ext = mime.split('/')[1].split(';')[0]; // jpg, mp4, mp3 etc
            const fileName = `xadon_${Date.now()}.${ext}`;

            // 3. Upload to catbox.moe - supports up to 200MB, no key needed. Smartest for bot
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buffer, { filename: fileName, contentType: mime });

            const { data: link } = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders()
            });

            if (!link || link.includes('error')) throw new Error('Upload failed');

            // 4. Send result
            await sock.sendMessage(chatId, {
                text: `✅ *UPLOADED SUCCESSFULLY*\n\n` +
                      `📁 *Type*: ${mime}\n` +
                      `📦 *Size*: ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n` +
                      `🔗 *Link*: ${link}\n\n` +
                      `💡 This link is direct and permanent`
            }, { quoted: m });

            await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[UPLOAD ERROR]', err);
            await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(chatId, { text: `✘ UPLOAD FAILED\n${err.message}` }, { quoted: m });
        }
    }
};