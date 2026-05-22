module.exports = {
    name: 'setgpp',
    alias: ['setgrouppp', 'setppgroup'],
    desc: 'Set gr֎up profile picture (reply to image)',
    category: 'group',
    usage: '.setgpp (reply to image)',

    execute: async (sock, m, { reply }) => {

        if (!m.isGroup)
            return reply('✘ Group only');

        if (!m.quoted || !m.quoted.mtype?.includes('image'))
            return reply('✘ Reply t֎ an image\n✪ `.setgpp`');

        try {
            const buffer = await m.quoted.download();

            await sock.updateProfilePicture(m.chat, buffer);

            await reply('*✓ Gr֎up profile picture updated*');

        } catch (err) {
            console.error('[SETPPG ERROR]', err?.message || err);

            let msg = '✘ Failed t֎ set pp\n';

            if (err.message?.includes('admin') || err.message?.includes('permission')) {
                msg += 'Bot lacks admin permission';
            } else {
                msg += err.message || 'Unknown error';
            }

            reply(msg);
        }
    }
};