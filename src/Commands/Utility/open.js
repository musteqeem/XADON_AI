module.exports = {
    name: 'open',
    alias: ['view', 'website'],
    desc: 'Create a website button that opens in-app',
    category: 'Tools',
    usage: '.url <link> | <button text>',
    reactions: { start: '🌐', success: '🥏', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        let fullText = args.join(' ').trim();

        if (!fullText && m.quoted) {
            const qtype = m.quoted.mtype || '';
            if (qtype === 'conversation' || qtype === 'extendedTextMessage') {
                fullText = m.quoted.body || m.quoted.text || '';
            }
        }

        if (!fullText) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • WEBSITE BUTTON •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *OPEN LINK*
│ ❏ Usage : ${prefix}url <link> | <button text>
│ ❏ Example : ${prefix}url https://xadon.vercel.app | Visit Site
│ ❏ Example : ${prefix}url https://youtube.com | Watch
│ ❏ Info : Opens in WhatsApp's in-app browser
╰─────────────────────────╯`
            );
        }

        const parts = fullText.split('|').map(p => p.trim());
        let url = parts[0] || '';
        const buttonText = parts[1] || '☁ Open Link';

        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        await sock.sendMessage(m.chat, { react: { text: '🌐', key: m.key } });

        try {
            await sock.sendMessage(m.chat, {
                text: `◈ *${buttonText}*\n\n_*ⓘ secured link*_`,
                nativeFlow: [{
                    text: buttonText,
                    url: url,
                    useWebview: true
                }]
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '🥏', key: m.key } });

        } catch (error) {
            console.error('[URL ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(`☁ *Link:* ${url}`);
        }
    }
};