const config = require('../../../settings/config');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const DAY_MAP = {
    mon: 'MONDAY', monday: 'MONDAY',
    tue: 'TUESDAY', tuesday: 'TUESDAY',
    wed: 'WEDNESDAY', wednesday: 'WEDNESDAY',
    thu: 'THURSDAY', thursday: 'THURSDAY',
    fri: 'FRIDAY', friday: 'FRIDAY',
    sat: 'SATURDAY', saturday: 'SATURDAY',
    sun: 'SUNDAY', sunday: 'SUNDAY'
};

const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return (h * 60) + (m || 0);
};

const parseDay = (entry) => {
    const [rawDay, rawMode] = entry.split(',');
    const day = DAY_MAP[rawDay.trim().toLowerCase()];
    if (!day) throw new Error(`Unknown day: ${rawDay}`);
    if (rawMode === 'open_24h' || rawMode === 'closed') return { day, mode: rawMode };
    if (rawMode.includes('-')) {
        const [open, close] = rawMode.split('-');
        return {
            day,
            mode: 'specific_hours',
            openTimeInMinutes: toMinutes(open.trim()),
            closeTimeInMinutes: toMinutes(close.trim())
        };
    }
    throw new Error(`Unknown mode: ${rawMode}. Use open_24h, closed, or HH:MM-HH:MM`);
};

const FIELD_ICON = {
    desc: '📝', description: '📝',
    email: '📧',
    website: '🌐',
    address: '📍',
    hours: '🕐'
};

const USAGE = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} BUSINESS UPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FIELDS*
│ ❏ desc <text> : Business description
│ ❏ email <email> : Business email
│ ❏ website <url> : Business website
│ ❏ address <address> : Business address
│ ❏ hours <schedule> : Opening hours
╰─────────────────────────╯
╭─֎ *HOURS EXAMPLE*
│ ❏ mon,open_24h
│ ❏ tue,09:00-18:00
│ ❏ sat,10:00-14:00;sun,closed
╰─────────────────────────╯`;

module.exports = {
    name: 'bizupdate',
    alias: ['updatebiz', 'bizsetup', 'bupdate'],
    desc: 'Update your WhatsApp Business profile',
    category: 'Business',
    owner: true,
    usage: '.bizupdate [field] [value]',

    execute: async (sock, m, { args, reply }) => {
        const field = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');

        if (!field || !value) return reply(USAGE);

        try {
            await sock.sendMessage(m.chat, { react: { text: '🔧', key: m.key } });

            const updates = {};

            switch (field) {
                case 'desc':
                case 'description':
                    updates.description = value.slice(0, 512);
                    break;
                case 'address':
                    updates.address = value.slice(0, 256);
                    break;
                case 'email':
                    if (!value.includes('@')) throw new Error('Invalid email format');
                    updates.email = value;
                    break;
                case 'website':
                    updates.websites = [value];
                    break;
                case 'hours': {
                    const days = value.split(';').map(entry => parseDay(entry.trim()));
                    updates.hours = { timezone: 'Africa/Lagos', days };
                    break;
                }
                default:
                    return reply('✘ ֎ Unknown field.\n❏ Use: desc, address, email, website, hours');
            }

            const updateFn = sock.updateBusinessProfile || sock.updateBussinesProfile;
            if (!updateFn) throw new Error('updateBusinessProfile not available. Update @musteqeem/baileys');

            await updateFn.call(sock, updates);

            const icon = FIELD_ICON[field] || '📝';
            const displayValue = value.length > 100? value.slice(0, 100) + '...' : value;

            await sock.sendMessage(m.chat, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} BUSINESS UPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Field : ${field}
${icon} Value : ${displayValue}
❏ Status : Updated Successfully`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error('[BIZUPDATE ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Business Update Failed\n❏ Error: ${err.message}`);
        }
    }
};