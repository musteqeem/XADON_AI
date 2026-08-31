// comhtml.js – Create an HTML file from raw code (no compression)
const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = [{
    name: 'comhtml',
    alias: ['compresshtml', 'minifyhtml', 'htmlfile'],
    desc: 'Create an HTML file from raw code (reply to.html document or text message)',
    category: 'Tools',
    usage: '.comhtml <filename.html> (reply to a.html file or code text) OR.comhtml <filename.html> <code>',

    execute: async (sock, m, { args, reply, prefix }) => {
        // Get custom filename from user
        let customFileName = args[0]?.trim();
        if (customFileName &&!customFileName.endsWith('.html')) customFileName += '.html';

        const quoted = m.quoted;
        let code = '';
        let sourceFileName = 'code.html';
        let isDocument = false;

        if (quoted) {
            const mtype = quoted.mtype || '';
            // Case: replied to a.html document
            if (mtype === 'documentMessage' && quoted.fileName?.endsWith('.html')) {
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
                if (!code.trim()) return reply('✘ ֎ No HTML code found in the replied message');
            } else {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} HTML TOOL •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to :.html document OR text with HTML
│ ❏ Direct : ${prefix}comhtml index.html <code>
╰─────────────────────────╯`;
                return reply(help);
            }
        } else {
            // Direct from command args
            if (!customFileName) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} HTML CREATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Reply : Reply to.html file or code text
│ ❏ Direct : ${prefix}comhtml index.html <your code>
│ ❏ Example : ${prefix}comhtml index.html <h1>Hello</h1>
│ ❏ More : ${prefix}htmltemplate | ${prefix}htmlpreview
╰─────────────────────────╯`;
                return reply(help);
            }
            code = args.slice(1).join(' ').trim();
            if (!code) return reply('✘ ֎ No code provided after the filename');
        }

        // Determine final filename
        let finalFileName = customFileName || (isDocument? sourceFileName : 'code.html');
        if (!finalFileName.endsWith('.html')) finalFileName += '.html';

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
╭─֎ *HTML FILE READY*
│ ❏ Filename : ${finalFileName}
│ ❏ Size : ${stats.size} bytes (${sizeKB} KB)
│ ❏ Status : Success
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(outPath),
                fileName: finalFileName,
                mimetype: 'text/html', // If you want to avoid auto-open in browser, change to 'text/plain'
                caption: caption
            }, { quoted: m });

            fs.unlinkSync(outPath);
            await sock.sendMessage(m.chat, { react: { text: '👾', key: m.key } });

        } catch (err) {
            console.error('[COMHTML ERROR]', err.message);
            reply(`✘ ֎ Failed to create HTML file\n❏ Error: ${err.message}`);
        }
    }
},
// NEW SUBCOMMAND 1
{
    name: 'htmltemplate',
    alias: ['htmltemp'],
    category: 'Tools',
    desc: 'Send a basic HTML5 template',
    usage: '.htmltemplate <filename.html>',
    execute: async (sock, m, { args, reply, prefix }) => {
        let name = args[0]?.trim() || 'template.html';
        if (!name.endsWith('.html')) name += '.html';

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${BOT_NAME} Template</title>
</head>
<body>
    <h1>Hello from ${BOT_NAME}</h1>
</body>
</html>`;

        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const outPath = path.join(tempDir, name);
        fs.writeFileSync(outPath, template, 'utf8');

        await sock.sendMessage(m.chat, {
            document: fs.readFileSync(outPath),
            fileName: name,
            mimetype: 'text/html',
            caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} TEMPLATE •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HTML5 TEMPLATE*\n│ ❏ File : ${name}\n╰─────────────────────────╯`
        }, { quoted: m });
        fs.unlinkSync(outPath);
    }
},
// NEW SUBCOMMAND 2
{
    name: 'htmlpreview',
    alias: ['hprev'],
    category: 'Tools',
    desc: 'Preview HTML code as text',
    usage: '.htmlpreview <code>',
    execute: async (sock, m, { args, reply }) => {
        const code = args.join(' ').trim();
        if (!code) return reply('✘ ֎ Provide HTML code to preview');

        let out = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} PREVIEW •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HTML CODE*
│ ${code.substring(0, 500)}${code.length > 500? '...' : ''}
╰─────────────────────────╯`;
        reply(out);
    }
}];