module.exports = {
    name: 'leave',
    alias: ['exit', 'leavegc'],
    category: 'Group',
    desc: 'Leave the current gr֎up',
    owner: true,

    execute: async (sock, m, { reply }) => {

        try {
            await reply('✪ Leaving gr֎up...');

            await sock.groupLeave(m.chat);

            await reply('*✓ Successfully left*');

        } catch (err) {
            console.error('[LEAVE ERROR]', err);

            reply(
                '✘ Failed t֎ leave\n' +
                (err.message || 'Unknown error')
            );
        }
    }
};