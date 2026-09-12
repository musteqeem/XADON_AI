const fs = require('fs');
const path = require('path');

const DIARY_PATH = path.join(process.cwd(), 'database', 'diary.json');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

function loadDiary() {
    try { if (fs.existsSync(DIARY_PATH)) return JSON.parse(fs.readFileSync(DIARY_PATH, 'utf8')); } catch {}
    return {};
}

function saveDiary(data) {
    fs.mkdirSync(path.dirname(DIARY_PATH), { recursive: true });
    fs.writeFileSync(DIARY_PATH, JSON.stringify(data, null, 2));
}

// Simple XOR encryption
function encrypt(text, key) {
    return text.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('');
}

const decrypt = encrypt;

module.exports = [{
    name: 'diary',
    alias: ['journal', 'mydiary', 'dnote', 'secret'],
    category: 'Documents',
    desc: 'Write and read encrypted diary entries',
    usage: '.diary write <password> | <entry>\n.diary read <password> | <date>\n.diary list <password>\n.diary delete <password> | <date>',

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase();
        const rest = args.slice(1).join(' ');
        const phone = (m.sender || '').split('@')[0];

        if (!sub) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DIARY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ENCRYPTED DIARY*
│ ❏ Write : ${prefix}diary write <pw> | <entry>
│ ❏ Read : ${prefix}diary read <pw> | <date>
│ ❏ List : ${prefix}diary list <pw>
│ ❏ Delete : ${prefix}diary delete <pw> | <date>
│ ❏ Export : ${prefix}diary export <pw>
│ ❏ Security : XOR + Base64 Encryption
╰─────────────────────────╯`;
            return reply(help);
        }

        if (sub === 'write') {
            const parts = rest.split('|').map(p => p.trim());
            const password = parts[0];
            const entry = parts.slice(1).join('|').trim();

            if (!password ||!entry) return reply('✘ ֎ Usage:.diary write <password> | <entry>');

            const diary = loadDiary();
            if (!diary[phone]) diary[phone] = [];

            const encrypted = Buffer.from(encrypt(entry, password)).toString('base64');
            const date = new Date().toISOString().split('T')[0];

            diary[phone].push({ date, entry: encrypted, time: Date.now() });
            saveDiary(diary);

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DIARY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ENTRY SAVED*
│ ❏ Date : ${date}
│ ❏ Status : Encrypted
│ ❏ Security : Locked
╰─────────────────────────╯`);
        }

        if (sub === 'read') {
            const parts = rest.split('|').map(p => p.trim());
            const password = parts[0];
            const date = parts[1];

            if (!password) return reply('✘ ֎ Usage:.diary read <password> | <date>');

            const diary = loadDiary();
            const entries = diary[phone] || [];

            let filtered = entries;
            if (date) filtered = entries.filter(e => e.date === date);
            if (!filtered.length) return reply('✘ ֎ No entries found');

            const latest = filtered[filtered.length - 1];
            try {
                const decoded = Buffer.from(latest.entry, 'base64').toString();
                const decrypted = decrypt(decoded, password);
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DIARY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DIARY ENTRY*
│ ❏ Date : ${latest.date}
│
│ ${decrypted}
╰─────────────────────────╯`);
            } catch (e) {
                return reply('✘ ֎ Wrong password or corrupted entry');
            }
        }

        if (sub === 'list') {
            const password = rest.trim();
            if (!password) return reply('✘ ֎ Usage:.diary list <password>');

            const diary = loadDiary();
            const entries = diary[phone] || [];

            if (!entries.length) return reply('✘ ֎ No diary entries');

            let list = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DIARY LIST •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *YOUR ENTRIES*
`;
            entries.forEach((e, i) => {
                try {
                    const decoded = Buffer.from(e.entry, 'base64').toString();
                    const preview = decrypt(decoded, password).substring(0, 30);
                    list += `│ ❏ ${e.date} : ${preview}...\n`;
                } catch {}
            });
            list += `╰─────────────────────────╯`;

            return reply(list);
        }

        // NEW SUBCOMMAND 1
        if (sub === 'delete') {
            const parts = rest.split('|').map(p => p.trim());
            const password = parts[0];
            const date = parts[1];

            if (!password ||!date) return reply('✘ ֎ Usage:.diary delete <password> | <date>');

            const diary = loadDiary();
            if (!diary[phone]) return reply('✘ ֎ No entries found');

            const before = diary[phone].length;
            diary[phone] = diary[phone].filter(e => {
                if (e.date!== date) return true;
                try { decrypt(Buffer.from(e.entry, 'base64').toString(), password); return false; }
                catch { return true; }
            });
            saveDiary(diary);

            if (diary[phone].length === before) return reply('✘ ֎ No entry deleted. Wrong password or date');
            return reply(`֎ Entry for ${date} deleted successfully`);
        }

        // NEW SUBCOMMAND 2
        if (sub === 'export') {
            const password = rest.trim();
            if (!password) return reply('✘ ֎ Usage:.diary export <password>');

            const diary = loadDiary();
            const entries = diary[phone] || [];
            if (!entries.length) return reply('✘ ֎ No entries to export');

            let exportText = `=== ${BOT_NAME} DIARY EXPORT ===\n`;
            entries.forEach(e => {
                try {
                    const decoded = Buffer.from(e.entry, 'base64').toString();
                    const decrypted = decrypt(decoded, password);
                    exportText += `\n[${e.date}]\n${decrypted}\n`;
                } catch {}
            });

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const filePath = path.join(tempDir, `diary_${phone}.txt`);
            fs.writeFileSync(filePath, exportText);

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(filePath),
                fileName: `diary_export.txt`,
                mimetype: 'text/plain',
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} DIARY EXPORT •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *EXPORT READY*\n│ ❏ Entries : ${entries.length}\n╰─────────────────────────╯`
            }, { quoted: m });
            fs.unlinkSync(filePath);
        }
    }
}];