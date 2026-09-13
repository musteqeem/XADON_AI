const packageInfo = require('../../../package.json');

module.exports = {
    name: 'v',
    alias: ['version'],
    category: 'Hype-Fun',
    desc: 'Show the bot version and runtime information.',
    usage: '.v',
    reactions: {
        success: '📌'
    },

    execute: async (sock, m, { reply }) => {
        try {
            const node = process.version;
            const uptime = formatUptime(process.uptime());

            return reply(
                `╭─「 XADON AI 」\n` +
                `│ 📦 Version: ${packageInfo.version || 'unknown'}\n` +
                `│ 🟢 Node.js: ${node}\n` +
                `│ ⏱️ Uptime: ${uptime}\n` +
                `╰────────────────\n` +
                `\n✨ PRO command engine online.`
            );
        } catch (error) {
            console.error('[VERSION ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};

function formatUptime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    return [
        days ? `${days}d` : '',
        hours ? `${hours}h` : '',
        minutes ? `${minutes}m` : '',
        `${secs}s`
    ].filter(Boolean).join(' ');
}
