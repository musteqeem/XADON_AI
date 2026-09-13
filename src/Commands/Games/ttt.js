const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const games = new Map();

function createBoard() {
    return [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9']
    ];
}

function renderBoard(board) {
    const emojis = { 'X': '❌', 'O': '⭕' };
    return board.map(row => row.map(cell => emojis[cell] || `*${cell}*`).join(' │ ')).join('\n');
}

function checkWinner(board) {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === board[i][1] && board[i][1] === board[i][2] && board[i][0]!== '1') return board[i][0];
    }
    for (let i = 0; i < 3; i++) {
        if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i]!== '1') return board[0][i];
    }
    if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0]!== '1') return board[0][0];
    if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2]!== '1') return board[0][2];
    return null;
}

function isDraw(board) {
    return board.every(row => row.every(cell => cell === 'X' || cell === 'O'));
}

function posToCoords(pos) {
    return { row: Math.floor((pos - 1) / 3), col: (pos - 1) % 3 };
}

// Shared move handler
async function handleMove(sock, m, game, position, reply, prefix, chatId, userId) {
    if (userId!== game.currentPlayer) {
        return reply('_*❌ It\'s not your turn!*_');
    }

    const { row, col } = posToCoords(position);

    if (game.board[row][col] === 'X' || game.board[row][col] === 'O') {
        return reply('_*❌ That spot is already taken!*_');
    }

    const mark = userId === game.playerX? 'X' : 'O';
    game.board[row][col] = mark;
    game.moves++;
    game.currentPlayer = game.currentPlayer === game.playerX? game.playerO : game.playerX;

    const winner = checkWinner(game.board);
    const draw =!winner && isDraw(game.board);

    let status = '';
    if (winner) {
        const winnerJid = winner === 'X'? game.playerX : game.playerO;
        status = `🎉 @${winnerJid.split('@')[0]} WINS!`;
    } else if (draw) {
        status = '🤝 DRAW!';
    } else {
        status = `⏳ ${game.currentPlayer === game.playerX? '❌' : '⭕'}'s turn`;
    }

    await sock.sendMessage(m.chat, { react: { text: winner? '🎉' : draw? '🤝' : '🎭', key: m.key } });

    const sent = await sock.sendMessage(m.chat, {
        text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} TIC-TAC-TOE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GAME BOARD*
│ ❏ Player X : @${game.playerX.split('@')[0]}
│ ❏ Player O : @${game.playerO.split('@')[0]}
│ ❏ Status : ${status}
│ ❏ Moves : ${game.moves}
╰─────────────────────────╯

\`\`\`
${renderBoard(game.board)}
\`\`\`

${winner || draw
   ? `_*💡 Play again: ${prefix}ttt start @user*_`
    : `_*💡 Reply to this message with 1-9 to play*_`}`
    }, {
        quoted: m,
        mentions: [game.playerX, game.playerO]
    });

    if (winner || draw) {
        games.delete(chatId);
    } else {
        game.messageId = sent.key.id;
        games.set(chatId, game);
    }
}

// Pre-command handler for reply-to-play
async function handleGameReply(sock, m) {
    const chatId = m.chat;
    const userId = m.sender;
    const game = games.get(chatId);

    if (!game) return false;
    if (userId!== game.playerX && userId!== game.playerO) return false;

    const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (!quotedId || quotedId!== game.messageId) return false;

    const text = m.text?.trim() || '';
    const pos = parseInt(text);
    if (isNaN(pos) || pos < 1 || pos > 9) return false;

    const mockReply = async (txt) => {
        await sock.sendMessage(chatId, { text: txt }, { quoted: m });
    };

    await handleMove(sock, m, game, pos, mockReply, '.', chatId, userId);
    return true;
}

module.exports = {
    name: 'ttt',
    alias: ['tictactoe', 'xo'],
    desc: 'Play Tic-Tac-Toe with a friend',
    category: 'Games',
    usage: '.ttt start @opponent |.ttt <1-9> |.ttt stop',
    reactions: { start: '🎮', success: '🎭', error: '❌' },

    handleGameReply,

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎮', key: m.key } });

        const sub = args[0]?.toLowerCase();
        const chatId = m.chat;
        const userId = m.sender;

        if (!sub) {
            const game = games.get(chatId);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} TIC-TAC-TOE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GAME MENU*
│ ❏ Status : ${game? 'Game in progress' : 'Ready to play'}
│ ❏ Start : ${prefix}ttt start @user
│ ❏ Play : ${prefix}ttt <1-9>
│ ❏ Stop : ${prefix}ttt stop
╰─────────────────────────╯

_*🎮 Play with a friend and have fun*_`
            );
        }

        if (sub === 'start') {
            let opponent = null;
            if (m.quoted?.sender) opponent = m.quoted.sender;
            if (!opponent && m.mentionedJid?.length) opponent = m.mentionedJid[0];
            if (!opponent) {
                for (const arg of args.slice(1)) {
                    const num = arg.replace(/[^0-9]/g, '');
                    if (num.length >= 7) { opponent = num + '@s.whatsapp.net'; break; }
                }
            }

            if (!opponent) return reply('_*❌ Tag the person you want to play with. Example:.ttt start @user*_');
            if (opponent === userId) return reply('_*❌ You cannot play against yourself!*_');
            if (games.has(chatId)) return reply('_*❌ A game is already in progress! Use.ttt stop first*_');

            const first = Math.random() < 0.5? userId : opponent;

            const game = {
                board: createBoard(),
                playerX: first,
                playerO: first === userId? opponent : userId,
                currentPlayer: first,
                moves: 0
            };

            games.set(chatId, game);

            const sent = await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} TIC-TAC-TOE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GAME STARTED*
│ ❏ Player X : @${first.split('@')[0]}
│ ❏ Player O : @${first === userId? opponent.split('@')[0] : userId.split('@')[0]}
│ ❏ First Turn : ${first === userId? 'You' : 'Opponent'} ❌
╰─────────────────────────╯

\`\`\`
*1* │ *2* │ *3*
*4* │ *5* │ *6*
*7* │ *8* │ *9*
\`\`\`

_*💡 Reply to this message with 1-9 to play*_`
            }, {
                quoted: m,
                mentions: [userId, opponent]
            });

            game.messageId = sent.key.id;
            games.set(chatId, game);
            await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });
            return;
        }

        if (sub === 'stop') {
            if (!games.has(chatId)) return reply('_*❌ No active game!*_');
            games.delete(chatId);
            await sock.sendMessage(m.chat, { react: { text: '🛑', key: m.key } });
            return reply('_*🛑 Game stopped!*_');
        }

        const game = games.get(chatId);
        if (!game) return reply(`_*❌ No active game! Use ${prefix}ttt start @user*_`);

        const position = parseInt(sub);
        if (isNaN(position) || position < 1 || position > 9) {
            return reply('_*❌ Choose a position from 1-9*_');
        }

        return await handleMove(sock, m, game, position, reply, prefix, chatId, userId);
    }
};