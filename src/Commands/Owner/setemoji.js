const fs = require('fs');
const path = require('path');

const EMOJI_CMD_FILE = path.join(__dirname, '../database/emoji_cmds.json');

let emojiCmds = {};

const loadEmojiCmds = () => {
    try {
        if (fs.existsSync(EMOJI_CMD_FILE)) {
            emojiCmds = JSON.parse(fs.readFileSync(EMOJI_CMD_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[XDN EMOJI LOAD ERROR]', err.message);
        emojiCmds = {};
    }
};

const saveEmojiCmds = () => {
    try {
        const dir = path.dirname(EMOJI_CMD_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(EMOJI_CMD_FILE, JSON.stringify(emojiCmds, null, 2));
    } catch (err) {
        console.error('[XDN EMOJI SAVE ERROR]', err.message);
    }
};

loadEmojiCmds();

module.exports = {
    name: 'setemoji',
    alias: ['bindemoji', 'emojicmd', 'emoji2cmd', 'addemoji'],
    description: 'Bind a command to an emoji trigger with XDN defense core',
    category: 'owner',
    owner: true,
    usage: '.setemoji <emoji> <command> OR reply emoji →.setemoji <command>',
    reactions: { start: '⚙️', success: '֎', failure: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {

        try {
            await sock.sendMessage(m.chat, {
                react: { text: '⚙️', key: m.key }
            });

            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText =
                quotedMsg?.conversation ||
                quotedMsg?.extendedTextMessage?.text ||
                '';

            // MODE 1: reply to emoji
            if (quotedText && args[0] &&!args[1]) {
                const emoji = quotedText.trim();
                const command = args[0].trim();
                const oldCmd = emojiCmds[emoji];

                emojiCmds[emoji] = command;
                saveEmojiCmds();

                await sock.sendMessage(m.chat, {
                    react: { text: '֎', key: m.key }
                });

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • EMOJI BIND SUCCESS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Emoji : ${emoji}
│ ❏ Command : ${prefix}${command}
│ ❏ Status : BOUND
${oldCmd? `│ ❏ Old : ${prefix}${oldCmd}` : ''}
╰─────────────────────────╯

> ֎`
                );
            }

            // MODE 2: direct usage
            if (args[0] && args[1]) {
                const emoji = args[0].trim();
                const command = args.slice(1).join(' ').trim();
                const oldCmd = emojiCmds[emoji];

                emojiCmds[emoji] = command;
                saveEmojiCmds();

                await sock.sendMessage(m.chat, {
                    react: { text: '֎', key: m.key }
                });

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • EMOJI BIND SUCCESS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Emoji : ${emoji}
│ ❏ Command : ${prefix}${command}
│ ❏ Status : BOUND
${oldCmd? `│ ❏ Old : ${prefix}${oldCmd}` : ''}
╰─────────────────────────╯

💡 Now sending ${emoji} triggers:
\`${prefix}${command}\`

> ֎`
                );
            }

            // Invalid usage
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SETEMOJI USAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *METHODS*
│ ❏ Reply method:
│ Reply emoji → ${prefix}setemoji ping
│ ❏ Direct method:
│ ${prefix}setemoji 😂 ping
╰─────────────────────────╯

💡 Example:
${prefix}setemoji 😂 menu

> ֎`
            );

        } catch (err) {
            console.error('[XDN SETEMOJI ERROR]', err);

            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SYSTEM ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Error : ${err.message || 'Unknown error'}
╰─────────────────────────╯

> ֎`
            );
        }
    }
};

// exports for compatibility
module.exports.emojiCmds = emojiCmds;
module.exports.loadEmojiCmds = loadEmojiCmds;
module.exports.saveEmojiCmds = saveEmojiCmds;