const { setVar } = require('../../Plugin/configManager');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(process.cwd(), '.env');

// Read current.env into a key-value map
function readEnv() {
    if (!fs.existsSync(ENV_PATH)) return {};
    const map = {};
    for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        map[k] = v;
    }
    return map;
}

// Write map back to.env preserving comments and blank lines
function writeEnv(map) {
    if (!fs.existsSync(ENV_PATH)) {
        const lines = Object.entries(map).map(([k, v]) => `${k}=${v}`).join('\n');
        fs.writeFileSync(ENV_PATH, lines + '\n');
        return;
    }

    const raw = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
    const seen = new Set();
    const out = [];

    for (const line of raw) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            out.push(line);
            continue;
        }
        const idx = trimmed.indexOf('=');
        if (idx === -1) { out.push(line); continue; }
        const k = trimmed.slice(0, idx).trim();
        seen.add(k);
        if (k in map) {
            out.push(`${k}=${map[k]}`);
        } else {
            out.push(line);
        }
    }

    for (const [k, v] of Object.entries(map)) {
        if (!seen.has(k)) out.push(`${k}=${v}`);
    }

    fs.writeFileSync(ENV_PATH, out.join('\n'));
}

module.exports = {
    name: 'setvar',
    alias: ['sv'],
    desc: 'Set a config variable with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '⚙️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        if (!args[0]) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SETVAR USAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Format :.setvar KEY=value
│ ❏ Examples :
│.setvar PREFIX=.
│.setvar BOT_NAME=XADON AI
│.setvar PUBLIC_MODE=true
│.setvar SUDO_NUMBERS=2348xxx,2349xxx
╰─────────────────────────╯

> ֎`
            );
        }

        // Support both KEY=value and KEY value formats
        const full = args.join(' ');
        let key, value;

        if (full.includes('=')) {
            const idx = full.indexOf('=');
            key = full.slice(0, idx).trim().toUpperCase();
            value = full.slice(idx + 1).trim();
        } else {
            key = args[0].toUpperCase();
            value = args.slice(1).join(' ').trim();
        }

        if (!key || value === '') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SETVAR ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Reason : Invalid format
╰─────────────────────────╯

Usage:.setvar KEY=value

> ֎`
            );
        }

        // Save to runtime
        setVar(key, value);

        // Save to.env
        try {
            const env = readEnv();
            env[key] = value;
            writeEnv(env);

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • VAR UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Key : ${key}
│ ❏ Value : ${value}
│ ❏ Status : SAVED
╰─────────────────────────╯

Saved to.env + runtime. No restart needed.

> ֎`
            );
        } catch (err) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • PARTIAL SAVE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Key : ${key}
│ ❏ Value : ${value}
│ ❏ Runtime : SAVED
│ ❏.env : FAILED
│ ❏ Error : ${err.message}
╰─────────────────────────╯

> ֎`
            );
        }
    }
};