const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'json',
    alias: ['jsong', 'jsonformat', 'jsonfile', 'tojson'],
    category: 'Documents',
    desc: 'Create or format a JSON file',
    usage: '.json key:value key2:value2\n.reply to json/text with .json',

    execute: async (sock, m, { args, reply, prefix }) => {
        let text = args.join(' ').trim();
        
        // Get from quoted message
        if (!text && m.quoted) {
            text = (m.quoted.text || m.quoted.caption || '').trim();
        }

        if (!text) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} JSON CREATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *JSON GENERATOR*
│ ❏ Key:Value : ${prefix}json name:John age:25
│ ❏ Raw JSON : ${prefix}json {"name":"John"}
│ ❏ From Reply : Reply to text with ${prefix}json
│ ❏ Output : Formatted.json file
╰─────────────────────────╯`;
            return reply(help);
        }

        let obj = {};
        
        try {
            await reply('֎ Processing JSON...');

            // Try parsing as raw JSON first
            try {
                obj = JSON.parse(text);
            } catch (e) {
                // Parse key:value pairs
                const pairs = text.match(/(\w+):("[^"]*"|\S+)/g);
                if (!pairs) return reply('✘ ֎ Invalid format. Use key:value or valid JSON');

                pairs.forEach(pair => {
                    const [key, ...val] = pair.split(':');
                    let value = val.join(':').trim();
                    // Convert types
                    if (/^\d+$/.test(value)) value = parseInt(value);
                    else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
                    else if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (value === 'null') value = null;
                    else value = value.replace(/^"|"$/g, '');
                    obj[key] = value;
                });
            }

            const formatted = JSON.stringify(obj, null, 2);
            const keyCount = Object.keys(obj).length;

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const fileName = `data_${Date.now()}.json`;
            const filePath = path.join(tempDir, fileName);
            fs.writeFileSync(filePath, formatted, 'utf8');

            const sizeKB = (Buffer.byteLength(formatted, 'utf8') / 1024).toFixed(1);

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} JSON FILE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *JSON CREATED*
│ ❏ File : ${fileName}
│ ❏ Keys : ${keyCount}
│ ❏ Size : ${sizeKB} KB
│ ❏ Format : Pretty Printed
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(filePath),
                fileName: fileName,
                mimetype: 'application/json',
                caption: caption
            }, { quoted: m });

            // Also send preview in chat
            await sock.sendMessage(m.chat, {
                text: `\`\`\`json\n${formatted}\`\``
            }, { quoted: m });

            fs.unlinkSync(filePath);
            await sock.sendMessage(m.chat, { react: { text: '📋', key: m.key } });

        } catch (e) {
            console.error('[JSON]', e);
            reply(`✘ ֎ Failed to create JSON\n❏ Error: ${e.message}`);
        }
    }
};