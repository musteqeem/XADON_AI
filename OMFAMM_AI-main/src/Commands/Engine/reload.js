const path = require('path');
const { loadCommands } = require('../../Plugin/xdnLoadCmd');

module.exports = {
    name: 'reload',
    alias: ['rl', 'refresh'],
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '⌘', success: '✨', error: '❔' },

    execute: async (sock, m) => {
        const progressMsg = await sock.sendMessage(m.chat, {
            text: '⌘ *Reloading Commands...*\n\n▱▱▱▱▱▱▱▱▱▱ 0%'
        });

        const updateProgress = async (text) => {
            await sock.sendMessage(m.chat, { text, edit: progressMsg.key });
        };

        try {
            const commandsPath = path.join(__dirname, '../../Commands');

            await updateProgress('⌘ *Reloading Commands...*\n\n▰▱▱ 10%\n\n🧹 Clearing cache...');

            // Clear require cache for commands
            Object.keys(require.cache).forEach(file => {
                if (file.startsWith(commandsPath)) {
                    delete require.cache[file];
                }
            });

            await updateProgress('⌘ *Reloading Commands...*\n\n▰▰▰▱ 60%\n\n📂 Loading new commands...');

            const count = loadCommands();

            await updateProgress('⌘ *Reloading Commands...*\n\n▰▰▰▰▰▰▰▰▰▰ 100%\n\n✅ Done!');

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

            await sock.sendMessage(m.chat, {
                headerText: `## ◈ AI Command Reload`,
                contentText: '---',
                title: '◈ Reload Complete',
                table: [
                    ['Metric', 'Value'],
                    ['Status', '✅ Success'],
                    ['Commands Loaded', count],
                    ['Cache', 'Cleared']
                ],
                footerText: '💡 All commands have been refreshed'
            }, { quoted: m });

        } catch (error) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            await sock.sendMessage(m.chat, {
                text: `⌘ *Reloading Commands...*\n\n▰▰▰▰▰▰ 100%\n\n❌ Failed to reload`,
                edit: progressMsg.key
            });
            console.error('[RELOAD ERROR]', error);
        }
    }
};