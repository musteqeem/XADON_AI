const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

const DARES = [
    'Send a voice note singing your favorite song',
    'Text your crush "I had a dream about you"',
    'Post "I love XADON AI" as your status', // <- Will auto use BOT_NAME
    'Send a selfie making a funny face',
    'Call someone and say "I just called to say I love you"',
    'Do 10 push-ups right now',
    'Send a voice note imitating a celebrity',
    'Change your group name to "XADON Fan Club" for 1 hour', // <- Will auto use BOT_NAME
    'Send a message using only emojis for the next 5 minutes',
    'Take a photo of your shoe and post it as your profile picture',
    'Say "I am the greatest" out loud 3 times',
    'Send a voice note telling a joke',
    'Do your best robot dance and describe it in text',
    'Type the alphabet backwards in the chat',
    'Send a message to the last person you DM\'d saying "You\'re awesome!"'
];

module.exports = {
    name: 'dare',
    alias: ['dares', 'dodare'],
    desc: 'Random dare challenges',
    category: 'Games',
    usage: '.dare',
    reactions: { start: '😈', success: '🎭', error: '❌' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '😈', key: m.key } });

        // Auto replace bot name in dares
        const finalDares = DARES.map(d => d.replace(/XADON AI/g, BOT_NAME).replace(/XADON Fan Club/g, `${BOT_NAME} Fan Club`));
        const dare = finalDares[Math.floor(Math.random() * finalDares.length)];

        await sock.sendMessage(m.chat, {
            text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} DARE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *I DARE YOU*
│ ❏ Challenge : ${dare}
│ ❏ Done : React 👍
│ ❏ Skip : React 👎
╰─────────────────────────╯

_*🔥 Complete it or take a dare again*_
_*💡 Use ${prefix}dare for another | ${prefix}truth for a question*_`
        }, { quoted: m });

        await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });
    }
};