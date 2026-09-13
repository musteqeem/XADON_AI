const { jidNormalizedUser } = require('@musteqeem/baileys');

const box = (title, content) => {
    const line = '─'.repeat(Math.min(title.length + 2, 40));
    return `┌➫─⏚ ${title} ${line}\n${content}\n└${'─'.repeat(42)}`;
};

module.exports = {
    name: 'bancheck',
    alias: ['bc', 'checkban'],
    desc: 'Check if a WhatsApp number is banned or not',
    category: 'Owner',
    ownerOnly: true,

    execute: async (sock, m, { args, reply, text, prefix, command, isOwner }) => {
        if (!args[0]) return reply(`✦ Usage: \`${prefix}bancheck 2348001234567\`\n✦ Note: Use full number with country code, no + or spaces`);

        let number = args[0].replace(/[^0-9]/g, '');
        const jid = jidNormalizedUser(number + '@s.whatsapp.net');

        const startTime = Date.now();

        try {
            // Method 1: Check if number exists on WA
            const [result] = await sock.onWhatsApp(number);

            if (!result) {
                return reply(box(`✘ NOT ON WHATSAPP ${(Date.now()-startTime)}ms`, `Number: ${number}\nStatus: Not registered on WhatsApp`));
            }

            // Method 2: Try to fetch profile picture. Banned accounts throw 403
            let status = '✅ ACTIVE';
            let reason = 'Account is working fine';

            try {
                await sock.profilePictureUrl(jid, 'image');
            } catch (e) {
                if (e.message.includes('404')) {
                    status = '✅ ACTIVE';
                    reason = 'No profile picture but account is active';
                } else if (e.message.includes('403') || e.message.includes('401')) {
                    status = '🚫 BANNED';
                    reason = 'WhatsApp returned 403. Account is likely banned';
                }
            }

            // Method 3: Try to get status. Banned = error
            try {
                await sock.fetchStatus(jid);
            } catch (e) {
                if (e.message.includes('not-authorized') || e.message.includes('401')) {
                    status = '🚫 BANNED';
                    reason = 'Not authorized. Account is banned';
                }
            }

            return reply(box(`📞 BAN CHECK ${(Date.now()-startTime)}ms`, `Number: ${number}\nStatus: ${status}\nInfo: ${reason}`));

        } catch (err) {
            return reply(box(`✘ ERROR ${(Date.now()-startTime)}ms`, `Number: ${number}\nError: ${err.message}`));
        }
    }
};