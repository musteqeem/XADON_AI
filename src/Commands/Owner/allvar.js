const { allVars, VARS, setVar, delVar, resetVar, loadConfig } = require('../../Plugin/configManager');

module.exports = {
    name: 'allvar',
    alias: ['listvars', 'vars', 'av'],
    desc: 'Manage runtime variables with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '❇', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();
        const runtime = allVars();

        if (!sub || sub === 'list') {
            if (!Object.keys(runtime).length) {
                const list = Object.keys(VARS).map(v => `❏ ${v}`).join('\n');
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • VARIABLE SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Runtime Vars : 0
│ ❏ State : EMPTY
╰─────────────────────────╯

Available Variables:
${list}

Usage:
֎.setvar VARIABLE=VALUE
֎.allvar list → Show vars
֎.allvar help → Show commands`
                );
            }

            const entries = Object.entries(runtime).map(([k, v]) => {
                const varName = Object.entries(VARS).find(([, key]) => key === k)?.[0] || k;
                const displayVal = String(v).length > 50? String(v).slice(0, 50) + '...' : String(v);
                return `❏ ${varName} = ${displayVal}`;
            }).join('\n');

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • RUNTIME VARIABLES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Total Vars : ${Object.keys(runtime).length}
│ ❏ Status : ACTIVE
╰─────────────────────────╯
${entries}

Use.delvar VARIABLE to reset to default`
            );
        }

        if (sub === 'set') {
            const input = args.slice(1).join(' ');
            if (!input.includes('=')) return reply('֎ Usage:.allvar set VARIABLE=VALUE');

            const [key,...valArr] = input.split('=');
            const val = valArr.join('=').trim();

            if (!key ||!val) return reply('֎ Key and value cannot be empty.');

            const result = setVar(key.toUpperCase(), val);
            if (result) {
                return reply(`֎ Set ${key.toUpperCase()} = ${val}`);
            }
            return reply('֎ Invalid variable name.');
        }

        if (sub === 'get') {
            const key = args[1]?.toUpperCase();
            if (!key) return reply('֎ Usage:.allvar get VARIABLE');

            const val = runtime[key];
            if (val === undefined) return reply(`֎ Variable ${key} not set.`);
            return reply(`֎ ${key} = ${val}`);
        }

        if (sub === 'del' || sub === 'delete') {
            const key = args[1]?.toUpperCase();
            if (!key) return reply('֎ Usage:.allvar del VARIABLE');

            const result = delVar(key);
            if (result) return reply(`֎ Deleted ${key}. Reset to default.`);
            return reply('֎ Variable not found or cannot delete.');
        }

        if (sub === 'reset') {
            const key = args[1]?.toUpperCase();
            if (!key) return reply('֎ Usage:.allvar reset VARIABLE');

            const result = resetVar(key);
            if (result) return reply(`֎ Reset ${key} to default value.`);
            return reply('֎ Variable not found.');
        }

        if (sub === 'clear') {
            const keys = Object.keys(runtime);
            if (!keys.length) return reply('֎ No runtime variables to clear.');

            keys.forEach(k => delVar(k));
            return reply(`֎ Cleared ${keys.length} runtime variables.`);
        }

        if (sub === 'reload') {
            loadConfig();
            return reply('֎ Config reloaded from disk.');
        }

        if (sub === 'export') {
            const data = JSON.stringify(runtime, null, 2);
            return reply(
`֎ *Exported Variables*
\`\`json
${data}
\`\`
Copy and save this output.`
            );
        }

        if (sub === 'import') {
            const jsonStr = args.slice(1).join(' ');
            if (!jsonStr) return reply('֎ Usage:.allvar import {\"KEY\":\"VALUE\"}');

            try {
                const obj = JSON.parse(jsonStr);
                let count = 0;
                for (const [k, v] of Object.entries(obj)) {
                    if (setVar(k.toUpperCase(), v)) count++;
                }
                return reply(`֎ Imported ${count} variables successfully.`);
            } catch (e) {
                return reply('֎ Invalid JSON format.');
            }
        }

        if (sub === 'search') {
            const query = args[1]?.toLowerCase();
            if (!query) return reply('֎ Usage:.allvar search keyword');

            const matches = Object.entries(runtime).filter(([k, v]) =>
                k.toLowerCase().includes(query) || String(v).toLowerCase().includes(query)
            );

            if (!matches.length) return reply(`֎ No variables found matching "${query}".`);

            const list = matches.map(([k, v]) => `❏ ${k} = ${v}`).join('\n');
            return reply(`֎ Found ${matches.length} matches:\n${list}`);
        }

        if (sub === 'help') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • VARIABLE COMMANDS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
֎.allvar list → List all vars
֎.allvar get KEY → Get value
֎.allvar set KEY=VALUE → Set var
֎.allvar del KEY → Delete var
֎.allvar reset KEY → Reset to default
֎.allvar clear → Clear all runtime vars
֎.allvar reload → Reload config file
֎.allvar export → Export as JSON
֎.allvar import JSON → Import JSON
֎.allvar search KEYWORD → Search vars
֎.allvar help → Show this menu`
            );
        }

        return reply('֎ Invalid subcommand. Use.allvar help for commands.');
    }
};