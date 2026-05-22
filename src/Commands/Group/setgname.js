module.exports = {
    name: 'setgname',
    alias: ['setgcname'],
    desc: 'Set gr֎up name',
    category: 'Group',
    usage: '.setgname t֎ change group name note: character limit will still not be exceeded',

    execute: async (sock, m, { args, reply }) => {

        if (!m.isGroup)
            return reply('✘ This command works only in groups');

        const newDesc = args.join(' ').trim();

        if (!newDesc)
            return reply('✪ Provide new name\n*`.setgname New group name`*');

        try {
            await sock.groupUpdateSubject(m.chat, newDesc);
            await reply('*✓ Gr֎up name updated*');

        } catch (err) {
            console.error('[SETDESC ERROR]', err?.message || err);

            let msg = '✘ Failed t֎ set name! Make sure you did not exceed character limit\n';

            if (err.message?.includes('admin') || err.message?.includes('permission')) {
                msg += 'Bot lacks admin permission';
            } else {
                msg += err.message || 'Unknown error';
            }

            reply(msg);
        }
    }
};