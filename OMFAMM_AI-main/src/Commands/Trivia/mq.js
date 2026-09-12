const quizzes = new Map();
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

function generateQuestion() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;

    switch (op) {
        case '+':
            a = Math.floor(Math.random() * 100);
            b = Math.floor(Math.random() * 100);
            answer = a + b;
            break;
        case '-':
            a = Math.floor(Math.random() * 100);
            b = Math.floor(Math.random() * a);
            answer = a - b;
            break;
        case '×':
            a = Math.floor(Math.random() * 12) + 1;
            b = Math.floor(Math.random() * 12) + 1;
            answer = a * b;
            break;
    }

    return { question: `${a} ${op} ${b} = ?`, answer };
}

module.exports = {
    name: 'mathquiz',
    alias: ['math', 'maths', 'calculate'],
    desc: 'Test your math skills',
    category: 'Quiz',
    usage: '.mathquiz | .math <answer>',
    reactions: { start: '🔢', success: '🔖', error: '🏗️' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0];

        // Start new quiz
        if (!sub) {
            const q = generateQuestion();
            quizzes.set(m.chat, { answer: q.answer, time: Date.now() });

            await sock.sendMessage(m.chat, { react: { text: '🔢', key: m.key } });

            await sock.sendMessage(m.chat, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ *${BOT_NAME} MATH QUIZ*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *QUESTION*
│ ❏ Problem : ${q.question}
│ ❏ Reply : ${prefix}mathquiz <your answer>
│ ❏ Category : Math
╰─────────────────────────╯
💡 Answer quickly for bonus points!
_Powered by ${BOT_NAME}_`
            }, { quoted: m });

            return;
        }

        // Check answer
        const quiz = quizzes.get(m.chat);
        if (!quiz) return reply(`✘ No active quiz! Use *${prefix}mathquiz* to start.\n*Support:* <bot owner number>`);

        const answer = parseInt(sub);
        if (isNaN(answer)) return reply(`✘ *That's not a number!*`);

        const correct = answer === quiz.answer;
        const time = ((Date.now() - quiz.time) / 1000).toFixed(1);

        if (correct) {
            quizzes.delete(m.chat);
            await sock.sendMessage(m.chat, { react: { text: '🎉', key: m.key } });

            await sock.sendMessage(m.chat, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ *${BOT_NAME} MATH QUIZ*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RESULT*
│ ❏ Status : CORRECT 🎉
│ ❏ Answer : ${quiz.answer}
│ ❏ Time : ${time} seconds
│ ❏ Next : ${prefix}mathquiz
╰─────────────────────────╯
✅ Well Done!
_Powered by ${BOT_NAME}_`
            }, { quoted: m });
        } else {
            await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            await reply(`✘ *Wrong! Try again!*\n_Hint: ${prefix}mathquiz_`);
        }
    }
};