const math = require('mathjs');

module.exports = {
    name: 'calculator',
    alias: ['calc', 'scientificcalc'],
    desc: 'Scientific calculator with mathjs',
    category: 'Tools',
    usage: '.calculator → show menu\n.calc <expression> → evaluate',
    reactions: { start: '🔢', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args.length) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 • SCIENTIFIC CALCULATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.calc 2+3*4 → basic arithmetic
│ ❏.calc sin(pi/2) → trig functions
│ ❏.calc log(100,10) → logarithms
│ ❏.calc sqrt(16) → square roots
│ ❏.calc factorial(5) → factorials
│
│ ❏ *Supported*
│ • + - * / ^ %
│ • sin, cos, tan, log, sqrt
│ • factorial, pi, e, and more
│
│ ❏ *Example* :.calc (2+3)^2 / 5
╰─────────────────────────╯`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '🔢', key: m.key } });

            const expression = args.join(' ');
            let result;

            try {
                result = math.evaluate(expression);
            } catch {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply('✘ Invalid expression. Check syntax');
            }

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
  • CALCULATION RESULT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RESULT*
│ ❏ Expression : ${expression}
│ ❏ Result : ${result}
╰─────────────────────────╯`
            );

        } catch (err) {
            console.error('[CALCULATOR ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply('✘ Error evaluating expression');
        }
    }
};