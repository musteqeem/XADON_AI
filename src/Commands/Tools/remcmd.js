module.exports = {
    name: 'remcmd',
    alias: ['delcmd', 'deletecmd'],
    desc: 'Delete a specific command from generated commands',
    category: 'Tools',
    usage: '.remcmd <command name>',
    reactions: { start: '🗑️', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args[0]) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   • DELETE COMMAND •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.remcmd <command name>
│
│ ❏ Deletes a command from Generated folder
╰─────────────────────────╯`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } });

            const commandName = args[0];
            const commandPath = `./src/Commands/Generated/${commandName}.js`;

            const fs = require('fs');

            if (fs.existsSync(commandPath)) {
                fs.unlinkSync(commandPath);
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   • COMMAND DELETED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DETAILS*
│ ❏ Command : ${commandName}
│ ❏ Status : Deleted successfully
╰─────────────────────────╯`
                );
            } else {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(`✘ Command ${commandName} does not exist`);
            }
        } catch (error) {
            console.error('[REMCMD ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply('✘ An error occurred while deleting the command: ' + error.message);
        }
    }
};