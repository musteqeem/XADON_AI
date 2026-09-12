module.exports = {
    name: 'doc',
    alias: ['document', 'todoc', 'senddoc', 'media2doc'],
    category: 'Documents',
    desc: 'Convert replied media to document with custom name',
    reactions: {
        start: '✧',
        success: '📄'
    },

    execute: async (sock, m, { args, reply, prefix }) => {
        const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
        try {
            const quoted = m.quoted

            if (!quoted) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DOC CONVERTER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *MEDIA TO DOCUMENT*
│ ❏ Usage : Reply to media with ${prefix}doc <filename>
│ ❏ Support : Image | Video | Audio | Sticker | PDF
│ ❏ Example : ${prefix}doc myphoto
│ ❏ Note : Auto adds correct extension
╰─────────────────────────╯`;
                return reply(help);
            }

            const mime = quoted.mimetype || ''
            if (!mime) {
                return reply('✘ ֎ No media found in replied message');
            }

            let fileName = args.join(' ').trim() || `file_from_${BOT_NAME.toLowerCase().replace(/\s/g, '')}`;
            
            // Clean filename & add extension based on mime
            let ext = 'file'
            let type = 'Unknown'
            if (mime.startsWith('image/')) { ext = 'jpg'; type = 'Image'; }
            else if (mime.startsWith('video/')) { ext = 'mp4'; type = 'Video'; }
            else if (mime.startsWith('audio/')) { ext = 'mp3'; type = 'Audio'; }
            else if (mime === 'image/webp') { ext = 'webp'; type = 'Sticker'; }
            else if (mime.includes('pdf')) { ext = 'pdf'; type = 'PDF'; }

            if (!fileName.toLowerCase().endsWith(`.${ext}`)) {
                fileName += `.${ext}`;
            }

            await reply('֎ Preparing document...');

            const buffer = await quoted.download();
            if (!buffer || buffer.length < 100) {
                return reply('✘ ֎ Failed to download media');
            }

            const sizeKB = (buffer.length / 1024).toFixed(1);

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DOCUMENT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DOCUMENT CREATED*
│ ❏ Name : ${fileName}
│ ❏ Type : ${type}
│ ❏ Size : ${sizeKB} KB
│ ❏ From : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: buffer,
                mimetype: mime,
                fileName: fileName,
                caption: caption
            }, { quoted: m });

            reply('֎ Sent as document! Tap to download');

        } catch (e) {
            console.log('[DOC ERROR]', e.message);
            reply(`✘ ֎ Failed to send as document\n❏ Error: ${e.message}`);
        }
    }
}