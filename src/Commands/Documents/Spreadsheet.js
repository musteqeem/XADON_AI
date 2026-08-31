const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'csv',
    alias: ['spreadsheet', 'csvgen', 'tocsv'],
    category: 'Documents',
    desc: 'Generate a CSV file from data',
    usage: '.csv header1,header2 | row1val1,row1val2\n.reply to json with.csv',

    execute: async (sock, m, { args, reply, prefix }) => {
        let input = args.join(' ').trim();
        let rows = [];

        // Case 1: From quoted JSON
        if (!input && m.quoted) {
            try {
                const quotedText = (m.quoted.text || m.quoted.caption || '').trim();
                const obj = JSON.parse(quotedText);
                const dataArray = Array.isArray(obj)? obj : [obj];

                if (dataArray.length === 0) return reply('✘ ֎ Empty JSON array');

                const headers = Object.keys(dataArray[0]);
                rows.push(headers.join(','));
                dataArray.forEach(item => {
                    rows.push(headers.map(h => item[h]).join(','));
                });
                await reply('֎ Converting JSON to CSV...');
            } catch (e) {
                return reply('✘ ֎ Quoted message is not valid JSON');
            }
        }
        // Case 2: Manual input
        else if (input) {
            rows = input.split('|').map(r => r.trim());
            if (rows.length < 1) return reply('✘ ֎ Provide at least a header row');
            await reply('֎ Generating CSV file...');
        } else {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CSV GENERATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CSV CREATOR*
│ ❏ Manual : ${prefix}csv col1,col2 | val1,val2
│ ❏ From JSON : Reply to JSON with ${prefix}csv
│ ❏ Example : ${prefix}csv Name,Age,City | John,25,Lagos
│ ❏ Output :.csv file for Excel/Sheets
╰─────────────────────────╯`;
            return reply(help);
        }

        try {
            let csv = '';
            rows.forEach((row, i) => {
                const cols = row.split(',').map(c => {
                    const val = c.trim();
                    // Escape quotes and wrap in quotes if contains comma
                    if (val.includes(',') || val.includes('"')) {
                        return `"${val.replace(/"/g, '""')}"`;
                    }
                    return `"${val}"`;
                }).join(',');
                csv += cols + '\n';
            });

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const fileName = `spreadsheet_${Date.now()}.csv`;
            const filePath = path.join(tempDir, fileName);
            fs.writeFileSync(filePath, csv, 'utf8');

            const sizeKB = (Buffer.byteLength(csv, 'utf8') / 1024).toFixed(1);

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CSV FILE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CSV CREATED*
│ ❏ File : ${fileName}
│ ❏ Rows : ${rows.length}
│ ❏ Size : ${sizeKB} KB
│ ❏ Format : UTF-8 CSV
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(filePath),
                fileName: fileName,
                mimetype: 'text/csv',
                caption: caption
            }, { quoted: m });

            fs.unlinkSync(filePath);
            await sock.sendMessage(m.chat, { react: { text: '📊', key: m.key } });

        } catch (e) {
            console.error('[CSV]', e);
            reply(`✘ ֎ Failed to create CSV\n❏ Error: ${e.message}`);
        }
    }
};