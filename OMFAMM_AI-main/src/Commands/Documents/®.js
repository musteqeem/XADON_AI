const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const BLOCKED = [
    'creds.json',
    '.env',
    'config.env',
    'auth_info',
    'private_key',
    'session',
    'sessions'
];

function isSafe(filePath) {
    const lowerPath = filePath.toLowerCase();
    return!BLOCKED.some(b => lowerPath.includes(b));
}

module.exports = {
    name: 'read',
    alias: ['®', 'getfile', 'readfile'],
    desc: 'Return any file from the bot panel as a document',
    category: 'Tools',
    usage: '.read src/index.js',

    execute: async (sock, m, { args, reply }) => {
        if (!args[0]) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} FILE READER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *READ FILE*
│ ❏ Usage :.read <file_path>
│ ❏ Example :.read src/index.js
│ ❏ Example :.read commands/
│ ❏ Note : Blocked files cannot be accessed
╰─────────────────────────╯`;
            return reply(help);
        }

        const inputPath = args[0].trim();
        const fullPath = path.resolve(process.cwd(), inputPath);

        // Prevent directory traversal
        if (!fullPath.startsWith(process.cwd())) {
            return reply('✘ ֎ Access denied — path is outside bot directory.');
        }

        // Block sensitive files
        if (!isSafe(fullPath)) {
            return reply('✘ ֎ Access denied — that file is protected.');
        }

        // Check if exists
        if (!fs.existsSync(fullPath)) {
            return reply(`✘ ֎ File not found: \`${inputPath}\``);
        }

        const stats = fs.statSync(fullPath);

        // If directory, list it
        if (stats.isDirectory()) {
            try {
                const files = fs.readdirSync(fullPath);
                const list = files.map(file => {
                    const filePath = path.join(fullPath, file);
                    const isDir = fs.statSync(filePath).isDirectory();
                    return `${isDir? '📁' : '📄'} ${file}`;
                }).join('\n');

                let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DIRECTORY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *PATH* : ${inputPath}
─────────────────
${list}
─────────────────
❏ Total : ${files.length} item(s)
╰─────────────────────────╯`;

                return reply(caption);
            } catch (e) {
                return reply(`✘ ֎ Failed to read directory\n❏ Error: ${e.message}`);
            }
        }

        // If file, send as document
        const fileSize = (stats.size / 1024).toFixed(2);
        const fileName = path.basename(fullPath);
        const ext = path.extname(fileName).toLowerCase();

        const mimeTypes = {
            '.js': 'text/plain',
            '.json': 'application/json',
            '.ts': 'text/plain',
            '.txt': 'text/plain',
            '.md': 'text/plain',
            '.html': 'text/html',
            '.css': 'text/css',
            '.sh': 'text/plain',
            '.log': 'text/plain'
        };
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        try {
            await sock.sendMessage(m.chat, { react: { text: '📄', key: m.key } });

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(fullPath),
                fileName: fileName,
                mimetype: mimeType,
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} FILE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FILE INFO*
│ ❏ Name : ${fileName}
│ ❏ Path : ${inputPath}
│ ❏ Size : ${stats.size} bytes (${fileSize} KB)
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (e) {
            console.error('[READFILE ERROR]', e.message);
            reply(`✘ ֎ Failed to read file\n❏ Error: ${e.message}`);
        }
    }
};