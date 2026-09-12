const config = require('../../../settings/config');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@musteqeem/baileys');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const STORE_PATH = path.join(__dirname, '../../../data/bizcover.json');
const S_WHATSAPP_NET = '@s.whatsapp.net';

const loadStore = () => {
    try {
        if (fs.existsSync(STORE_PATH)) return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    } catch {}
    return {};
};

const saveStore = (data) => {
    try {
        fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    } catch {}
};

const USAGE = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} BUSINESS COVER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ .bizcover set : Reply to image to set
│ ❏ .bizcover get : Get current cover photo
│ ❏ .bizcover delete : Remove cover photo
╰─────────────────────────╯
❏ Note: Only works on WhatsApp Business accounts`;

module.exports = {
    name: 'bizcover',
    alias: ['coverphoto', 'bizcov', 'bcover'],
    desc: 'Manage your WhatsApp Business cover photo',
    category: 'Business',
    owner: true,
    usage: '.bizcover [set|get|delete]',

    execute: async (sock, m, { args, reply }) => {
        const action = args[0]?.toLowerCase();
        if (!action) return reply(USAGE);

        try {
            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });

            // ── SET ────────────────────────────────────────────────
            if (action === 'set') {
                const quoted = m.quoted || m;
                const imgMsg = quoted?.message?.imageMessage || quoted?.imageMessage;

                if (!imgMsg) {
                    return reply('✘ ֎ Send or reply to an image with .bizcover set');
                }

                const buffer = await downloadMediaMessage(
                    { message: quoted.message, key: quoted.key },
                    'buffer',
                    {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );

                if (!buffer || buffer.length < 1000) {
                    return reply('✘ ֎ Failed to download image');
                }

                const fbid = await sock.updateCoverPhoto(buffer);

                const store = loadStore();
                store.fbid = String(fbid);
                store.updatedAt = new Date().toISOString();
                saveStore(store);

                return await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} BUSINESS COVER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Set
❏ Status : Updated Successfully
❏ ID : ${fbid}`
                }, { quoted: m });
            }

            // ── GET ────────────────────────────────────────────────
            if (action === 'get') {
                let rawResult = null;
                let queryError = null;

                try {
                    rawResult = await sock.query({
                        tag: 'iq',
                        attrs: { to: S_WHATSAPP_NET, type: 'get', xmlns: 'w:biz' },
                        content: [{
                            tag: 'business_profile',
                            attrs: { v: '3' },
                            content: [{ tag: 'cover_photo', attrs: {} }]
                        }]
                    });
                } catch (e) {
                    queryError = e.message;
                }

                if (queryError) {
                    return reply(`✘ ֎ Query failed: ${queryError}`);
                }

                let url = null;
                if (rawResult) {
                    const content = rawResult?.content || [];
                    const profile = content.find?.(n => n?.tag === 'business_profile');
                    const coverContent = profile?.content || [];
                    const cover = coverContent.find?.(n => n?.tag === 'cover_photo');
                    url = cover?.attrs?.url || null;
                }

                if (url) {
                    return await sock.sendMessage(m.chat, {
                        image: { url },
                        caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} BUSINESS COVER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Get
❏ Status : Found`
                    }, { quoted: m });
                }

                return reply('✘ ֎ No cover photo found or account is not Business');
            }

            // ── DELETE ─────────────────────────────────────────────
            if (action === 'delete') {
                const store = loadStore();
                const id = args[1] || store.fbid;

                if (!id) {
                    return reply('✘ ֎ No cover photo ID found. Set one first or use .bizcover delete <id>');
                }

                await sock.removeCoverPhoto(id);

                delete store.fbid;
                delete store.updatedAt;
                saveStore(store);

                return await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} BUSINESS COVER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Delete
❏ ID : ${id}
❏ Status : Removed Successfully`
                }, { quoted: m });
            }

            return reply(USAGE);

        } catch (err) {
            console.error('[BIZCOVER ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Business Cover Error\n❏ Error: ${err.message}`);
        } finally {
            await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });
        }
    }
};