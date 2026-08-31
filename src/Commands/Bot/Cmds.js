const { getByCategory, getAll } = require('../../Plugin/xdnCmd');

module.exports = {
    name: 'cmds',
    alias: ['commands', 'allcmds', 'listcmds'],
    desc: 'List all installed commands with info',
    category: 'general',
    reactions: {
        start: '💬',
        success: '🤩'
    },

    execute: async (sock, m, { prefix, reply }) => {
        try {
            await sock.sendMessage(m.chat, { react: { text: '💬', key: m.key } });

            const categories = getByCategory();
            const allCommands = getAll();

            if (!allCommands.size) return reply('✘ No commands found');

            let text = '`◥◣◦✧XADON COMMANDS✧◦◢◤`\n\n';

            for (const [cat, cmds] of Object.entries(categories)) {
                text += `📂 *${cat.toUpperCase()}* 𓀀\n`;
                const seen = new Set();
                for (const c of cmds) {
                    if (c?.name &&!seen.has(c.name.toLowerCase())) {
                        seen.add(c.name.toLowerCase());
                        text += `𒆜◈ ${prefix}${c.name}\n`;
                        text += ` ❏◦ *Desc*: ${c.desc || 'No description'}\n`;
                        if (c.alias?.length) text += ` ❂◦ *Aliases*: ${c.alias.join(', ')}\n`;
                        text += ` ✐◦ *Usage*: ${prefix}${c.name}\n\n`;
                    }
                }
            }

            text += '_*☞⁠ ͡⁠°⁠ ͜⁠ʖ⁠ ͡⁠°⁠)⁠☞ Type.help <command> for details*_';

            // WhatsApp limit ~4096 for normal text, ~65536 max. Split if needed
            const chunks = text.match(/[\s\S]{1,4000}/g) || [text];
            for (const chunk of chunks) {
                await sock.sendMessage(m.chat, { text: chunk }, { quoted: m });
            }

            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
        } catch (err) {
            console.error('[LISTCMDS ERROR]', err);
            reply('✘ Failed to load commands');
        }
    }
};