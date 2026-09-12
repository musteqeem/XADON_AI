const { normalizeJid } = require('../_helpers');

module.exports = {
    name: 'id',
    alias: ['jid', 'ids'],
    category: 'ANY IDEA',
    desc: 'Inspect the current chat, sender and replied-message IDs',
    usage: '.id',
    reactions: { start: '🆔', success: '✨', error: '❌' },

    execute: async (sock, m, { reply }) => {
        const sender = normalizeJid(m.sender || m.key?.participant || 'unknown');
        const chat = normalizeJid(m.chat || m.key?.remoteJid || 'unknown');
        const quoted = normalizeJid(m.quoted?.sender || m.quoted?.key?.participant || 'none');
        const quotedId = m.quoted?.key?.id || 'none';

        return reply(
            `╭─ 🆔 *MESSAGE IDs*\n` +
            `│ Chat      : ${chat}\n` +
            `│ Sender    : ${sender}\n` +
            `│ Message   : ${m.key?.id || 'unknown'}\n` +
            `│ Quoted by : ${quoted}\n` +
            `│ Quoted ID : ${quotedId}\n` +
            `│ Type      : ${m.mtype || 'unknown'}\n` +
            `╰────────────────────`
        );
    }
};
