module.exports = {
    name: 'version',
    alias: ['runtime', 'engine', 'info'],
    desc: 'Display Node.js/Bun/Deno version info',
    category: 'Info',
    usage: '.version',
    reactions: { start: '📦', success: '✨', error: '❔' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '📦', key: m.key } });

        try {
            const nodeVersion = process.version;
            const platform = process.platform;
            const arch = process.arch;
            const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
            const uptime = Math.floor(process.uptime() / 60);

            await sock.sendMessage(m.chat, {
                headerText: `## ◈ XADON AI Runtime Environment`,
                contentText: '---',
                title: '◈ System Information',
                table: [
                    ['Property', 'Value'],
                    ['Engine', 'Node.js'],
                    ['Version', nodeVersion],
                    ['Platform', platform],
                    ['Architecture', arch],
                    ['Memory', `${memUsed} MB`],
                    ['Uptime', `${uptime} minutes`]
                ],
                footerText: '⚡ Powered by XADON AI V2 ֎'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[VERSION ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • RUNTIME INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SYSTEM*
│ ❏ Runtime : Node.js ${process.version}
│ ❏ Platform : ${process.platform}
╰─────────────────────────╯`
            );
        }
    }
};