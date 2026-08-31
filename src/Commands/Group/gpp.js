const axios = require('axios');

module.exports = {
    name: 'gpp',
    alias: ['grouppp', 'grouppic'],
    desc: 'Download group profile picture',
    category: 'Utils',
    groupOnly: true,
    reactions: { start: '☺️', success: '👌', error: '✘' },

    execute: async (sock, m, { reply, groupMeta }) => {
        await sock.sendMessage(m.chat, { react: { text: '☺️', key: m.key } });

        try {
            const url = await sock.profilePictureUrl(m.chat, 'image');
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            
            await sock.sendMessage(m.sender, {
                image: Buffer.from(res.data),
                caption: `_*${groupMeta?.subject || 'Group Profile Picture'}*_`
            });

            await sock.sendMessage(m.chat, { react: { text: '👌', key: m.key } });
            await reply('~_*✓ Sent to your DM!*_~');
        } catch (err) { 
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            await reply('~_*✘ This group has no profile picture!*_~'); 
        }
    }
};