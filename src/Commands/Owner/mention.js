const fs = require('fs');
const path = require('path');

const MENTION_FILE = path.join(__dirname, '../../../database/mention_config.json');

// Never reassign this object — mutate it so exported reference stays valid
const mentionConfig = {
    active: false,
    action: '',
    emoji: '❤️‍🔥',
    text: ''
};

const loadMentionConfig = () => {
    try {
        if (fs.existsSync(MENTION_FILE)) {
            Object.assign(mentionConfig, JSON.parse(fs.readFileSync(MENTION_FILE, 'utf8')));
        }
    } catch (e) {
        console.error('[XDN MENTION LOAD ERROR]', e.message);
    }
};

const saveMentionConfig = () => {
    try {
        fs.mkdirSync(path.dirname(MENTION_FILE), { recursive: true });
        fs.writeFileSync(MENTION_FILE, JSON.stringify(mentionConfig, null, 2));
    } catch (e) {
        console.error('[XDN MENTION SAVE ERROR]', e.message);
    }
};

loadMentionConfig();

const norm = (j) => (j || '').replace(/:\d+@/, '@').toLowerCase().trim();

module.exports = {
    name: 'mention',
    alias: ['tagme', 'owntag'],
    desc: 'Set action when owner is mentioned with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '⚙️', success: '֎' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const option = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');

        // OFF
        if (option === 'off') {
            mentionConfig.active = false;
            mentionConfig.action = '';
            saveMentionConfig();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MENTION STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : OFF
│ ❏ Action : DISABLED
╰─────────────────────────╯

> ֎`
            );
        }

        // STATUS
        if (option === 'status' || option === '-status') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MENTION STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Active : ${mentionConfig.active? 'ON' : 'OFF'}
│ ❏ Action : ${mentionConfig.action || 'NONE'}
│ ❏ Emoji : ${mentionConfig.emoji || '-'}
│ ❏ Text : ${mentionConfig.text || '-'}
╰─────────────────────────╯

> ֎`
            );
        }

        // REACT
        if (option === 'react' || option === '-react') {
            if (!value) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MENTION ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Reason : No emoji provided
╰─────────────────────────╯

Usage:
${prefix}mention -react ❤️‍🔥

> ֎`
                );
            }
            mentionConfig.active = true;
            mentionConfig.action = 'react';
            mentionConfig.emoji = value;
            mentionConfig.text = '';
            saveMentionConfig();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MENTION UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ON
│ ❏ Action : REACT
│ ❏ Emoji : ${value}
╰─────────────────────────╯

> ֎`
            );
        }

        // TEXT
        if (option === 'text' || option === '-text') {
            if (!value) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MENTION ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : FAILED
│ ❏ Reason : No text provided
╰─────────────────────────╯

Usage:
${prefix}mention -text Busy, back later

> ֎`
                );
            }
            mentionConfig.active = true;
            mentionConfig.action = 'text';
            mentionConfig.text = value;
            mentionConfig.emoji = '';
            saveMentionConfig();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MENTION UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ON
│ ❏ Action : TEXT
│ ❏ Text : ${value.slice(0, 30)}${value.length > 30? '...' : ''}
╰─────────────────────────╯

> ֎`
            );
        }

        // HELP
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MENTION CONFIG •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}mention off → Disable responses
│ ❏ ${prefix}mention -status → Show config
│ ❏ ${prefix}mention -react <emoji> → Auto-react
│ Example: ${prefix}mention -react ❤️‍🔥
│ ❏ ${prefix}mention -text <message> → Auto-reply
│ Example: ${prefix}mention -text Busy, back later
╰─────────────────────────╯

> ֎`
        );
    }
};

module.exports.mentionConfig = mentionConfig;
module.exports.loadMentionConfig = loadMentionConfig;
module.exports.norm = norm;