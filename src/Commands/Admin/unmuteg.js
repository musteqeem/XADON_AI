const ms = require('ms');

module.exports = {
    name: 'unmuteg',
    alias: ['unmutegrp'],
    category: 'timer',
    description: 'Unmute group with optional timer',
    usage: '.unmuteg 10m',

    execute: async (sock, m, { args, reply }) => {

        if (!m.isGroup)
            return reply('_*❌ Group only command*_');

        try {

            // 🔊 Unmute immediately
            await sock.groupSettingUpdate(m.chat, 'not_announcement');

            await sock.sendMessage(m.chat, {
                text: `*🔊 Group is now unmuted*\n*_⚡ Members can chat_*`
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                react: { text: "🔊", key: m.key }
            });

            // ⏳ If timer is provided → re-mute later
            if (args[0]) {

                let duration = ms(args[0]);

                if (!duration || duration < 10000)
                    return reply('⚠️ Invalid time\nUse: 10s, 5m, 1h\n> XADON AI');

                await sock.sendMessage(m.chat, {
                    text: `⏳ Group will be muted again in ${args[0]}\n> XADON AI`
                });

                setTimeout(async () => {
                    try {

                        await sock.groupSettingUpdate(m.chat, 'announcement');

                        await sock.sendMessage(m.chat, {
                            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   *XADON AI • AUTO MUTE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

🔇 Group muted again

> XADON AI`
                        });

                        await sock.sendMessage(m.chat, {
                            react: { text: "🔇", key: m.key }
                        });

                    } catch (e) {
                        console.log('Auto re-mute failed:', e);
                    }
                }, duration);
            }

        } catch (err) {

            console.error('[UNMUTEG ERROR]', err);

            let msg = '❌ Failed to unmute group\n\n';

            if (err.message?.includes('admin')) {
                msg += '• Bot needs admin rights';
            } else {
                msg += `• ${err.message}`;
            }

            reply(msg + '\n> XADON AI');
        }
    }
};