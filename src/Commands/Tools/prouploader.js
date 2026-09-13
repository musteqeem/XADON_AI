const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

module.exports = {
    name: 'proupload',
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

            const msgType = Object.keys(quoted.message)[0];
            const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
            if (!mediaTypes.includes(msgType)) {
                return sock.sendMessage(chatId, { text: '❌ Only image/video/audio/doc/sticker supported' }, { quoted: m });
            }

            // 2. Download the media
            const buffer = await sock.downloadMediaMessage(quoted);
            const mime = quoted.message[msgType].mimetype || 'application/octet-stream';
            const ext = mime.split('/')[1]?.split(';')[0] || 'bin';
            const fileName = `xadon_${Date.now()}.${ext}`;
            const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

            // 3. SMART UPLOAD: Try multiple APIs until one works
            const uploaders = [
                {
                    name: 'Catbox',
                    upload: async () => {
                        const form = new FormData();
                        form.append('reqtype', 'fileupload');
                        form.append('fileToUpload', buffer, { filename: fileName, contentType: mime });
                        const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
                            headers: form.getHeaders(),
                            timeout: 30000
                        });
                        if (!data.startsWith('https')) throw new Error(data);
                        return data;
                    }
                },
                {
                    name: 'TmpFiles',
                    upload: async () => {
                        const form = new FormData();
                        form.append('file', buffer, { filename: fileName, contentType: mime });
                        const { data } = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
                            headers: form.getHeaders(),
                            timeout: 30000
                        });
                        // tmpfiles returns {"data":{"url":"https://tmpfiles.org/xxx"}}
                        const url = data?.data?.url;
                        if (!url) throw new Error('No url');
                        return url.replace('/dl/', '/'); // direct link
                    }
                },
                {
                    name: '0x0.st',
                    upload: async () => {
                        const form = new FormData();
                        form.append('file', buffer, { filename: fileName, contentType: mime });
                        const { data } = await axios.post('https://0x0.st', form, {
                            headers: form.getHeaders(),
                            timeout: 30000
                        });
                        if (!data.startsWith('https')) throw new Error(data);
                        return data.trim();
                    }
                }
            ];

            let finalLink = null;
            let usedHost = null;
            let lastError = null;

            for (const uploader of uploaders) {
                try {
                    finalLink = await uploader.upload();
                    usedHost = uploader.name;
                    break; // success, stop trying
                } catch (e) {
                    console.error(`[${uploader.name} FAILED]`, e.message);
                    lastError = e;
                    continue; // try next
                }
            }

            if (!finalLink) throw lastError || new Error('All upload hosts failed');

            // 4. Send result
            await sock.sendMessage(chatId, {
                text: `✅ *UPLOADED SUCCESSFULLY*\n\n` +
                      `📁 *Type*: ${mime}\n` +
                      `📦 *Size*: ${sizeMB} MB\n` +
                      `🌐 *Host*: ${usedHost}\n` +
                      `🔗 *Link*: ${finalLink}\n\n` +
                      `💡 Use this link for MENU_AUDIO or MENU_IMAGE in.env`
            }, { quoted: m });

            await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[UPLOAD ERROR]', err);
            await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(chatId, { text: `✘ UPLOAD FAILED\nAll 3 hosts are down.\n${err.message}` }, { quoted: m });
        }
    }
};