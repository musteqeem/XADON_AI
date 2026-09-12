const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env

const WORDS = [
    'listen', 'triangle', 'funeral', 'dormitory', 'the eyes',
    'debit card', 'astronomer', 'the classroom', 'election results',
    'silent', 'integral', 'real fun', 'dirty room', 'they see',
    'bad credit', 'moon starer', 'schoolmaster', 'lies let\'s recount'
];

function shuffleWord(word) {
    const letters = word.replace(/[^a-zA-Z]/g, '').split('');
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join('');
}

module.exports = {
    name: 'anagram',
    alias: ['scramble', 'unscramble', 'wordmix'],
    desc: 'Guess the original word from scrambled letters',
    category: 'Games',
    usage: '.anagram',
    reactions: { start: '🔤', success: '🎭', error: '❌' },

    execute: async (sock, m, { reply, args, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔤', key: m.key } });

        // Initialize storage
        if (!global.anagramAnswers) global.anagramAnswers = {};
        if (!global.anagramTimers) global.anagramTimers = {};

        const sub = args[0]?.toLowerCase();
        const chatId = m.chat;

        //.anagram hint
        if (sub === 'hint') {
            const answer = global.anagramAnswers[chatId];
            if (!answer) return reply('_*❌ No active anagram. Use.anagram to start*_');

            const hint = answer[0].toUpperCase() + '_'.repeat(answer.replace(/[^a-zA-Z]/g, '').length - 1);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ANAGRAM HINT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HINT*
│ ❏ First Letter : ${hint}
╰─────────────────────────╯

_*💡 Guess the word and send it*_`
            );
        }

        //.anagram answer
        if (sub === 'answer') {
            const answer = global.anagramAnswers[chatId];
            if (!answer) return reply('_*❌ No active anagram. Use.anagram to start*_');

            clearTimeout(global.anagramTimers[chatId]);
            delete global.anagramAnswers[chatId];
            delete global.anagramTimers[chatId];

            await sock.sendMessage(chatId, { react: { text: '🎭', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ANAGRAM ANSWER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ANSWER REVEALED*
│ ❏ Word : ${answer.toUpperCase()}
╰─────────────────────────╯

_*💡 Use ${prefix}anagram for another*_`
            );
        }

        // New anagram game
        const index = Math.floor(Math.random() * (WORDS.length / 2)) * 2;
        const answer = WORDS[index];
        const scrambled = shuffleWord(answer);

        // Store answer with 60s timeout
        global.anagramAnswers[chatId] = answer;
        clearTimeout(global.anagramTimers[chatId]);
        global.anagramTimers[chatId] = setTimeout(() => {
            delete global.anagramAnswers[chatId];
            delete global.anagramTimers[chatId];
        }, 60000);

        await sock.sendMessage(m.chat, {
            text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ANAGRAM*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *UNSCRAMBLE THIS*
│ ❏ Scrambled : ${scrambled.toUpperCase()}
│ ❏ Letters : ${scrambled.length} letters
│ ❏ Hint : ${prefix}anagram hint
│ ❏ Answer : ${prefix}anagram answer
╰─────────────────────────╯

_*🧠 Reply with the correct word to win*_
_*⏰ You have 60 seconds*_`
        }, { quoted: m });

        await sock.sendMessage(chatId, { react: { text: '🔖', key: m.key } });
    }
};