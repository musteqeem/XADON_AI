const sharp = require('sharp');
const { downloadContentFromMessage } = require('@itsliaaa/baileys');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

// Store collage sessions: key = `${sender}_${chat}` -> { images: Buffer[], layout: string }
const collageSessions = new Map();

module.exports = {
    name: 'collage',
    alias: ['combine', 'merge', 'imgcollage'],
    desc: 'Add images then merge them into a collage',
    category: 'Media',
    usage: '.collage add |.collage push [grid|row|col] |.collage clear',
    reactions: { start: '🖼️', success: '✨' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const subcommand = args[0]?.toLowerCase();
        const sessionKey = `${m.sender}_${m.chat}`;

        // Helper: download image from a message object
        const downloadImg = async (msgObj) => {
            const stream = await downloadContentFromMessage(msgObj, 'image');
            let buf = Buffer.alloc(0);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            return buf;
        };

        // Helper: get image from replied message
        const getRepliedImage = async () => {
            if (!m.quoted) return null;
            if (m.quoted.mtype === 'imageMessage') {
                const rawQuoted = m.msg?.contextInfo?.quotedMessage?.imageMessage;
                if (rawQuoted) return await downloadImg(rawQuoted);
            }
            return null;
        };

        // CLEAR SESSION
        if (subcommand === 'clear') {
            collageSessions.delete(sessionKey);
            return reply('✦ ֎ Collage session cleared!');
        }

        // ADD command
        if (subcommand === 'add') {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});

            const imgBuffer = await getRepliedImage();
            if (!imgBuffer) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } }).catch(() => {});
                return reply(`✘ ֎ Reply to an image with ${prefix}collage add`);
            }

            let session = collageSessions.get(sessionKey);
            if (!session) {
                session = { images: [], layout: 'grid' };
                collageSessions.set(sessionKey, session);
            }
            session.images.push(imgBuffer);

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } }).catch(() => {});
            return reply(`✓ ֎ Image added\n❏ Total in queue: ${session.images.length}`);
        }

        // PUSH command
        if (subcommand === 'push') {
            const session = collageSessions.get(sessionKey);
            if (!session || session.images.length < 2) {
                return reply(`✘ ֎ Need at least 2 images\n❏ Use ${prefix}collage add on replied images first`);
            }

            let layout = args[1]?.toLowerCase() || session.layout || 'grid';
            if (!['grid', 'row', 'col', 'column'].includes(layout)) {
                layout = 'grid';
            }

            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
            await reply('֎ Creating collage...');

            try {
                const images = session.images;
                const SIZE = 512;
                const GAP = 4;
                const count = images.length;
                const isRow = layout === 'row';
                const isCol = layout === 'col' || layout === 'column';
                const isGrid = layout === 'grid';

                // Resize all images
                const resized = await Promise.all(
                    images.map(buf =>
                        sharp(buf)
                           .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
                           .png()
                           .toBuffer()
                    )
                );

                let collageBuffer;

                if (isRow || (isGrid && count === 2)) {
                    const totalW = SIZE * count + GAP * (count - 1);
                    const base = sharp({
                        create: { width: totalW, height: SIZE, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } }
                    });
                    const composites = resized.map((buf, i) => ({
                        input: buf,
                        left: i * (SIZE + GAP),
                        top: 0
                    }));
                    collageBuffer = await base.composite(composites).jpeg({ quality: 92 }).toBuffer();
                } else if (isCol) {
                    const totalH = SIZE * count + GAP * (count - 1);
                    const base = sharp({
                        create: { width: SIZE, height: totalH, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } }
                    });
                    const composites = resized.map((buf, i) => ({
                        input: buf,
                        left: 0,
                        top: i * (SIZE + GAP)
                    }));
                    collageBuffer = await base.composite(composites).jpeg({ quality: 92 }).toBuffer();
                } else {
                    const cols = count <= 2? count : 2;
                    const rows = Math.ceil(count / cols);
                    const totalW = cols * SIZE + GAP * (cols - 1);
                    const totalH = rows * SIZE + GAP * (rows - 1);
                    const base = sharp({
                        create: { width: totalW, height: totalH, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } }
                    });
                    const composites = resized.map((buf, i) => ({
                        input: buf,
                        left: (i % cols) * (SIZE + GAP),
                        top: Math.floor(i / cols) * (SIZE + GAP)
                    }));
                    collageBuffer = await base.composite(composites).jpeg({ quality: 92 }).toBuffer();
                }

                let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} COLLAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COLLAGE CREATED*
│ ❏ Images : ${count}
│ ❏ Layout : ${layout}
│ ❏ Size : ${SIZE}x${SIZE} per image
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

                await sock.sendMessage(m.chat, {
                    image: collageBuffer,
                    caption: caption
                }, { quoted: m });

                // Clear session after successful push
                collageSessions.delete(sessionKey);
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } }).catch(() => {});

            } catch (err) {
                console.error('[COLLAGE ERROR]', err);
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } }).catch(() => {});
                reply(`✘ ֎ Failed to create collage\n❏ Error: ${err.message}`);
            }
            return;
        }

        // HELP / USAGE
        let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} COLLAGE MAKER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Step 1 : Reply to image with ${prefix}collage add
│ ❏ Step 2 : Repeat for 2+ images
│ ❏ Step 3 : ${prefix}collage push [grid|row|col]
╰─────────────────────────╯
╭─֎ *LAYOUTS*
│ ❏ grid : 2x2, 2x3 etc
│ ❏ row : side by side
│ ❏ col : top to bottom
╰─────────────────────────╯
╭─֎ *OTHER*
│ ❏ ${prefix}collage clear : clear queue
│ ❏ ${prefix}collage list : show count
╰─────────────────────────╯`;

        if (subcommand === 'list') {
            const session = collageSessions.get(sessionKey);
            const count = session? session.images.length : 0;
            help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} COLLAGE QUEUE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SESSION INFO*
│ ❏ Images in queue : ${count}
│ ❏ Status : ${count < 2? 'Need more images' : 'Ready to push'}
╰─────────────────────────╯`;
        }

        return reply(help);
    }
};