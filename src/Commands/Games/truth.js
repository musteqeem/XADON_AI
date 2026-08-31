const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

const TRUTHS = [
    'What is your biggest fear?', 'What is your most embarrassing moment?',
    'Have you ever lied to your best friend?', 'What is your guilty pleasure?',
    'What is the last lie you told?', 'Have you ever cheated on a test?',
    'What is your biggest regret?', 'Who was your first crush?',
    'Have you ever stolen anything?', 'What is your secret talent?',
    'What is the weirdest dream you\'ve had?', 'Have you ever ghosted someone?',
    'What is the craziest thing you\'ve done?', 'Who do you secretly dislike?',
    'What is the biggest mistake you\'ve made?'
];

module.exports = {
    name: 'truth',
    alias: ['truths', 'telltruth'],
    desc: 'Random truth questions',
    category: 'Games',
    usage: '.truth',
    reactions: { start: '😳', success: '🎭', error: '❌' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '😳', key: m.key } });

        const truth = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];

        await sock.sendMessage(m.chat, {
            text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} TRUTH*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *TELL THE TRUTH*
│ ❏ Question : ${truth}
│ ❏ Reply : Answer honestly!
╰─────────────────────────╯

_*🤫 No lying to ${BOT_NAME}*
_*💡 Use ${prefix}truth for another | ${prefix}dare for a challenge*_`
        }, { quoted: m });

        await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });
    }
};