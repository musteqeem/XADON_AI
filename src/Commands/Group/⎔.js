const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env
const sharp = require('sharp');

module.exports = {
    name: 'gstatus',
    alias: ['gs'],
    desc: 'Post a status to the group or broadcast to all groups',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    usage: '.gstatus <text> | <groupJID>',
    reactions: { start: '📸', success: '✅', error: '❌' },

    execute: async (sock, m, { text, reply }) => {
        try {
            const quoted = m.quoted || {};
            const chatId = m.chat;

            await sock.sendMessage(chatId, { react: { text: '📸', key: m.key } });

            // BROADCAST MODE: .gstatus <text> | all
            if (text && text.includes('|')) {
                const [message, target] = text.split('|').map(s => s.trim());
                
                if (target.toLowerCase() === 'all') {
                    const broadcastMsg = message || quoted.text || quoted.caption || '';
                    if (!broadcastMsg) return reply('_*❌ Please provide a message to broadcast*_');
                    
                    const allGroups = await sock.groupFetchAllParticipating();
                    const groupIds = Object.keys(allGroups);
                    
                    if (!groupIds.length) return reply('_*❌ Bot is not in any groups*_');
                    
                    await reply(`_*⏳ Broadcasting to ${groupIds.length} groups...*_`);
                    
                    let success = 0, failed = 0;
                    for (const groupId of groupIds) {
                        try {
                            await sock.sendMessage(groupId, { text: broadcastMsg, groupStatus: true });
                            success++;
                        } catch {
                            failed++;
                        }
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                    return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} BROADCAST*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DONE*
│ ❏ Success : ${success}
│ ❏ Failed : ${failed}
│ ❏ Total : ${groupIds.length}
╰─────────────────────────╯

_*✅ Broadcast completed*_`
                    );
                }
            }

            // SINGLE GROUP MODE
            let groupJid = chatId;
            let messageText = '';

            if (text && text.includes('|')) {
                const [msg, jid] = text.split('|').map(s => s.trim());
                if (msg) messageText = msg;
                if (jid) groupJid = jid;
            } else {
                messageText = text || '';
            }

            if (!groupJid.endsWith('@g.us')) return reply('_*❌ Invalid group JID*_');
            
            try { await sock.groupMetadata(groupJid); } 
            catch { return reply('_*❌ Bot is not in that group*_'); }

            // Handle Media Types
            const isImage = quoted.mtype === 'imageMessage';
            const isVideo = quoted.mtype === 'videoMessage';
            const isAudio = quoted.mtype === 'audioMessage';
            const isDoc = quoted.mtype === 'documentMessage';
            const isSticker = quoted.mtype === 'stickerMessage';

            if (isImage) {
                let buffer = await quoted.download();
                const caption = messageText || quoted.caption || quoted.text || '';
                try {
                    buffer = await sharp(buffer).resize({ width: 1920, height: 1080, fit: 'inside' }).jpeg({ quality: 100 }).toBuffer();
                } catch {}
                await sock.sendMessage(groupJid, { image: buffer, caption, groupStatus: true });
                await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
                return reply('_*✅ Posted successfully*_');
            }

            if (isVideo) {
                const buffer = await quoted.download();
                const caption = messageText || quoted.caption || quoted.text || '';
                await sock.sendMessage(groupJid, { video: buffer, caption, groupStatus: true });
                await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
                return reply('_*✅ Posted successfully*_');
            }

            if (isAudio) {
                const buffer = await quoted.download();
                await sock.sendMessage(groupJid, { 
                    audio: buffer, 
                    ptt: quoted.ptt || false, 
                    mimetype: quoted.mimetype || 'audio/mpeg', 
                    groupStatus: true 
                });
                await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
                return reply('_*✅ Posted successfully*_');
            }

            if (isDoc) {
                const buffer = await quoted.download();
                await sock.sendMessage(groupJid, { 
                    document: buffer, 
                    mimetype: quoted.mimetype, 
                    fileName: quoted.fileName || 'document', 
                    caption: messageText, 
                    groupStatus: true 
                });
                await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
                return reply('_*✅ Posted successfully*_');
            }

            if (isSticker) {
                let buffer = await quoted.download();
                try {
                    buffer = await sharp(buffer).resize({ width: 1920, height: 1080, fit: 'inside' }).jpeg({ quality: 100 }).toBuffer();
                } catch {}
                await sock.sendMessage(groupJid, { image: buffer, caption: messageText, groupStatus: true });
                await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
                return reply('_*✅ Posted successfully*_');
            }

            // TEXT ONLY
            if (messageText || quoted.text || quoted.caption) {
                const finalText = messageText || quoted.text || quoted.caption || '';
                await sock.sendMessage(groupJid, { text: finalText, groupStatus: true });
                await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
                return reply('_*✅ Posted successfully*_');
            }

            await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} GROUP STATUS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Single : .gstatus <text> | <groupJID>
│ ❏ Broadcast : .gstatus <text> | all
│ ❏ With Media : Reply media + .gstatus | <jid>
╰─────────────────────────╯

_*📸 Post status to any group*_
EXAMPLES:
.gstatus hello world | 120363425204601114@g.us
.gstatus hello everyone | all`
            );

        } catch (error) {
            console.error('[GSTATUS ERROR]', error);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`_*❌ ${error.message || 'Unknown error'}*_`);
        }
    }
};