module.exports = {
    name: 'bank',
    alias: ['aza', 'account', 'sendaza', 'setbank', 'setaza'],
    category: 'Tools',
    desc: 'View or set bank account details',
    usage: '.bank |.setbank <bank> <number> <name> [phone] [note]',
    reactions: { start: '💱', success: '✨', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {

        if (!global.bankDetails) {
            global.bankDetails = {
                bankName: '',
                accNumber: '',
                accName: '',
                phone: '',
                note: '',
                setBy: ''
            };
        }

        const command = m.text.split(' ')[0].toLowerCase().replace(prefix, '');
        const isSet = ['setbank', 'setaza'].includes(command);

        if (isSet) {
            if (args.length < 3) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • AZA SETUP •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}${command} Bank Number Name [Phone] [Note]
│
│ ❏ Example : ${prefix}${command} Opay 8123456789 John 080 Donation
╰─────────────────────────╯`
                );
            }

            global.bankDetails.bankName = args[0];
            global.bankDetails.accNumber = args[1];

            const remaining = args.slice(2);
            global.bankDetails.accName = remaining.slice(0, remaining.length - (remaining.length > 2? 2 : 0)).join(' ');
            global.bankDetails.phone = remaining.length > 2? remaining[remaining.length - 2] : '';
            global.bankDetails.note = remaining.length > 2? remaining[remaining.length - 1] : '';
            global.bankDetails.setBy = m.sender.split('@')[0];

            await sock.sendMessage(m.chat, { react: { text: '💱', key: m.key } });

            const tableData = [
                ['Bank', global.bankDetails.bankName],
                ['Number', global.bankDetails.accNumber],
                ['Name', global.bankDetails.accName]
            ];

            if (global.bankDetails.phone) tableData.push(['Phone', global.bankDetails.phone]);
            if (global.bankDetails.note) tableData.push(['Note', global.bankDetails.note]);
            tableData.push(['Set By', global.bankDetails.setBy]);

            await sock.sendMessage(m.chat, {
                headerText: `## ◈ AZA Updated`,
                contentText: '---',
                title: '◈ Bank Details',
                table: tableData,
                footerText: '💡 Use.bank to view |.setbank to update'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return;
        }

        if (!global.bankDetails.accNumber) {
            return reply(`✘ No AZA set yet\nUse ${prefix}setbank to add one`);
        }

        await sock.sendMessage(m.chat, { react: { text: '💱', key: m.key } });

        const tableData = [
            ['Bank', global.bankDetails.bankName],
            ['Account', global.bankDetails.accNumber],
            ['Name', global.bankDetails.accName]
        ];

        if (global.bankDetails.phone) tableData.push(['Phone', global.bankDetails.phone]);
        if (global.bankDetails.note) tableData.push(['Note', global.bankDetails.note]);
        if (global.bankDetails.setBy) tableData.push(['Set By', global.bankDetails.setBy]);

        await sock.sendMessage(m.chat, {
            headerText: `## ◈ AZA / Bank Details`,
            contentText: '---',
            title: '◈ Account Info',
            table: tableData,
            footerText: '💡 Copy & share easily |.setbank to update'
        }, { quoted: m });

        await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
    }
};