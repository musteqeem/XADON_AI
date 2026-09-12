const { getByCategory } = require('../../Plugin/xdnCmd');

module.exports = {
    name: 'smartmenu',
    alias: ['menu2', 'commandmenu'],
    category: 'ANY IDEA',
    desc: 'Generate a compact live menu from the loaded command registry',
    usage: '.smartmenu [category]',
    reactions: { start: '🧭', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const categories = getByCategory();
        const requested = args.join(' ').trim().toLowerCase();
        const names = Object.keys(categories);
        const selected = requested
            ? names.find(name => name.toLowerCase() === requested || name.toLowerCase().includes(requested))
            : null;

        if (requested && !selected) {
            return reply(`❌ Category not found.\n\nAvailable: ${names.join(', ')}`);
        }

        if (selected) {
            const commands = categories[selected].sort((a, b) => a.name.localeCompare(b.name));
            return reply(
                `🧭 *${selected.toUpperCase()}*\n\n` +
                commands.map(command => `• ${prefix}${command.name} — ${command.desc || 'No description'}`).join('\n')
            );
        }

        const total = Object.values(categories).reduce((sum, list) => sum + list.length, 0);
        return reply(
            `🧭 *SMART MENU*\n\n` +
            `Loaded commands: *${total}*\n\n` +
            names.sort().map(name => `• *${name}* — ${categories[name].length} commands`).join('\n') +
            `\n\nUse *${prefix}smartmenu <category>* to open a category.`
        );
    }
};
