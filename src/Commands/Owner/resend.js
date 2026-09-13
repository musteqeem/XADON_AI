/* Repost plugin - forwards replied message to target chat
 * Note: BAILEYS repost/tag support pending update
 */
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'repost',
    alias: ['resend'],
    desc: 'Repost a replied message to another chat',
    category: 'Tools',
    usage: '.repost <jid> |.repost <invite_link> (reply to a message)',

    execute: async (sock, m, { reply, args }) => {

        if (!m.quoted) {
            return reply(`✘ Reply to a message first`);
        }

        if (!args[0]) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} REPOST*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}repost <jid>
│ ❏ ${prefix}repost <invite_link>
│
╭─֎ *EXAMPLES*
│ ❏ ${prefix}repost 2348xxxx@s.whatsapp.net
│ ❏ ${prefix}repost https://chat.whatsapp.com/xxxxx
│ ❏ ${prefix}repost https://wa.me/2348xxxx
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        let target = args[0];

        try {
            // GROUP INVITE
            if (target.includes('chat.whatsapp.com')) {
                const code = target.split('chat.whatsapp.com/')[1].split('?')[0];
                const info = await sock.groupGetInviteInfo(code);
                target = info.id;

                if (!target) return reply(`✘ Could not resolve group JID`);
            }
            // WA.ME
            else if (target.includes('wa.me/')) {
                const num = target.split('wa.me/')[1].split('?')[0];
                target = `${num}@s.whatsapp.net`;
            }
            // RAW NUMBER
            else if (!target.includes('@')) {
                target = `${target}@s.whatsapp.net`;
            }

        } catch (e) {
            return reply(`✘ Invalid link or expired invite`);
        }

        const q = m.quoted;

        const text =
            q.text ||
            q.caption ||
            q.body ||
            q.conversation ||
            '';

        let media = null;
        try {
            media = await sock.downloadMediaMessage(q);
        } catch (e) {
            media = null;
        }

        try {
            // TEXT ONLY
            if (text &&!media) {
                await sock.sendMessage(target, { text: `${text}` });
                return reply(`✓ Message reposted to ${target}`);
            }

            // MEDIA SEND
            if (media) {
                if (q.mtype === 'imageMessage') {
                    await sock.sendMessage(target, { image: media, caption: `${q.caption || ''}` });
                }
                else if (q.mtype === 'videoMessage') {
                    await sock.sendMessage(target, { video: media, caption: `${q.caption || ''}` });
                }
                else if (q.mtype === 'audioMessage') {
                    await sock.sendMessage(target, { audio: media, ptt: q.ptt || false });
                }
                else if (q.mtype === 'stickerMessage') {
                    await sock.sendMessage(target, { sticker: media });
                }
                else {
                    await sock.sendMessage(target, { document: media, fileName: 'repost-file' });
                }

                return reply(`✓ Media reposted to ${target}`);
            }

            return reply(`✘ Unsupported message type`);

        } catch (e) {
            console.error(`[${BOT_NAME} REPOST ERROR]`, e.message);
            return reply(`✘ Failed to repost message`);
        }
    }
};