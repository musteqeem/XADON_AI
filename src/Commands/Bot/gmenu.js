/**
 * 🧙 XADON AI MENU SYSTEM
 * Clean + Fully Editable Version
 */

const os = require('os');

module.exports = {
    name: 'gmenu',
    alias: ['help', 'commands', 'list'],
    desc: 'Show all bot commands',
    category: 'general',

    execute: async (sock, m, { prefix, config, reply }) => {

        const user = m.pushName || "User";
        const number = m.sender?.split('@')[0] || "Unknown";

        // ⏱️ Uptime
        const uptime = Math.floor((Date.now() - global.startTime) / 60000);

        // 💾 RAM Usage
        const total = os.totalmem();
        const free = os.freemem();
        const used = ((total - free) / 1024 / 1024 / 1024).toFixed(1);
        const totalGB = (total / 1024 / 1024 / 1024).toFixed(1);

        // 🕒 Time
        const time = new Date().toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // 📦 Commands (example structure)
        const commands = global.commands || [];

        let menu = `
╔══════════════════════╗
║    🧙 XADON AI MENU   ║
╚══════════════════════╝

👤 User   : ${user}
📞 Number : ${number}
⚡ Prefix : ${prefix}
🧠 Mode   : ${config.public ? "PUBLIC" : "PRIVATE"}

⏱️ Uptime : ${uptime} mins
💾 RAM    : ${used}GB / ${totalGB}GB
🕒 Time   : ${time}

╭──────── Commands ────────╮
`;

        // Group commands by category
        const categories = {};

        for (let cmd of commands) {
            if (!cmd.name) continue;

            const cat = cmd.category || "misc";

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.name);
        }

        // Render commands
        for (let cat in categories) {
            menu += `\n📦 ${cat.toUpperCase()}\n`;
            categories[cat].forEach(cmd => {
                menu += `➤ ${prefix}${cmd}\n`;
            });
        }

        menu += `
╰────────────────────────╯

✨ Use ${prefix}help <command> for details
🧙 Powered by XADON AI
`;

        await sock.sendMessage(m.chat, {
            text: menu
        }, { quoted: m });
    }
};