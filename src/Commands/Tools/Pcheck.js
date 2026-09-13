function checkStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        vLong: password.length >= 12,
        noCommon: !/password|123456|qwerty|abc123/i.test(password)
    };

    for (const check of Object.values(checks)) {
        if (check) score++;
    }

    if (score <= 2) return { level: 'Weak', tag: '[WEAK]', color: 'red' };
    if (score <= 4) return { level: 'Fair', tag: '[FAIR]', color: 'orange' };
    if (score <= 6) return { level: 'Good', tag: '[GOOD]', color: 'yellow' };
    return { level: 'Strong', tag: '[STRONG]', color: 'green' };
}

module.exports = {
    name: 'password',
    alias: ['passwd', 'passcheck', 'strength'],
    desc: 'Check password strength',
    category: 'Games',
    usage: '.password <your password>',
    reactions: { start: '🔐', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const password = args.join(' ');
        
        if (!password) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
  • PASSWORD CHECKER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}password <pass>
│
│ ❏ Example : ${prefix}password MyP@ss123
│
│ ❏ Checks password strength
╰─────────────────────────╯`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '🔐', key: m.key } });

        const strength = checkStrength(password);
        const masked = password.slice(0, 2) + '•••' + password.slice(-1);

        await sock.sendMessage(m.chat, {
            headerText: `## ◈ Password Strength`,
            contentText: '---',
            title: `◈ ${strength.tag} ${strength.level}`,
            table: [
                ['Password', masked],
                ['Length', password.length + ' characters'],
                ['Uppercase', /[A-Z]/.test(password) ? 'Yes' : 'No'],
                ['Lowercase', /[a-z]/.test(password) ? 'Yes' : 'No'],
                ['Numbers', /\d/.test(password) ? 'Yes' : 'No'],
                ['Special', /[!@#$%^&*]/.test(password) ? 'Yes' : 'No'],
                ['Rating', strength.level]
            ],
            footerText: '💡 Strong passwords have 8+ chars, mixed case, numbers & symbols'
        }, { quoted: m });

        await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
    }
};