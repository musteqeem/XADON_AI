module.exports = {
    name: 'encryptcode',
    alias: ['encrypt', 'codeencrypt', 'protectcode'],
    category: 'Tools',
    desc: 'Encrypt/obfuscate JavaScript code (reply to code or.js file)',
    usage: '.encryptcode <light/medium/heavy> (reply to code or.js file)',

    execute: async (sock, m, { args, reply }) => {
        const level = args[0]?.toLowerCase() || 'medium';
        if (!['light', 'medium', 'heavy'].includes(level)) {
            return reply('✘ Usage:.encryptcode <light|medium|heavy>\nReply to code or a.js file');
        }

        const quoted = m.quoted || m;
        let code = '';

        if (quoted.mimetype && quoted.mimetype.includes('javascript')) {
            try {
                const buffer = await quoted.download();
                code = buffer.toString('utf8');
            } catch (e) {
                return reply('✘ Failed to read file');
            }
        } else if (quoted.text || quoted.body) {
            code = quoted.text || quoted.body;
        } else {
            return reply('✘ Reply to JavaScript code or a.js file\nUsage:.encryptcode <light|medium|heavy>');
        }

        if (!code || code.trim().length < 10) {
            return reply('✘ Code too short to obfuscate');
        }

        const levelTag = { light: '[LIGHT]', medium: '[MEDIUM]', heavy: '[HEAVY]' };
        await sock.sendMessage(m.chat, { react: { text: '🛡️', key: m.key } });
        await reply('_' + levelTag[level] + ' Encrypting with ' + level.toUpperCase() + ' protection..._');

        try {
            const response = await fetch('https://obf.crysnovax.link/api/obfuscate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, level: level })
            });

            const data = await response.json();

            if (data.error) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply('✘ ' + data.error);
            }

            const result = data.code;
            const stats = data.stats;

            await sock.sendMessage(m.chat, {
                document: Buffer.from(result, 'utf8'),
                fileName: 'encrypted.js',
                mimetype: 'application/javascript',
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • CODE ENCRYPTED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATS*
│ ❏ Original : ${stats.originalSize}
│ ❏ Encrypted : ${stats.obfuscatedSize}
│ ❏ Increase : ${stats.increase}
│ ❏ Level : ${levelTag[level]} ${stats.level.toUpperCase()}
│
│ ❏ Protected by CRYSNOVA AI
╰─────────────────────────╯`
            });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[ENCRYPTCODE]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply('✘ Encryption failed: ' + err.message);
        }
    }
};