const os = require('os');
const { getAll } = require('../../Plugin/xdnCmd');

module.exports = {
    name: 'bothealth',
    alias: ['health', 'healthcheck'],
    category: 'ANY IDEA',
    desc: 'Show bot runtime health, memory and command statistics',
    usage: '.bothealth',
    reactions: { start: '🩺', success: '💚', error: '❌' },

    execute: async (sock, m, { reply }) => {
        const memory = process.memoryUsage();
        const commands = new Set();

        for (const command of getAll().values()) {
            if (command && typeof command === 'object') commands.add(command);
        }

        const uptime = formatDuration(process.uptime() * 1000);
        const heap = `${(memory.heapUsed / 1024 / 1024).toFixed(1)} MB / ${(memory.heapTotal / 1024 / 1024).toFixed(1)} MB`;
        const rss = `${(memory.rss / 1024 / 1024).toFixed(1)} MB`;
        const load = os.loadavg().map(value => value.toFixed(2)).join(' / ');

        return reply(
            `╭─ 🩺 *BOT HEALTH*\n` +
            `│ Status     : *ONLINE*\n` +
            `│ Uptime     : ${uptime}\n` +
            `│ Commands   : ${commands.size}\n` +
            `│ Heap       : ${heap}\n` +
            `│ RAM (RSS)  : ${rss}\n` +
            `│ Load       : ${load}\n` +
            `│ Node       : ${process.version}\n` +
            `╰────────────────────`
        );
    }
};

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        days ? `${days}d` : '',
        hours ? `${hours}h` : '',
        minutes ? `${minutes}m` : '',
        `${secs}s`
    ].filter(Boolean).join(' ');
}
