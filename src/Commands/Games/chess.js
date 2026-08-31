const { createCanvas, loadImage } = require('canvas');
const { Chess } = require('chess.js');
const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const DB_DIR = path.join(__dirname, '../../../database');
const CHESS_PATH = path.join(DB_DIR, 'chess.json');

// Unicode pieces for fallback
const UNICODE = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

// Wikipedia SVGs - work on 99% of VPS/Pterodactyl
const PIECE_IMAGES = {
    'wK': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    'wQ': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'wR': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'wB': 'https://upload.wikimedia.org/wikipedia/commons/b1/Chess_blt45.svg',
    'wN': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'wP': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'bK': 'https://upload.wikimedia.org/wikipedia/commons/f0/Chess_kdt45.svg',
    'bQ': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'bR': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'bB': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'bN': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'bP': 'https://upload.wikimedia.org/wikipedia/commons/c7/Chess_pdt45.svg',
};

const LIGHT = '#F0D9B5';
const DARK = '#B58863';

// Load games from file - with auto create folder
const loadGames = () => {
    if(!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if(!fs.existsSync(CHESS_PATH)) fs.writeFileSync(CHESS_PATH, '{}');
    try {
        return new Map(Object.entries(JSON.parse(fs.readFileSync(CHESS_PATH, 'utf8'))));
    } catch {
        fs.writeFileSync(CHESS_PATH, '{}');
        return new Map();
    }
}

// Save games to file
const saveGames = (games) => {
    const obj = Object.fromEntries(games);
    fs.writeFileSync(CHESS_PATH, JSON.stringify(obj, null, 2));
}

let games = loadGames(); // Load on start

async function drawBoard(chess) {
    const SIZE = 640;
    const SQUARE = SIZE / 8;
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    // 1. Draw board
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            ctx.fillStyle = (row + col) % 2 === 0? LIGHT : DARK;
            ctx.fillRect(col * SQUARE, row * SQUARE, SQUARE, SQUARE);
        }
    }

    // 2. Draw pieces - Image first, Unicode fallback
    const board = chess.board();
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const key = `${piece.color}${piece.type.toUpperCase()}`;
                const url = PIECE_IMAGES[key];
                try {
                    const img = await loadImage(url);
                    ctx.drawImage(img, col * SQUARE + 4, row * SQUARE + 4, SQUARE - 8, SQUARE - 8);
                } catch {
                    // FALLBACK: Draw Unicode piece
                    ctx.font = `${SQUARE * 0.65}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = piece.color === 'w'? '#FFFFFF' : '#000';
                    ctx.strokeStyle = piece.color === 'w'? '#000' : '#FFFFFF';
                    ctx.lineWidth = 2;
                    const unicode = UNICODE[key];
                    ctx.strokeText(unicode, col * SQUARE + SQUARE/2, row * SQUARE + SQUARE/2 + 2);
                    ctx.fillText(unicode, col * SQUARE + SQUARE/2, row * SQUARE + SQUARE/2 + 2);
                }
            }
        }
    }

    // 3. Labels a-h 1-8
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    for (let i = 0; i < 8; i++) {
        ctx.fillText(8 - i, 10, (i + 1) * SQUARE - 8);
        ctx.fillText(String.fromCharCode(97 + i), (i + 1) * SQUARE - 12, SIZE - 8);
    }

    return canvas.toBuffer('image/png');
}

function getGameStatus(chess) {
    if (chess.isCheckmate()) return `Checkmate! ${chess.turn() === 'w'? 'Black' : 'White'} wins 👑`;
    if (chess.isDraw()) return 'Draw! 🤝';
    if (chess.isCheck()) return `${chess.turn() === 'w'? 'White' : 'Black'} is in Check! ⚠️`;
    return `${chess.turn() === 'w'? 'White' : 'Black'} to move`;
}

module.exports = {
    name: 'chess',
    alias: ['c', 'chessgame'],
    category: 'Games',
    desc: 'Play chess. Create, move, resign',
    usage: '.chess new |.chess move e2e4 |.chess board |.chess resign',

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase();
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        if (!sub || sub === 'help') {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CHESS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}chess new @tag : start new game
│ ❏ ${prefix}chess move e2e4 : make move
│ ❏ ${prefix}chess board : show board
│ ❏ ${prefix}chess fen : show FEN
│ ❏ ${prefix}chess resign : resign game
╰─────────────────────────╯
❏ Notation: e2e4, g7g8q for promotion`;
            return reply(help);
        }

        games = loadGames(); // Reload every command

        // NEW GAME
        if (sub === 'new') {
            const opponent = m.mentionedJid?.[0] || sender;
            const chess = new Chess();
            games.set(chatId, {
                chess: chess.fen(),
                players: { w: sender, b: opponent },
                turn: 'w'
            });
            saveGames(games);

            const boardImg = await drawBoard(chess);
            await sock.sendMessage(chatId, {
                image: boardImg,
                caption: `✦ New Game Started!\n❏ White: @${sender.split('@')[0]}\n❏ Black: @${opponent.split('@')[0]}\n❏ ${getGameStatus(chess)}`,
                mentions: [sender, opponent]
            });
            return;
        }

        const gameData = games.get(chatId);
        if (!gameData) return reply(`✘ ֎ No active game. Use ${prefix}chess new @friend`);

        const chess = new Chess(gameData.chess);
        const { players } = gameData;

        // JOIN AS BLACK
        if (sub === 'join' &&!players.b) {
            players.b = sender;
            gameData.players = players;
            games.set(chatId, gameData);
            saveGames(games);
            const boardImg = await drawBoard(chess);
            return sock.sendMessage(chatId, {
                image: boardImg,
                caption: `֎ Black joined!\n❏ White: @${players.w.split('@')[0]}\n❏ Black: @${sender.split('@')[0]}\n❏ ${getGameStatus(chess)}`,
                mentions: [players.w, sender]
            });
        }

        // SHOW BOARD
        if (sub === 'board') {
            const boardImg = await drawBoard(chess);
            return sock.sendMessage(chatId, {
                image: boardImg,
                caption: `❏ ${getGameStatus(chess)}\n❏ FEN: ${chess.fen()}`
            });
        }

        // SHOW FEN
        if (sub === 'fen') {
            return reply(`❏ FEN: ${chess.fen()}\n❏ PGN:\n${chess.pgn()}`);
        }

        // RESIGN
        if (sub === 'resign') {
            games.delete(chatId);
            saveGames(games);
            return reply(`✘ ֎ Game resigned`);
        }

        // MAKE MOVE
        if (sub === 'move') {
            const moveStr = args[1];
            if (!moveStr) return reply(`✘ ֎ Usage: ${prefix}chess move e2e4`);

            const turn = chess.turn();
            const playerColor = players.w === sender? 'w' : players.b === sender? 'b' : null;
            if (playerColor!== turn) return reply(`✘ ֎ Not your turn`);

            try {
                const from = moveStr.slice(0, 2);
                const to = moveStr.slice(2, 4);
                const promotion = moveStr[4] || 'q';

                const move = chess.move({ from, to, promotion });
                if (!move) return reply(`✘ ֎ Illegal move`);

                gameData.chess = chess.fen();
                gameData.turn = chess.turn();
                games.set(chatId, gameData);
                saveGames(games);

                const boardImg = await drawBoard(chess);
                const status = getGameStatus(chess);

                await sock.sendMessage(chatId, {
                    image: boardImg,
                    caption: `֎ ${move.san}\n❏ ${status}`,
                    mentions: [gameData.turn === 'w'? players.w : players.b]
                });

                if (chess.isGameOver()) {
                    games.delete(chatId);
                    saveGames(games);
                }

            } catch (e) {
                reply(`✘ ֎ Invalid move format. Use e2e4`);
            }
            return;
        }

        reply(`✘ ֎ Unknown subcommand`);
    }
};