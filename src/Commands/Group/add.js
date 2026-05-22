module.exports = {
    name: 'add',
    alias: ['invite'],
    description: 'Add a user to the group',
    category: 'Group',
    usage: '.add @user or .add 234xxxxxxxxxx',

    execute: async (sock, m, { args, reply }) => {

        if (!m.isGroup)
            return reply('𓉤✨ This command works only in groups');

        let number = args[0]?.replace(/[^0-9]/g, '');

        if (!number) {
            if (m.mentionedJid?.length) {
                number = m.mentionedJid[0].split('@')[0];
            } else {
                return reply('🚀 Tag or enter full number\nExample: .add 234xxxxxxxxxx');
            }
        }

        if (number.length < 10)
            return reply('✘🔥 Number too short — use full format (e.g. 234xxxxxxxxxx)');

        const jid = number + '@s.whatsapp.net';

        try {

            await sock.groupParticipantsUpdate(m.chat, [jid], 'add');

            // Small delay for smoothness
            await new Promise(r => setTimeout(r, 1500));

            await reply(`✓ ✪ Successfully added <${number}>`);

            await sock.sendMessage(m.chat, {
                text: `🚀 ✪ Welcome @${number} 🎉\nIntroduce yourself!`,
                mentions: [jid]
            });

        } catch (err) {

            console.error('[ADD ERROR]', err?.message || err);

            let msg = '✘ 🧭 Failed to add user\n\n';

            if (err.message?.includes('admin') || err.message?.includes('permission')) {
                msg += '• Bot needs admin rights\nMake me full admin';
            } else if (err.message?.includes('401') || err.message?.includes('forbidden')) {
                msg += '• User privacy settings block adding';
            } else if (err.message?.includes('404')) {
                msg += '• Number not on WhatsApp';
            } else {
                msg += `• Error: <${err.message || 'Unknown'}>`;
            }

            reply(`🌟 ${msg}`);
        }
    }
};