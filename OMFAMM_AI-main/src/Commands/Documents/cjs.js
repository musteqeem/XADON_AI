// comjs.js – Create a JavaScript file from raw code (no compression)
const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = [{
    name: 'comjs',
    alias: ['compressjs', 'minifyjs', 'jsfile'],
    desc: 'Create a JavaScript file from raw code (reply to.js document or text message)',
    category: 'Tools',
    usage: '.comjs <filename.js> (reply to a.js file or code text) OR.comjs <filename.js> <code>',

    execute: async (sock, m, { args, reply, prefix }) => {
        let customFileName = args[0]?.trim();
        if (customFileName &&!customFileName.endsWith('.js')) customFileName += '.js';

        const quoted = m.quoted;
        let code = '';
        let sourceFileName = 'code.js';
        let isDocument = false;

        if (quoted) {
            const mtype = quoted.mtype || '';
            if (mtype === 'documentMessage' && quoted.fileName?.endsWith('.js')) {
                isDocument = true;
                sourceFileName = quoted.fileName;
                try {
                    const buffer = await quoted.download();
                    if (!buffer || buffer.length === 0) return reply('✘ ֎ Failed to download file');
                    code = buffer.toString('utf8');
                } catch (err) {
                    return reply('✘ ֎ Failed to read document');
                }
            } else if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
                code = quoted.text || quoted.body || '';
                if (!code.trim()) return reply('✘ ֎ No code found in the replied message');
            } else {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} JS TOOL •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to :.js document OR text with code
│ ❏ Direct : ${prefix}comjs index.js <code>
╰─────────────────────────╯`;
                return reply(help);
            }
        } else {
            if (!customFileName) {
                let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} JS CREATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Reply : Reply to.js file or code text
│ ❏ Direct : ${prefix}comjs index.js <your code>
│ ❏ Example : ${prefix}comjs app.js console.log("hi")
│ ❏ More : ${prefix}jsrun | ${prefix}jslint
╰─────────────────────────╯`;
                return reply(help);
            }
            code = args.slice(1).join(' ').trim();
            if (!code) return reply('✘ ֎ No code provided after the filename');
        }

        let finalFileName = customFileName || (isDocument? sourceFileName : 'code.js');
        if (!finalFileName.endsWith('.js')) finalFileName += '.js';

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
╭─֎ *JAVASCRIPT FILE READY*
│ ❏ Filename : ${finalFileName}
│ ❏ Size : ${stats.size} bytes (${sizeKB} KB)
│ ❏ Status : Success
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(outPath),
                fileName: finalFileName,
                mimetype: 'text/plain',
                caption: caption
            }, { quoted: m });

            fs.unlinkSync(outPath);
            await sock.sendMessage(m.chat, { react: { text: '🕸️', key: m.key } });

        } catch (err) {
            console.error('[COMJS ERROR]', err.message);
            reply(`✘ ֎ Failed to create file\n❏ Error: ${err.message}`);
        }
    }
},
// NEW SUBCOMMAND 1
{
    name: 'jsrun',
    alias: ['runjs'],
    category: 'Tools',
    desc: 'Execute simple JS code and return output',
    usage: '.jsrun <code>',
    execute: async (sock, m, { args, reply }) => {
        const code = args.join(' ').trim();
        if (!code) return reply('✘ ֎ Provide JS code to run');

        try {
            let result = eval(code); // Note: use with caution, for bot owner only
            let out = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} JS RUN •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *EXECUTION RESULT*
│ ❏ Code : ${code}
│ ❏ Output : ${result}
╰─────────────────────────╯`;
            reply(out);
        } catch (e) {
            reply(`✘ ֎ Error: ${e.message}`);
        }
    }
},
// NEW SUBCOMMAND 2
{
    name: 'jslint',
    alias: ['lintjs'],
    category: 'Tools',
    desc: 'Basic JS syntax check',
    usage: '.jslint <code>',
    execute: async (sock, m, { args, reply }) => {
        const code = args.join(' ').trim();
        if (!code) return reply('✘ ֎ Provide JS code to check');

        try {
            new Function(code);
            reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LINTER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SYNTAX CHECK*
│ ❏ Status : PASSED
│ ❏ No syntax errors found
╰─────────────────────────╯`);
        } catch (e) {
            reply(`✘ ֎ Syntax Error\n❏ ${e.message}`);
        }
    }
}];