module.exports = {
    name: 'sms24numbers',
    alias: ['sms24', 'smsnums', '24numbers'],
    desc: 'List available SMS24 virtual phone numbers',
    category: 'Tools',

    execute: async (sock, m, { args, reply }) => {
        try {
            const country = args[0]?.toUpperCase() || 'US';

            await sock.sendPresenceUpdate('composing', m.chat);

            const apiUrl = `https://apis.prexzyvilla.site/vnum/sms24-numbers?country=${encodeURIComponent(country)}`;

            const res = await fetch(apiUrl, { timeout: 15000 });

            if (!res.ok) {
                return reply(`✘ SMS24 API Error ${res.status}\n◈ Service temporarily unavailable`);
            }

            const json = await res.json();

            const numbers = json.numbers || [];

            if (!numbers.length) {
                return reply(`◈ No numbers for ${country}\n◈ Try: US, GB, CA, AU, DE, FR`);
            }

            const displayNumbers = numbers.slice(0, 15);
            let list = displayNumbers.map((num, i) => {
                const phone = num.phoneNumber || num.phone || num.number || num.num;
                const region = num.country || country;
                return `${i + 1}. *${phone}* (${region})`;
            }).join('\n');

            const message =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • SMS24 NUMBERS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *AVAILABLE NUMBERS*
│ ❏ Country : ${country}
│ ❏ Available : ${numbers.length}
│
${list}
│
│ ❏ Use :.sms24msg <number> to read SMS
╰─────────────────────────╯`;

            await reply(message);

        } catch (err) {
            console.error('[SMS24NUMBERS ERROR]', err);
            reply('✘ Failed to fetch numbers');
        }
    }
};