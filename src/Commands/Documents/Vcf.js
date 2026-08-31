const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'vcf',
    alias: ['contact', 'savecontact', 'card'],
    category: 'Documents',
    desc: 'Generate a contact card (.vcf file)',
    usage: '.vcf Name | Phone | Email | Org | Address',

    execute: async (sock, m, { args, reply, prefix }) => {
        const input = args.join(' ').trim();
        if (!input) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} VCF CREATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CONTACT CARD*
│ ❏ Usage : ${prefix}vcf Name | Phone | Email | Org | Address
│ ❏ Example : ${prefix}vcf John Doe | 2348012345678 | john@email.com | XADON Inc | Lagos, NG
│ ❏ Note : Phone must be with country code
│ ❏ Output :.vcf file importable to WhatsApp/Phone
╰─────────────────────────╯`;
            return reply(help);
        }

        const parts = input.split('|').map(p => p.trim());
        const name = parts[0] || 'Contact';
        const phone = parts[1] || '';
        const email = parts[2] || '';
        const org = parts[3] || '';
        const address = parts[4] || '';

        // Basic validation
        if (!name) return reply('✘ ֎ Name is required');
        if (phone && !/^[0-9+\s-]{8,}$/.test(phone)) return reply('✘ ֎ Invalid phone number format');

        let vcf = 'BEGIN:VCARD\n';
        vcf += 'VERSION:3.0\n';
        vcf += `FN:${name}\n`;
        if (org) vcf += `ORG:${org}\n`;
        if (phone) vcf += `TEL;TYPE=CELL:${phone}\n`;
        if (email) vcf += `EMAIL;TYPE=WORK:${email}\n`;
        if (address) vcf += `ADR;TYPE=WORK:;;${address};;;;\n`;
        vcf += `NOTE:Created by ${BOT_NAME}\n`;
        vcf += 'END:VCARD';

        try {
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const safeName = name.replace(/[^a-z0-9]/gi, '_');
            const fileName = `${safeName}_${Date.now()}.vcf`;
            const filePath = path.join(tempDir, fileName);
            fs.writeFileSync(filePath, vcf, 'utf8');

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CONTACT CARD •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *VCARD CREATED*
│ ❏ Name : ${name}
│ ❏ Phone : ${phone || 'Not set'}
│ ❏ Email : ${email || 'Not set'}
│ ❏ Org : ${org || 'Not set'}
│ ❏ Address : ${address || 'Not set'}
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯
❏ Tap file to save contact`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(filePath),
                fileName: `${name}.vcf`,
                mimetype: 'text/vcard',
                caption: caption
            }, { quoted: m });

            fs.unlinkSync(filePath);
            await sock.sendMessage(m.chat, { react: { text: '📇', key: m.key } });

        } catch (e) {
            console.error('[VCF]', e);
            reply(`✘ ֎ Failed to create contact\n❏ Error: ${e.message}`);
        }
    }
};