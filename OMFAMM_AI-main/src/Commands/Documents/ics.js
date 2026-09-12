const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'ics',
    alias: ['event', 'calendar', 'cal'],
    category: 'Documents',
    desc: 'Generate a calendar event (.ics) file',
    usage: '.ics Title | Location | YYYY-MM-DD | HH:MM | Duration(min) | Description',

    execute: async (sock, m, { args, reply, prefix }) => {
        const input = args.join(' ').trim();
        if (!input) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CALENDAR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ICS EVENT CREATOR*
│ ❏ Usage : ${prefix}ics Title | Location | Date | Time | Duration | Desc
│ ❏ Example : ${prefix}ics Meeting | Office | 2026-05-10 | 14:00 | 60 | Team sync
│ ❏ Date Format : YYYY-MM-DD
│ ❏ Time Format : HH:MM 24h
│ ❏ Output :.ics file for Google/Outlook
╰─────────────────────────╯`;
            return reply(help);
        }

        const parts = input.split('|').map(p => p.trim());
        const title = parts[0] || 'Event';
        const location = parts[1] || '';
        const date = parts[2] || new Date().toISOString().split('T')[0];
        const time = parts[3] || '12:00';
        const duration = parseInt(parts[4]) || 60;
        const description = parts[5] || `Created by ${BOT_NAME}`;

        // Validate date and time
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return reply('✘ ֎ Invalid date. Use YYYY-MM-DD');
        if (!/^\d{2}:\d{2}$/.test(time)) return reply('✘ ֎ Invalid time. Use HH:MM');

        const startTime = `${date}T${time}:00`.replace(/[^0-9T:]/g, '');
        const endDate = new Date(`${date}T${time}:00`);
        if (isNaN(endDate.getTime())) return reply('✘ ֎ Invalid date or time provided');

        endDate.setMinutes(endDate.getMinutes() + duration);
        const endTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const startFormatted = `${date}T${time}:00`.replace(/[-:]/g, '') + 'Z';
        const uid = `${Date.now()}@${BOT_NAME.toLowerCase().replace(/\s/g, '')}`;

        let ics = 'BEGIN:VCALENDAR\n';
        ics += 'VERSION:2.0\n';
        ics += 'PRODID:-//XADON AI//EN\n';
        ics += 'BEGIN:VEVENT\n';
        ics += `UID:${uid}\n`;
        ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        ics += `DTSTART:${startFormatted}\n`;
        ics += `DTEND:${endTime}\n`;
        ics += `SUMMARY:${title}\n`;
        if (location) ics += `LOCATION:${location}\n`;
        ics += `DESCRIPTION:${description}\n`;
        ics += 'BEGIN:VALARM\nTRIGGER:-PT15M\nACTION:DISPLAY\nDESCRIPTION:Reminder\nEND:VALARM\n';
        ics += 'END:VEVENT\nEND:VCALENDAR';

        try {
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const filePath = path.join(tempDir, `event_${Date.now()}.ics`);
            fs.writeFileSync(filePath, ics, 'utf8');

            const stats = fs.statSync(filePath);

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} EVENT CREATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CALENDAR EVENT*
│ ❏ Title : ${title}
│ ❏ Date : ${date}
│ ❏ Time : ${time}
│ ❏ Duration : ${duration} minutes
│ ❏ Location : ${location || 'Not set'}
│ ❏ Reminder : 15 minutes before
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(filePath),
                fileName: `${title}.ics`,
                mimetype: 'text/calendar',
                caption: caption
            }, { quoted: m });

            fs.unlinkSync(filePath);
            await sock.sendMessage(m.chat, { react: { text: '📅', key: m.key } });

        } catch (e) {
            console.error('[ICS]', e);
            reply(`✘ ֎ Failed to create event\n❏ Error: ${e.message}`);
        }
    }
};