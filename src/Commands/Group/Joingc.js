module.exports = {
    name: 'join',
    alias: ['entry', 'joingc'],
    category: 'Owner',
    desc: 'Join a gr֎up via invite link',
    ownerOnly: true,
    reactions: { start: '👣', success: '🫂' },

    execute: async (sock, m, { args, reply }) => {

        const raw = args.join(' ').trim() ||
                    m.quoted?.text?.trim() ||
                    m.quoted?.caption?.trim() || ''

        const match = raw.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/)

        if (!match) {
            return reply(
                '✦ *JOIN SYSTEM* ✦\n\n' +
                '✘ No valid WhatsApp group link found\n' +
                '✦ Usage:\n' +
                '*`.join https://chat.whatsapp.com/XXX`*\n' +
                'Reply t֎ a message containing the link'
            )
        }

        const code = match[1]

        try {
            await reply('✪ Joining group...')

            const groupId = await sock.groupAcceptInvite(code)

            let groupInfo = null
            try {
                groupInfo = await sock.groupMetadata(groupId)
            } catch (metaErr) {
                console.error('[METADATA FETCH ERROR]', metaErr.message)
            }

            let successMsg = '✓ *JOIN SUCCESS* ✓\n\n'

            if (groupInfo) {
                const memberCount = groupInfo.participants?.length || 'N/A'
                const description = groupInfo.desc || 'No description'

                successMsg +=
                    '*Group:* ' + (groupInfo.subject || 'Unknown') + '\n' +
                    '✦ Members: ' + memberCount + '\n' +
                    '✦ Group ID: ' + groupId + '\n\n' +
                    '✦ *Description:* \n' + description
            } else {
                successMsg +=
                    '✦ Joined successfully\n' +
                    'Group ID: ' + groupId + '\n\n' +
                    '✘ Could not fetch group details'
            }

            await reply(successMsg)

        } catch (err) {
            console.error('[JOIN ERROR]', err.message)

            const msg = err.toString()
            let reason =
                msg.includes('401')? 'Not authorized t֎ join this group' :
                msg.includes('404')? 'Invalid or revoked link' :
                msg.includes('408')? 'Request timed out - try again' :
                msg.includes('409')? 'Already a member of this group' :
                msg.includes('410')? 'Invite link has expired' :
                msg.includes('500')? 'WhatsApp server error - try again later' :
                err.message || 'Unknown error'

            reply(
                '✘ *JOIN FAILED* ✘\n\n' +
                reason + '\n\n' +
                'Code used: ' + code
            )
        }
    }
}