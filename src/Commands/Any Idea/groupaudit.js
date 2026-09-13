module.exports = {
    name: 'groupaudit',
    alias: ['gcaudit', 'auditgroup'],
    category: 'ANY IDEA',
    desc: 'Audit group administration and bot permissions',
    usage: '.groupaudit',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🛡️', success: '✨', error: '❌' },

    execute: async (sock, m, { reply }) => {
        const meta = await sock.groupMetadata(m.chat).catch(() => null);
        if (!meta) return reply('❌ Group metadata is unavailable.');

        const participants = meta.participants || [];
        const admins = participants.filter(user => user.admin);
        const botId = normalize(sock.user?.id || '');
        const bot = participants.find(user => normalize(user.id) === botId);

        const owner = meta.owner ? normalize(meta.owner) : 'Unknown';
        const created = meta.creation
            ? new Date(Number(meta.creation) * 1000).toLocaleString()
            : 'Unknown';

        return reply(
            `╭─ 🛡️ *GROUP AUDIT*\n` +
            `│ Name       : ${meta.subject || 'Unknown'}\n` +
            `│ Members    : ${participants.length}\n` +
            `│ Admins     : ${admins.length}\n` +
            `│ Bot admin  : ${bot?.admin ? 'YES' : 'NO'}\n` +
            `│ Owner      : ${owner}\n` +
            `│ Created    : ${created}\n` +
            `│ Announce   : ${meta.announce ? 'ON' : 'OFF'}\n` +
            `│ Restricted : ${meta.restrict ? 'ON' : 'OFF'}\n` +
            `╰────────────────────`
        );
    }
};

function normalize(jid) {
    return String(jid || '').replace(/:\d+(?=@)/, '').toLowerCase();
}
