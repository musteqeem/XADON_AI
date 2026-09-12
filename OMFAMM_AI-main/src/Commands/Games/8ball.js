const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

const ANSWERS = [
    'Yes, definitely! ✅', 'It is certain ✨', 'Without a doubt 💯',
    'Yes, absolutely 🌟', 'You may rely on it 👍', 'As I see it, yes 👀',
    'Most likely 🎯', 'Outlook good 🌈', 'Signs point to yes 👆',
    'Reply hazy, try again 🤷', 'Ask again later ⏰', 'Better not tell you now 🤫',
    'Cannot predict now 🔮', 'Concentrate and ask again 🧘', 'Don\'t count on it 🤔',
    'My reply is no ❌', 'My sources say no 📡', 'Very doubtful 🧐'
];

module.exports = {
    name: '8ball',
    alias: ['8ball', 'magic8', 'fortune'],
    desc: 'Ask the Magic 8-Ball a question',
    category: 'Games',
    usage: '.8ball <your question>',
    reactions: { start: '🎱', success: '🎭', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎱', key: m.key } });

        const question = args.join(' ').trim();
        
        if (!question) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} MAGIC 8-BALL*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Command : ${prefix}8ball <question>
│ ❏ Example : ${prefix}8ball Will I be rich?
│ ❏ Example : ${prefix}8ball Should I go out?
╰─────────────────────────╯

_*🎱 Ask anything and the spirits will answer*_`
            );
        }

        const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

        await sock.sendMessage(m.chat, {
            text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} MAGIC 8-BALL*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *THE SPIRITS SAY...*
│ ❏ Question : ${question}
│ ❏ Answer : ${answer}
╰─────────────────────────╯

_*💡 Type ${prefix}8ball <question> to ask again*_`
        }, { quoted: m });

        await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });
    }
};