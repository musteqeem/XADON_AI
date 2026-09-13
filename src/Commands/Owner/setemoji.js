const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const EMOJI_CMD_FILE = path.join(__dirname, '../../../database/emoji_cmds.json');

let emojiCmds = {};

const loadEmojiCmds = () => {
    try {
        if (fs.existsSync(EMOJI_CMD_FILE)) {
            emojiCmds = JSON.parse(fs.readFileSync(EMOJI_CMD_FILE, 'utf8'));
        }
    } catch (e) {
        console.error(`[${BOT_NAME} EMOJI CMD LOAD ERROR]`, e.message);
        emojiCmds = {};
    }
};

const saveEmojiCmds = () => {
    try {
        const dir = path.dirname(EMOJI_CMD_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(EMOJI_CMD_FILE, JSON.stringify(emojiCmds, null, 2));
    } catch (e) {
        console.error(`[${BOT_NAME} EMOJI CMD SAVE ERROR]`, e.message);
    }
};

loadEmojiCmds();

module.exports = {
    name: 'setemoji',
    alias: ['bindemoji', 'emojicmd', 'emoji2cmd', 'addemoji'],
    desc: 'Bind a command to an emoji — sending just that emoji triggers the command',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setemoji <command> (reply to emoji)\n.setemoji <emoji> <command>',

    execute: async (sock, m, { args, reply, prefix }) => {
        // ── MODE 1: Reply to an emoji ──────────────────────────
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';

        if (quotedText && args[0] &&!args[1]) {
            const emoji = quotedText.trim();
            const command = args[0];

            if (emojiCmds[emoji]) {
                const oldCmd = emojiCmds[emoji];
                emojiCmds[emoji] = command;
                saveEmojiCmds();
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} EMOJI CMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *UPDATED*
│ ❏ Emoji : ${emoji}
│ ❏ Old : ${oldCmd}
│ ❏ New : ${command}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
                );
            }

            emojiCmds[emoji] = command;
            saveEmojiCmds();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} EMOJI CMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *BOUND*
│ ❏ Emoji : ${emoji}
│ ❏ Command : ${command}
│ ❏ Trigger : ${emoji} → ${prefix}${command}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // ── MODE 2: Direct.setemoji <emoji> <command> ──────────
        if (args[0] && args[1]) {
            const emoji = args[0];
            const command = args.slice(1).join(' ');

            if (emojiCmds[emoji]) {
                const oldCmd = emojiCmds[emoji];
                emojiCmds[emoji] = command;
                saveEmojiCmds();
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} EMOJI CMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *UPDATED*
│ ❏ Emoji : ${emoji}
│ ❏ Old : ${oldCmd}
│ ❏ New : ${command}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
                );
            }

            emojiCmds[emoji] = command;
            saveEmojiCmds();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} EMOJI CMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *BOUND*
│ ❏ Emoji : ${emoji}
│ ❏ Command : ${command}
│ ❏ Trigger : ${emoji} → ${prefix}${command}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // ── ERROR: Invalid usage ────────────────────────────────
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} EMOJI CMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}setemoji <command> (reply to emoji)
│ ❏ ${prefix}setemoji <emoji> <command>
│
╭─֎ *EXAMPLES*
│ ❏ ${prefix}setemoji ping (reply to 😂)
│ ❏ ${prefix}setemoji 😂 ping
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};

module.exports.emojiCmds = emojiCmds;
module.exports.loadEmojiCmds = loadEmojiCmds;
module.exports.saveEmojiCmds = saveEmojiCmds;
module.exports.handleEmojiCommand = async (sock, m) => {
    const rawText = String(
        m?.message?.conversation ||
        m?.message?.extendedTextMessage?.text ||
        m?.body ||
        m?.text ||
        ''
    ).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    const command = emojiCmds[rawText];
    if (!command) return false;

    const prefix = require('../../Plugin/configManager').getVar('PREFIX', '.');
    m.body = `${prefix}${command}`;
    m.text = m.body;
    return false;
};
