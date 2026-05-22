module.exports = {
    name: 'ping',
    alias: ['speed', 'test', 'latency'],
    desc: 'Check bot response speed',
    category: 'Bot',
    reactions: { start: '♻️', success: '⚡' },

    execute: async (sock, msg, { reply }) => {
        const startTime = Date.now();
        
        // Get current time first
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos'
        }).toLowerCase();

        // Show typing presence
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
        
        // Send initial ping message and save the message key
        const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `*✪_pinging : All defenses awaking_* ${time}`
        }, { quoted: msg });

        // Calculate latency
        const latency = Date.now() - startTime;

        const response = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ❏ p֎ng! : ${latency} ms . . .
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

        // Edit the message instead of sending a new one
        await sock.sendMessage(msg.key.remoteJid, {
            text: response,
            edit: sentMsg.key
        });
        
        // Set presence back to available
        await sock.sendPresenceUpdate('available', msg.key.remoteJid);
    }
};