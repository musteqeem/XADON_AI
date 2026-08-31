module.exports = {
    name: 'tagall',
    aliases: ['mentionall', 'everyone'],
    category: 'Group',
    description: 'Tag all group members with a message',
    usage: 'tagall [message] OR reply to message',
    cooldown: 15,
    permissions: [],

    execute: async (sock, m, { args, reply }) => {
        try {
            // Get message text from args or quoted message
            let text = args.join(' ') || 'Group Notification';

            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedText = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation ||
                                  m.message.extendedTextMessage.contextInfo.quotedMessage.extendedTextMessage?.text || '';
                if (quotedText) {
                    text = quotedText;
                }
            }

            // Get group metadata
            const groupMetadata = await sock.groupMetadata(m.chat);
            const participants = groupMetadata.participants.map(p => p.id);

            let tagMessage = `📢 Group Announcement\n${text}\n\n👥 Tagged Members:\n`;

            participants.forEach((participant, index) => {
                const number = participant.split('@')[0];
                tagMessage += `${index + 1}. @${number}\n`;
            });

            tagMessage += `\n✅ Total Members: ${participants.length}\n📅 Date: ${new Date().toLocaleDateString()}\n⏰ Time: ${new Date().toLocaleTimeString()}`;

            await sock.sendMessage(m.chat, {
                text: tagMessage,
                mentions: participants
            }, { quoted: m });

        } catch (error) {
            console.error('Tagall error:', error);
            await sock.sendMessage(m.chat, {
                text: '❌ Error: Failed to tag all members. Make sure I am in a group and have access.'
            }, { quoted: m });
        }
    }
};