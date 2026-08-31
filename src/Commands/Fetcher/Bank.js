const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env

module.exports = {
    name: 'bank',
    alias: ['aza','account','sendaza','setbank','setaza'],
    category: 'Tools',
    desc: '🏦 View or set bank account details',
    usage: '.setbank <bank> <acc> <name> [phone] [note] |.bank',
    reactions: { start: '🏦', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {

        if (!global.bankDetails) {
            global.bankDetails = {
                bankName: '',
                accNumber: '',
                accName: '',
                phone: '',
                note: '',
                setBy: ''
            }
        }

        await sock.sendMessage(m.chat, { react: { text: '🏦', key: m.key } });

        const command = m.text.split(' ')[0].toLowerCase().replace(prefix,'')
        const isSet = ['setbank','setaza'].includes(command)

        if (isSet) {
            if (args.length < 3) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} BANK SETUP 🏦*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO SET*
│ ❏ Command : ${prefix}${command} <Bank> <AccNumber> <AccName> [Phone] [Note]
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}${command} Opay 8123456789 John Doe 08012345678 Donation
╰─────────────────────────╯

_*💡 Set your payment details for customers*_`
                )
            }

            global.bankDetails.bankName = args[0]
            global.bankDetails.accNumber = args[1]
            const remaining = args.slice(2)

            global.bankDetails.accName = remaining.slice(0, remaining.length - (remaining.length > 2? 2 : 0)).join(' ')
            global.bankDetails.phone = remaining.length > 2? remaining[remaining.length - 2] : ''
            global.bankDetails.note = remaining.length > 2? remaining[remaining.length - 1] : ''
            global.bankDetails.setBy = m.sender.split('@')[0]

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} BANK UPDATED ✅*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📊 ACCOUNT DETAILS*
│ ❏ Set By : ${m.sender.split('@')[0]}
│
│ ❏ 🏦 Bank : ${global.bankDetails.bankName}
│ ❏ 💳 Number : ${global.bankDetails.accNumber}
│ ❏ 👤 Name : ${global.bankDetails.accName}
${global.bankDetails.phone? `│ ❏ 📱 Phone : ${global.bankDetails.phone}\n` : ''}${global.bankDetails.note? `│ ❏ 📝 Note : ${global.bankDetails.note}\n` : ''}╰─────────────────────────╯

_*✅ Details saved successfully*_`
            )
        }

        if (!global.bankDetails.accNumber) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply(`_*❌ No bank account set yet\n💡 Use ${prefix}setbank to add one*_`)
        }

        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        let msg =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} BANK DETAILS 🏦*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *💳 PAYMENT INFO*
│ ❏ 🏦 Bank : ${global.bankDetails.bankName}
│ ❏ 💳 Account : ${global.bankDetails.accNumber}
│ ❏ 👤 Name : ${global.bankDetails.accName}
`

        if (global.bankDetails.phone)
            msg += `│ ❏ 📱 Phone : ${global.bankDetails.phone}\n`

        if (global.bankDetails.note)
            msg += `│ ❏ 📝 Note : ${global.bankDetails.note}\n`

        if (global.bankDetails.setBy)
            msg += `│ ❏ 👮 Set By : ${global.bankDetails.setBy}\n`

        msg += `╰─────────────────────────╯\n\n_*📋 Copy & send to customers | ${BOT_NAME}*_`

        reply(msg)
    }
}