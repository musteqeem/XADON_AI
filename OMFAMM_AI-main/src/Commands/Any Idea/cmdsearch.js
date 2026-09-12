const { getAll } = require('../../Plugin/xdnCmd');

module.exports = {
    name: 'cmdsearch',
    alias: ['findcmd', 'searchcmd'],
    category: 'ANY IDEA',
    desc: 'Find commands by name, alias or description',
    usage: '.cmdsearch <keyword>',
    reactions: { start: '🔎', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const query = args.join(' ').trim().toLowerCase();
        if (!query) return reply(`Usage: ${prefix}cmdsearch <keyword>`);

        const unique = new Set();
        const results = [];

        for (const command of getAll().values()) {
            if (!command || unique.has(command)) continue;
            unique.add(command);

            const haystack = [
                command.name,
                ...(command.alias || []),
                command.desc,
                command.category
            ].join(' ').toLowerCase();

            const score = scoreMatch(query, haystack, command);
            if (score > 0) results.push({ command, score });
        }

        results.sort((a, b) => b.score - a.score || a.command.name.localeCompare(b.command.name));
        const top = results.slice(0, 12);

        if (!top.length) return reply(`❌ No command matched *${query}*.`);

        const lines = top.map(({ command }) => {
            const aliases = command.alias?.length ? ` (${command.alias.slice(0, 3).join(', ')})` : '';
            return `• *${prefix}${command.name}*${aliases}\n  ${command.desc || 'No description'}`;
        });

        return reply(`🔎 *COMMAND SEARCH*\n\n${lines.join('\n\n')}\n\nShowing ${top.length} result(s).`);
    }
};

function scoreMatch(query, haystack, command) {
    if (command.name?.toLowerCase() === query) return 100;
    if (command.alias?.some(alias => alias.toLowerCase() === query)) return 95;
    if (command.name?.toLowerCase().startsWith(query)) return 80;
    if (haystack.includes(query)) return 50;

    const words = query.split(/\s+/).filter(Boolean);
    const hits = words.filter(word => haystack.includes(word)).length;
    return hits ? 10 + hits * 5 : 0;
}
