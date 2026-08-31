const os = require('os');

module.exports = {
    name: 'bot',
    alias: ['health', 'crysStats'],
    desc: 'Display bot health and statistics',
    category: 'Info',
    usage: '.botstatus',
    reactions: { start: '📊', success: '✨', error: '❔' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '📊', key: m.key } });

        try {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime % 86400 / 3600);
            const minutes = Math.floor(uptime % 3600 / 60);
            const seconds = Math.floor(uptime % 60);

            const totalMemGB = os.totalmem() / 1024 / 1024 / 1024;
            const freeMemGB = os.freem() / 1024 / 1024 / 1024;
            const usedMemGB = totalMemGB - freeMemGB;

            const ping = Date.now() - m.messageTimestamp * 1000;
            const cmds = global.bot?.commands || 'N/A';
            const msgs = global.bot?.messages || 'N/A';

            await sock.sendMessage(m.chat, {
                headerText: `## ◈ XADON AI Status ⓘ`,
                contentText: '---',
                title: '◈ Bot Health Dashboard ⎔',
                table: [
                    ['Metric', 'Value'],
                    ['Status', '🟢 Online'],
                    ['Ping', `${ping}ms`],
                    ['Uptime', `${days}d ${hours}h ${minutes}m ${seconds}s`],
                    ['Memory', `${usedMemGB.toFixed(2)} GB ֎ ${totalMemGB.toFixed(2)} GB`],
                    ['CPU Cores', os.cpus().length],
                    ['Platform', os.platform() + ' + os.arch()],
                    ['Commands', cmds],
                    ['Messages', msgs]
                ],
                footerText: '_*( ͡❛ ₃ ͡❛) XADON AI V2 ֎ Always Online*_'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[STATUS ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • YOUR BOT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Status : 🟢 Online
│ ❏ Uptime : ${Math.floor(process.uptime() / 60)} minutes
╰─────────────────────────╯`
            );
        }
    }
};