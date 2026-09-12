const {
    loadConfig,
    saveConfig,
    isInBlacklist,
    isInWhitelist,
    normalizeJid
} = require('../../Plugin/anticallManager');

module.exports = {
    name: 'anticall',
    alias: ['callguard'],
    category: 'Defense',
    desc: 'Configure automatic call rejection and caller allow/block lists',
    usage: '.anticall on/off | .anticall whitelist add/remove <jid> | .anticall reject add/remove <jid>',
    groupOnly: false,
    adminOnly: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            const config = loadConfig();
            const sub = String(args?.[0] || 'status').toLowerCase();
            const action = String(args?.[1] || '').toLowerCase();
            const value = normalizeJid(args?.slice(2).join(' '));

            if (sub === 'status') {
                return reply(
                    `📵 *ANTI CALL*\n\n` +
                    `Status: ${config.enabled ? 'ON' : 'OFF'}\n` +
                    `Whitelist: ${config.whitelist?.length || 0}\n` +
                    `Blacklist: ${config.blacklist?.length || 0}`
                );
            }

            if (sub === 'on' || sub === 'off') {
                config.enabled = sub === 'on';
                saveConfig(config);
                return reply(`📵 Anti Call ${config.enabled ? 'enabled' : 'disabled'}.`);
            }

            if (!['whitelist', 'reject'].includes(sub) || !['add', 'remove'].includes(action) || !value) {
                return reply('❌ Usage: .anticall on/off | .anticall whitelist add/remove <jid> | .anticall reject add/remove <jid>');
            }

            const listName = sub === 'whitelist' ? 'whitelist' : 'blacklist';
            if (!Array.isArray(config[listName])) config[listName] = [];

            if (action === 'add' && !config[listName].includes(value)) {
                config[listName].push(value);
            }

            if (action === 'remove') {
                config[listName] = config[listName].filter(item => normalizeJid(item) !== value);
            }

            saveConfig(config);
            return reply(`✅ ${sub} ${action} completed for ${value}.`);
        } catch (error) {
            console.error('[ANTICALL ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
