const {
    loadJSON,
    saveJSON,
    getGroupInfo,
    isAdmin,
    senderOf
} = require('./_utils');

const DB = 'lockdown';

module.exports = {
    name: 'lockdown',
    alias: ['lock'],
    category: 'Defense',
    desc: 'Lock a group so only admins can send messages',
    usage: '.lockdown on/off/status',
    groupOnly: true,
    adminOnly: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.isGroup) return reply('❌ This command can only be used in a group.');

            const db = loadJSON(DB);
            const sub = String(args?.[0] || 'status').toLowerCase();
            const cfg = db[m.chat] || { enabled: false };

            if (sub === 'status') {
                return reply(`🔒 *GROUP LOCKDOWN*\n\nStatus: ${cfg.enabled ? 'ON' : 'OFF'}`);
            }

            if (!['on', 'off'].includes(sub)) {
                return reply('❌ Usage: .lockdown on/off/status');
            }

            const setting = sub === 'on' ? 'announcement' : 'not_announcement';
            await sock.groupSettingUpdate(m.chat, setting);

            db[m.chat] = { enabled: sub === 'on', updatedAt: Date.now() };
            saveJSON(DB, db);

            return reply(`🔒 Group lockdown ${sub === 'on' ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            console.error('[LOCKDOWN ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
