const ms = require('ms');

module.exports = {
    name: 'muteg',
    alias: ['mutegrp'],
    category: 'timer',
    description: 'Mute group with optional timer',
    usage: '.muteg 10m',

    execute: async (sock, m, { args, reply }) => {

        if (!m.isGroup)
            return reply('*Group only command*');

        try {

            // 🔇 Mute immediately
            await sock.groupSettingUpdate(m.chat, 'announcement');

            await sock.sendMessage(m.chat, {
                text: `*Group closed successfully*`
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                react: { text: "🔇", key: m.key }
            });

            // ⏳ If timer is provided → auto unmute later
            if (args[0]) {

                let duration = ms(args[0]);

                if (!duration || duration < 10000)
                    return reply('⚠️ Invalid time\nUse: 10s, 5m, 1h\n> XADON AI');

                await sock.sendMessage(m.chat, {
                    text: `⏳ Group will be unmuted again in ${args[0]}`
                });

                setTimeout(async () => {
                    try {

                        await sock.groupSettingUpdate(m.chat, 'not_announcement');

                        await sock.sendMessage(m.chat, {
                            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *AUTO UNMUTE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

_*🔊 Group unmuted again*_`
                        });

                        await sock.sendMessage(m.chat, {
                            react: { text: "🔊", key: m.key }
                        });

                    } catch (e) {
                        console.log('Auto unmute failed:', e);
                    }
                }, duration);
            }

        } catch (err) {

            console.error('[MUTEG ERROR]', err);

            let msg = '❌ Failed to mute group\n\n';

            if (err.message?.includes('admin')) {
                msg += '• Bot needs admin rights';
            } else {
                msg += `• ${err.message}`;
            }

            reply(msg + '\n> XADON AI');
        }
    }
};