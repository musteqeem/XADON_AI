const fs = require('fs');
const path = require('path');

const STICKER_CMD_FILE = path.join(__dirname, '../database/sticker_cmds.json');

let stickerCmds = {};

const loadStickerCmds = () => {
    try {
        if (fs.existsSync(STICKER_CMD_FILE)) {
            stickerCmds = JSON.parse(fs.readFileSync(STICKER_CMD_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[XDN STICKER LOAD ERROR]', err.message);
        stickerCmds = {};
    }
};

const saveStickerCmds = () => {
    try {
        const dir = path.dirname(STICKER_CMD_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STICKER_CMD_FILE, JSON.stringify(stickerCmds, null, 2));
    } catch (err) {
        console.error('[XDN STICKER SAVE ERROR]', err.message);
    }
};

loadStickerCmds();

module.exports = {
    name: 'setcmd',
    alias: ['bindcmd', 'stickercmd'],
    description: 'Bind a command to a sticker with XDN defense core',
    category: 'owner',
    owner: true,
    usage: '.setcmd <command> (reply to sticker)',
    reactions: { start: '⚙️', success: '֎', failure: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        try {
            await sock.sendMessage(m.chat, {
                react: { text: '⚙️', key: m.key }
            });

            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const stickerData = quotedMsg?.stickerMessage;

            // No sticker
            if (!stickerData) {
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SETCMD ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Reason : No sticker replied
╰─────────────────────────╯

💡 Usage:
${prefix}setcmd ping (reply to sticker)

> ֎`
                );
            }

            // No command
            if (!args[0]) {
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SETCMD ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Reason : No command provided
╰─────────────────────────╯

💡 Example:
${prefix}setcmd ping

> ֎`
                );
            }

            const fileSha256 = stickerData.fileSha256;
            if (!fileSha256) {
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SETCMD ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Reason : Could not read sticker hash
╰─────────────────────────╯

> ֎`
                );
            }

            const hash = Buffer.isBuffer(fileSha256)
               ? fileSha256.toString('hex')
                : String(fileSha256);

            const command = args.join(' ').trim();
            const cmdName = command.split(/\s+/)[0];
            const oldCmd = stickerCmds[hash];

            // Bind command
            stickerCmds[hash] = command;
            saveStickerCmds();

            await sock.sendMessage(m.chat, {
                react: { text: '֎', key: m.key }
            });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • STICKER BIND SUCCESS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Command : ${cmdName}
│ ❏ Status : BOUND
${oldCmd? `│ ❏ Old : ${oldCmd}` : ''}
│ ❏ Hash : ${hash.slice(0, 12)}...
╰─────────────────────────╯

💡 Sending this sticker triggers:
\`${prefix}${cmdName}\`

> ֎`
            );

        } catch (err) {
            console.error('[XDN SETCMD ERROR]', err);

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

module.exports.stickerCmds = stickerCmds;
module.exports.loadStickerCmds = loadStickerCmds;
module.exports.saveStickerCmds = saveStickerCmds;