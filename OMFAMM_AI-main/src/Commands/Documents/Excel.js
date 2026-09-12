const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'excel',
    alias: ['xls', 'xlsx', 'sheet'],
    category: 'Documents',
    desc: 'Generate a simple Excel file',
    usage: '.excel Title | col1,col2 | val1,val2 | val3,val4\n.diary csv (reply to csv file)',

    execute: async (sock, m, { args, reply, prefix }) => {
        const input = args.join(' ').trim();
        const quoted = m.quoted;

        if (!input &&!quoted) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} EXCEL CREATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *EXCEL GENERATOR*
│ ❏ Manual : ${prefix}excel Title | col1,col2 | val1,val2
│ ❏ From CSV : Reply to.csv file with ${prefix}excel
│ ❏ Example : ${prefix}excel Users | Name,Age | John,25
│ ❏ Output :.xls file compatible with Excel
╰─────────────────────────╯`;
            return reply(help);
        }

        let title = 'Sheet';
        let rows = [];

        try {
            // Case 1: From CSV file
            if (quoted && quoted.mimetype?.includes('csv')) {
                const buffer = await quoted.download();
                if (!buffer) return reply('✘ ֎ Failed to download CSV file');
                const csv = buffer.toString('utf8');
                rows = csv.split('\n').filter(r => r.trim());
                title = quoted.fileName?.replace('.csv', '') || 'CSV_Import';
                await reply('֎ Building Excel from CSV...');
            }
            // Case 2: Manual input
            else {
                const parts = input.split('|').map(p => p.trim());
                if (parts.length < 2) return reply('✘ ֎ Provide title and at least one data row');

                title = parts[0];
                rows = parts.slice(1);
                await reply('֎ Building Excel file...');
            }

            // Build simple HTML-based Excel
            let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head><meta charset="UTF-8"><title>${title}</title></head>
            <body><table border="1"><caption><b>${title}</b></caption>`;

            rows.forEach((row, i) => {
                const tag = i === 0? 'th' : 'td';
                const cols = row.split(',').map(c => `<${tag}>${c.trim()}</${tag}>`).join('');
                html += `<tr>${cols}</tr>`;
            });

            html += '</table></body></html>';

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const filePath = path.join(tempDir, `${title}_${Date.now()}.xls`);
            fs.writeFileSync(filePath, html, 'utf8');

            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(1);

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} EXCEL FILE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *EXCEL CREATED*
│ ❏ Title : ${title}
│ ❏ Rows : ${rows.length}
│ ❏ Size : ${sizeKB} KB
│ ❏ Format :.xls
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(filePath),
                fileName: `${title}.xls`,
                mimetype: 'application/vnd.ms-excel',
                caption: caption
            }, { quoted: m });

            fs.unlinkSync(filePath);
            await sock.sendMessage(m.chat, { react: { text: '📊', key: m.key } });

        } catch (e) {
            console.error('[EXCEL]', e);
            reply(`✘ ֎ Failed to create Excel\n❏ Error: ${e.message}`);
        }
    }
};