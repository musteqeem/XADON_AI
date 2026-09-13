const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const STICKER_CMD_FILE = path.join(__dirname, '../../../database/sticker_cmds.json');

let stickerCmds = {};

const loadStickerCmds = () => {
    try {
        if (fs.existsSync(STICKER_CMD_FILE)) {
            stickerCmds = JSON.parse(fs.readFileSync(STICKER_CMD_FILE, 'utf8'));
        }
    } catch (e) {
        console.error(`[${BOT_NAME} STICKER CMD LOAD ERROR]`, e.message);
        stickerCmds = {};
    }
};

const saveStickerCmds = () => {
    try {
        fs.mkdirSync(path.dirname(STICKER_CMD_FILE), { recursive: true });
        fs.writeFileSync(STICKER_CMD_FILE, JSON.stringify(stickerCmds, null, 2));
    } catch (e) {
        console.error(`[${BOT_NAME} STICKER CMD SAVE ERROR]`, e.message);
    }
};

loadStickerCmds();

module.exports = {
    name: 'setcmd',
    alias: ['bindcmd', 'stickercmd'],
    desc: 'Bind a command to a sticker',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setcmd <command> (reply to sticker)',

    execute: async (sock, m, { args, reply, prefix }) => {
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const stickerData = quotedMsg?.stickerMessage;

        if (!stickerData) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} STICKER CMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to a sticker with ${prefix}setcmd <command>
│
╭─֎ *EXAMPLE*
│ ❏ ${prefix}setcmd ping
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        if (!args[0]) {
            return reply(`✘ Provide a command\n֎ Example: ${prefix}setcmd ping`);
        }

        const fileSha256 = stickerData.fileSha256;

        if (!fileSha256) {
            return reply(`✘ Could not get sticker hash`);
        }

        const hash = Buffer.isBuffer(fileSha256)
           ? fileSha256.toString('hex')
            : String(fileSha256);

        const command = args.join(' ');
        const cmdName = command.split(/\s+/)[0];

        stickerCmds[hash] = command;
        saveStickerCmds();

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} STICKER CMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : Bound to command
│ ❏ Command : ${cmdName}
│ ❏ Full : ${command}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};

module.exports.stickerCmds = stickerCmds;
module.exports.loadStickerCmds = loadStickerCmds;
module.exports.handleStickerCommand = async (sock, m) => {
    if (m?.mtype !== 'stickerMessage') return false;

    const data = m.message?.stickerMessage;
    const rawHash = data?.fileSha256;
    if (!rawHash) return false;

    const hash = Buffer.isBuffer(rawHash) ? rawHash.toString('hex') : String(rawHash);
    const command = stickerCmds[hash];
    if (!command) return false;

    const prefix = require('../../Plugin/configManager').getVar('PREFIX', '.');
    m.body = `${prefix}${command}`;
    m.text = m.body;
    return false;
};
