// comcpp.js – Create a C++ file from raw code (no compression)
const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'comc++',
    alias: ['compresscpp', 'minifycpp', 'cppfile'],
    desc: 'Create a C++ file from raw code (reply to.cpp document or text message)',
    category: 'Tools',
    usage: '.comc++ <filename.cpp> (reply to a.cpp file or code text) OR.comc++ <filename.cpp> <code>',

    execute: async (sock, m, { args, reply, prefix }) => {
        // Get custom filename from user
        let customFileName = args[0]?.trim();
        if (customFileName &&!customFileName.endsWith('.cpp')) customFileName += '.cpp';

        const quoted = m.quoted;
        let code = '';
        let sourceFileName = 'code.cpp';
        let isDocument = false;

        if (quoted) {
            const mtype = quoted.mtype || '';
            // Case: replied to a.cpp document
            if (mtype === 'documentMessage' && quoted.fileName?.endsWith('.cpp')) {
                isDocument = true;
                sourceFileName = quoted.fileName;
                try {
                    const buffer = await quoted.download();
                    if (!buffer || buffer.length === 0) return reply('✘ ֎ Failed to download file');
                    code = buffer.toString('utf8');
                } catch (err) {
                    return reply('✘ ֎ Failed to read document');
                }
            }
            // Case: replied to a text message
            else if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
                code = quoted.text || quoted.body || '';
                if (!code.trim()) return reply('✘ ֎ No C++ code found in the replied message');
            } else {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} TOOLS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE HELP*
│ ❏ Reply to :.cpp document OR text with code
│ ❏ Direct : ${prefix}comc++ main.cpp <code>
╰─────────────────────────╯`);
            }
        } else {
            // Case: code provided directly in command
            if (!customFileName) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} C++ CREATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Reply : Reply to.cpp file or code text
│ ❏ Direct : ${prefix}comc++ main.cpp <your code>
│ ❏ Example : ${prefix}comc++ hello.cpp cout<<Hello;
╰─────────────────────────╯`;
                return reply(help);
            }
            code = args.slice(1).join(' ').trim();
            if (!code) return reply('✘ ֎ No code provided after the filename');
        }

        // Determine final filename
        let finalFileName = customFileName || (isDocument? sourceFileName : 'code.cpp');
        if (!finalFileName.endsWith('.cpp')) finalFileName += '.cpp';

        if (!code.trim()) return reply('✘ ֎ No code to package');

        try {
            await sock.sendMessage(m.chat, { react: { text: '📄', key: m.key } });
            await reply('֎ Working...');

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const outPath = path.join(tempDir, finalFileName);
            fs.writeFileSync(outPath, code, 'utf8');

            const stats = fs.statSync(outPath);
            const sizeKB = (stats.size / 1024).toFixed(2);

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} FILE CREATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *C++ FILE READY*
│ ❏ Filename : ${finalFileName}
│ ❏ Size : ${stats.size} bytes (${sizeKB} KB)
│ ❏ Status : Success
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(outPath),
                fileName: finalFileName,
                mimetype: 'text/x-c++src', // Recognized as C++ source by most editors
                caption: caption
            }, { quoted: m });

            fs.unlinkSync(outPath);
            await sock.sendMessage(m.chat, { react: { text: '🧑‍💻', key: m.key } });

        } catch (err) {
            console.error('[COMCPP ERROR]', err.message);
            reply(`✘ ֎ Failed to create C++ file\n❏ Error: ${err.message}`);
        }
    }
};