const { getVar, setVar } = require('../../Plugin/configManager');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'faketyping',
    alias: ['typing', 'ft'],
    desc: 'Control fake typing behavior',
    category: 'Owner',
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const current = getVar('FAKE_TYPING', 'cmd');

        await sock.sendMessage(jid, { react: { text: '⌨️', key: m.key } });

        if (!args[0]) {
            const status =
                current === 'all'? 'ON - All Messages' :
                current === 'cmd'? 'ON - Commands Only' :
                'OFF';

            const icon =
                current === 'all'? '❏◦' :
                current === 'cmd'? '■⋆' :
                '✘';

            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} FAKE TYPING •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Status : ${icon} ${status}

╭─֎ *HOW TO USE*
│ ❏.faketyping on : All messages
│ ❏.faketyping on cmd : Commands only
│ ❏.faketyping off : Disabled
╰─────────────────────────╯`
            );
        }

        const input = args.join(' ').toLowerCase().trim();

        if (input === 'on') {
            setVar('FAKE_TYPING', 'all');
            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });
            return reply(
                `✓ ֎ Fake Typing Enabled\n❏ Mode : All Messages\n❏ Status : Bot will show typing for everything`
            );
        }

        if (input === 'on cmd') {
            setVar('FAKE_TYPING', 'cmd'); // FIXED: was 'all'
            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });
            return reply(
                `✓ ֎ Fake Typing Enabled\n❏ Mode : Commands Only\n❏ Status : Bot will show typing for commands`
            );
        }

        if (input === 'off') {
            setVar('FAKE_TYPING', false);
            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });
            return reply(
                `✓ ֎ Fake Typing Disabled\n❏ Mode : OFF\n❏ Status : Bot will reply instantly`
            );
        }

        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        return reply(`✘ ֎ Invalid option\n❏ Usage :.faketyping on |.faketyping on cmd |.faketyping off`);
    }
};