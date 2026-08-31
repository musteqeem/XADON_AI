const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

module.exports = {
    name: 'hint',
    alias: ['answer', 'reveal'],
    desc: 'Reveal answer for games - trivia, riddle, anagram',
    category: 'Games',
    usage: '.hint',
    reactions: { start: '💡', success: '🎭', error: '❌' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '💡', key: m.key } });

        let answer = null;
        let game = '';

        if (global.triviaAnswers?.[m.chat]) {
            answer = global.triviaAnswers[m.chat];
            game = 'Trivia';
            delete global.triviaAnswers[m.chat];
            clearTimeout(global.triviaTimers?.[m.chat]);
        } else if (global.riddleAnswers?.[m.chat]) {
            answer = global.riddleAnswers[m.chat];
            game = 'Riddle';
            delete global.riddleAnswers[m.chat];
            clearTimeout(global.riddleTimers?.[m.chat]);
        } else if (global.anagramAnswers?.[m.chat]) {
            answer = global.anagramAnswers[m.chat];
            game = 'Anagram';
            delete global.anagramAnswers[m.chat];
            clearTimeout(global.anagramTimers?.[m.chat]);
        }

        if (!answer) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} GAME HINT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NO ACTIVE GAME*
│ ❏ Status : No game running in this chat
╰─────────────────────────╯

_*💡 Start with ${prefix}trivia | ${prefix}riddle | ${prefix}anagram*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });

        await sock.sendMessage(m.chat, {
            text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ${game.toUpperCase()} ANSWER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ANSWER REVEALED*
│ ❏ Game : ${game}
│ ❏ Answer : ${answer}
╰─────────────────────────╯

_*💡 Play again: ${prefix}trivia | ${prefix}riddle | ${prefix}anagram*_`
        }, { quoted: m });
    }
};