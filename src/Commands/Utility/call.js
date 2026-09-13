module.exports = {
    name: 'call',
    alias: ['phone', 'dial', 'ring'],
    desc: 'Create a WhatsApp call button',
    category: 'Tools',
    usage: '.call <number> | <text>',
    reactions: { start: '📞', success: '🥏', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const fullText = args.join(' ').trim();

        if (!fullText) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
         • CALL ME •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *WHATSAPP CALL BUTTON*
│ ❏ Usage : ${prefix}call <number> | <text>
│ ❏ Example : ${prefix}call 234123456789 | Call
│ ❏ Action : Tap button to start WhatsApp call
│ ❏ Note : Include country code
╰─────────────────────────╯`
            );
        }

        // Parse number and text
        const parts = fullText.split('|').map(p => p.trim());
        let phoneNumber = parts[0] || '';
        const displayText = parts[1] || '* Call';

        // Clean phone number - remove +, spaces, dashes
        phoneNumber = phoneNumber.replace(/[+\s\-()]/g, '');

        
        if (!phoneNumber ||!/^\d{10,15}$/.test(phoneNumber)) {
            return reply('`✘ Invalid phone number. Must be 10-15 digits.`');
        }

        await sock.sendMessage(m.chat, { react: { text: '📞', key: m.key } });

        try {
            // ✅ CORRECT WAY FROM README: Use `call:` in nativeFlow
            await sock.sendMessage(m.chat, {
                text: '*TAP TO CALL 🤙*',
                nativeFlow: [{
                    text: ` ${displayText}`,
                    call: phoneNumber // ✅ This should trigger WhatsApp call!
                }]
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '🥏', key: m.key } });

        } catch (error) {
            console.error('[CALL ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });

            // Fallback with official UI
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
        •  CALL ME •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DIRECT CALL*
│ ❏ Number : ${phoneNumber}
│ ❏ Label : ${displayText}
│ ❏ Status : Tap to call
╰─────────────────────────╯`
            );
        }
    }
};