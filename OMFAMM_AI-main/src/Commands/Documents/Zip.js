const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'zip',
    alias: ['tozip', 'archive', 'zipit'],
    category: 'Documents',
    desc: 'Build.zip file: add files one by one then push',
    usage: '.zip <number> to add |.zip push |.zip list',

    execute: async (sock, m, { args, reply, prefix }) => {
        const sender = m.sender;
        if (!global.zipQueues) global.zipQueues = {};
        if (!global.zipQueues[sender]) global.zipQueues[sender] = [];

        const queue = global.zipQueues[sender];
        const cmd = args[0]?.toLowerCase();

        // HELP / LIST
        if (!cmd || cmd === 'list') {
            let list = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ZIP BUILDER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ZIP QUEUE*
│ ❏ Items in queue: ${queue.length}
`;
            if (queue.length === 0) {
                list += `│ ❏ Queue is empty\n`;
            } else {
                queue.forEach((item, i) => {
                    const sizeKB = (item.size / 1024).toFixed(1);
                    list += `│ ${i + 1}. ${item.name} - ${sizeKB} KB\n`;
                });
            }
            list += `╰─────────────────────────╯
╭─֎ *COMMANDS*
│ ❏ ${prefix}zip <number> → add replied file as #number
│ ❏ ${prefix}zip remove <number> → remove item
│ ❏ ${prefix}zip clear → empty queue
│ ❏ ${prefix}zip push → create & send.zip
│ ❏ ${prefix}zip list → show queue
╰─────────────────────────╯`;

            return reply(list);
        }

        // CLEAR QUEUE
        if (cmd === 'clear') {
            global.zipQueues[sender] = [];
            return reply('✦ ֎ Queue cleared!');
        }

        // REMOVE ITEM
        if (cmd === 'remove') {
            const num = parseInt(args[1]);
            if (!num || num < 1 || num > queue.length) {
                return reply(`✘ ֎ Invalid number!\n❏ Current items: ${queue.length}`);
            }
            const removed = queue.splice(num - 1, 1);
            return reply(`✓ ֎ Removed: ${removed[0].name}\n❏ Remaining: ${queue.length}`);
        }

        // PUSH / CREATE ZIP
        if (cmd === 'push') {
            if (queue.length === 0) {
                return reply('✘ ֎ Queue is empty! Add files first with.zip 1');
            }

            await reply('֎ Zipping files...');

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const zipName = `archive_${Date.now()}.zip`;
            const zipPath = path.join(tempDir, zipName);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 6 } });

            archive.pipe(output);

            for (const item of queue) {
                archive.append(item.buffer, { name: item.name });
            }

            await new Promise((resolve, reject) => {
                output.on('close', resolve);
                archive.on('error', reject);
                archive.finalize();
            });

            if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size < 100) {
                fs.unlinkSync(zipPath);
                return reply('✘ ֎ Zipping failed - empty or invalid zip');
            }

            const zipBuffer = fs.readFileSync(zipPath);
            const totalSize = (fs.statSync(zipPath).size / 1024).toFixed(1);

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ZIP ARCHIVE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ZIP CREATED*
│ ❏ Files : ${queue.length}
│ ❏ Size : ${totalSize} KB
│ ❏ Name : ${zipName}
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: zipBuffer,
                mimetype: 'application/zip',
                fileName: zipName,
                caption: caption
            }, { quoted: m });

            // Cleanup
            fs.unlinkSync(zipPath);
            global.zipQueues[sender] = [];
            await sock.sendMessage(m.chat, { react: { text: '📦', key: m.key } });

            return;
        }

        // ADD ITEM:.zip 1,.zip 2, etc
        const index = parseInt(cmd);
        if (isNaN(index) || index < 1) {
            return reply(`✘ ֎ Use ${prefix}zip <number> to add replied file`);
        }

        const quoted = m.quoted;
        if (!quoted) {
            return reply('✘ ֎ Reply to a media/file when using.zip <number>');
        }

        const downloadable =
            quoted.mimetype ||
            quoted.isSticker ||
            quoted.mtype === 'documentMessage' ||
            quoted.mtype === 'imageMessage' ||
            quoted.mtype === 'videoMessage' ||
            quoted.mtype === 'audioMessage';

        if (!downloadable) {
            return reply('✘ ֎ Replied message has no downloadable media/file');
        }

        let buffer;
        try {
            buffer = await quoted.download();
        } catch {
            return reply('✘ ֎ Failed to download replied file');
        }

        if (!buffer || buffer.length < 50) {
            return reply('✘ ֎ Downloaded file is empty/corrupted');
        }

        let ext = 'bin';
        const mime = quoted.mimetype || '';
        if (mime.startsWith('image/')) ext = mime.split('/')[1] || 'jpg';
        else if (mime.startsWith('video/')) ext = 'mp4';
        else if (mime.startsWith('audio/')) ext = 'mp3';
        else if (mime === 'image/webp') ext = 'webp';
        else if (mime.includes('pdf')) ext = 'pdf';
        else if (mime.includes('document')) ext = 'docx';
        else if (mime.includes('zip')) ext = 'zip';

        const fileName = quoted.fileName || `file_${index}.${ext}`;
        const item = {
            buffer,
            name: fileName,
            ext,
            size: buffer.length
        };

        // If position already exists, overwrite
        queue[index - 1] = item;

        reply(`✓ ֎ Added as item #${index}: ${item.name}\n❏ Queue now has ${queue.length} items\n❏ Use ${prefix}zip push to create zip`);
    }
};