// =============================================
// plugins/linkpreview.js
// =============================================

module.exports = {
    name: 'preview',
    alias: ['lpreview', 'linkcard'],
    desc: 'Send a message with custom link preview',
    category: 'Utility',
    usage: '.preview <url> | <title> | <description>',

    execute: async (sock, m, { args, reply }) => {
        const fs = require('fs');
        const path = require('path');

        const input = args.join(' ');
        const parts = input.split('|').map(p => p.trim());

        const url = parts[0];
        const title = parts[1] || 'Check this out';
        const description = parts[2] || '';

        if (!url ||!url.startsWith('http')) {
            return reply('✘ Provide a valid URL\nExample:.preview https://example.com | My Title | Description');
        }

        const jid = m.key.remoteJid;

        try {
            let jpegThumbnail = null;
            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (quotedMsg?.imageMessage) {
                jpegThumbnail = await sock.downloadContentFromMessage(
                    quotedMsg.imageMessage,
                    'image'
                );
            }

            const messagePayload = {
                text:
`${url}
◈ ${title}
${description? `◈ ${description}` : ''}`,
                linkPreview: {
                    'matched-text': url,
                    title: title,
                    description: description,
                    previewType: 0
                }
            };

            if (jpegThumbnail) {
                messagePayload.linkPreview.jpegThumbnail = jpegThumbnail;
            }

            await sock.sendMessage(jid, messagePayload, {
                quoted: m
            });

        } catch (e) {
            console.error('[PREVIEW]', e);
            reply(`✘ Error: ${e.message}`);
        }
    }
};