const axios = require('axios');
module.exports = {
    name: 'gpp',
    alias: ['grouppp', 'grouppic'],
    desc: 'Download gr֎up profile picture',
    category: 'Group',
    groupOnly: true,

    // Reaction config - unchanged
    reactions: {
        start: '☺️',
        success: '👌'
    },
    
    execute: async (sock, m, { reply, groupMeta }) => {
        try {
            const url = await sock.profilePictureUrl(m.chat, 'image');
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            await sock.sendMessage(m.sender, {
                image: Buffer.from(res.data),
                caption: `✦ ${groupMeta?.subject || 'Gr֎up'} ✦`
            });
            await reply('*✓ Sent t֎ your DM!*');
        } catch { 
            await reply('✘ This group has no profile picture!'); 
        }
    }
};