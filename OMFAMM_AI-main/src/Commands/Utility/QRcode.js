const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');

module.exports = {
    name: 'qr',
    alias: ['qrcode', 'makeqr', 'qrread', 'readqr', 'scanqr', 'deqr'],
    desc: 'Generate QR code from text or read QR from quoted image',
    category: 'tools',
    usage: '.qr <text> OR.qrread (reply to QR image)',
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        const rawCmd = (m.body || '').trim().toLowerCase().split(/\s+/)[0];
        const cmd = rawCmd.replace(/^[^a-z0-9]+/, '');

        const generateCmds = ['qr', 'qrcode', 'makeqr'];
        const readCmds = ['qrread', 'readqr', 'scanqr', 'deqr'];

        if (generateCmds.includes(cmd)) {
            let text = args.join(' ').trim();

            if (!text && m.quoted) {
                const qtype = m.quoted.mtype || '';
                if (qtype === 'conversation' || qtype === 'extendedTextMessage') {
                    text = m.quoted.body || m.quoted.text || '';
                }
            }

            if (!text) return reply('✘ Provide text or reply to a message!\nExample:.qr https://example.com');

            try {
                const buffer = await QRCode.toBuffer(text, {
                    type: 'png',
                    width: 500,
                    margin: 1,
                    errorCorrectionLevel: 'H'
                });

                await sock.sendMessage(m.key.remoteJid, {
                    image: buffer,
                    mimetype: 'image/png',
                    caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • QR GENERATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *QR CREATED*
│ ❏ Content : ${text.length > 100? text.slice(0, 100) + '…' : text}
│ ❏ Status : Ready to scan
╰─────────────────────────╯`
                }, { quoted: m });

            } catch (err) {
                console.error('QR generate error:', err);
                return reply('✘ Failed to generate QR code');
            }
        }

        else if (readCmds.includes(cmd)) {

            if (!m.quoted) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • QR READER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Step 1 : Send a QR image
│ ❏ Step 2 : Reply to it
│ ❏ Step 3 : Type.qrread
╰─────────────────────────╯`
                );
            }

            const mtype = m.quoted.mtype || '';
            if (!mtype.includes('image')) {
                return reply('✘ Reply to an *image* (not sticker/video/document)');
            }

            try {
                const buffer = await m.quoted.download();

                if (!buffer ||!buffer.length) {
                    return reply('✘ Could not download the image. Try again.');
                }

                const img = await loadImage(buffer);
                const canvas = createCanvas(img.width, img.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, img.width, img.height, {
                    inversionAttempts: 'attemptBoth'
                });

                if (code?.data) {
                    return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • QR DECODED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RESULT*
│ ❏ Data : ${code.data}
╰─────────────────────────╯`
                    );
                }

                return reply(
`✘ No QR code detected.

• Try a clearer / higher-quality image
• Make sure the QR fills most of the frame
• Avoid heavy compression or blur`
                );

            } catch (err) {
                console.error('QR read error:', err.message || err);
                return reply(`✘ Error reading QR:\n${err.message}`);
            }
        }

        else {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • QR COMMANDS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *AVAILABLE*
│ ❏.qr <text> : Generate QR from text
│ ❏.qr : Reply to a message to generate
│ ❏.qrread : Reply to a QR image to decode
╰─────────────────────────╯`
            );
        }
    }
};