const { PDFDocument } = require('pdf-lib');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

// Global queue per chat to build multi-page PDFs
if (!global.pdfQueue) global.pdfQueue = {};

module.exports = {
    name: 'pdf',
    alias: ['topdf', 'imgtopdf', 'makepdf'],
    category: 'Documents',
    desc: 'Build multi-page PDF (add images one by one)',
    reactions: { start: '֎', success: '📂' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const chatId = m.key.remoteJid;
        if (!global.pdfQueue[chatId]) global.pdfQueue[chatId] = { pages: [] };
        const queue = global.pdfQueue[chatId];
        const subCmd = args[0]?.toLowerCase();

        try {
            // No args = show menu
            if (!subCmd) {
                let list = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} PDF BUILDER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *PDF QUEUE*
│ ❏ Pages in queue: ${queue.pages.length}
`;
                if (queue.pages.length > 0) {
                    queue.pages.forEach((p, i) => {
                        const type = p.mime.includes('jpeg')? 'JPG' : 'PNG';
                        list += `│ ${i + 1}. ${type} image\n`;
                    });
                } else {
                    list += `│ ❏ Queue is empty\n`;
                }
                list += `╰─────────────────────────╯
╭─֎ *COMMANDS*
│ ❏ ${prefix}pdf add → add replied image
│ ❏ ${prefix}pdf del <number> → remove page
│ ❏ ${prefix}pdf clear → clear everything
│ ❏ ${prefix}pdf push → generate & send PDF
╰─────────────────────────╯`;

                return reply(list);
            }

            // pdf add
            if (subCmd === 'add') {
                const quoted = m.quoted;
                const isImage = quoted && (
                    quoted.mtype === 'image' ||
                    quoted.message?.imageMessage ||
                    quoted.isImage === true
                );
                if (!isImage) return reply(`✘ ֎ Reply to a JPG or PNG image!\n\n❏ Usage: Reply to photo → ${prefix}pdf add`);

                const buffer = await quoted.download();
                const mime = quoted.mimetype || quoted.message?.imageMessage?.mimetype || '';

                if (!mime.includes('jpeg') &&!mime.includes('jpg') &&!mime.includes('png')) {
                    return reply('✘ ֎ Only JPG and PNG images are supported');
                }

                queue.pages.push({ buffer, mime });
                return reply(`✓ ֎ Page added! ❏ Total pages: ${queue.pages.length}`);
            }

            // pdf del <number>
            if (subCmd === 'del') {
                const num = parseInt(args[1]);
                if (!num || num < 1 || num > queue.pages.length) {
                    return reply(`✘ ֎ Invalid page number!\n❏ Current pages: ${queue.pages.length}`);
                }
                queue.pages.splice(num - 1, 1);
                return reply(`✓ ֎ Page ${num} removed! ❏ Remaining: ${queue.pages.length}`);
            }

            // pdf clear
            if (subCmd === 'clear') {
                global.pdfQueue[chatId] = { pages: [] };
                return reply('✦ ֎ Queue cleared!');
            }

            // pdf push = generate and send
            if (subCmd === 'push') {
                if (queue.pages.length === 0) return reply('✘ ֎ Queue is empty! Add some images first');

                await reply('֎ Building PDF...');

                const pdfDoc = await PDFDocument.create();
                const pageWidth = 595; // A4 width
                const pageHeight = 842; // A4 height

                for (const page of queue.pages) {
                    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    let image;

                    if (page.mime.includes('jpeg') || page.mime.includes('jpg')) {
                        image = await pdfDoc.embedJpg(page.buffer);
                    } else if (page.mime.includes('png')) {
                        image = await pdfDoc.embedPng(page.buffer);
                    }

                    const { width, height } = image;
                    const scale = Math.min(pageWidth * 0.95 / width, pageHeight * 0.95 / height);
                    const imgWidth = width * scale;
                    const imgHeight = height * scale;
                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;

                    pdfPage.drawImage(image, { x, y, width: imgWidth, height: imgHeight });
                }

                const pdfBytes = await pdfDoc.save();
                const buffer = Buffer.from(pdfBytes);
                const fileName = `PDF-${Date.now()}.pdf`;

                await sock.sendMessage(chatId, {
                    document: buffer,
                    mimetype: 'application/pdf',
                    fileName: fileName,
                    caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} PDF CREATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *PDF READY*
│ ❏ Pages : ${queue.pages.length}
│ ❏ File : ${fileName}
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`
                }, { quoted: m });

                // Clear queue after sending
                global.pdfQueue[chatId] = { pages: [] };
                return reply('֎ PDF sent and queue cleared');
            }

            return reply(`✘ ֎ Unknown command!\n❏ Type ${prefix}pdf to see usage`);

        } catch (e) {
            console.error('[PDF Error]', e);
            reply(`✘ ֎ Failed to process PDF\n❏ Error: ${e.message}`);
        }
    }
};