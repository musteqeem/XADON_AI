module.exports = {
    name: 'poll',
    alias: ['createpoll', 'vote'],
    desc: 'Create a WhatsApp native poll in a gr֎up',
    category: 'Group',
    groupOnly: true,
    reactions: { start: '📊', success: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {

        if (!args.length) {
            return reply(
                '✦ *POLL CREATOR* ✦\n\n' +
                '*Single choice (default):*\n' +
                '`' + prefix + 'poll Question | Option1 | Option2`\n\n' +
                '*Multi choice:*\n' +
                '`' + prefix + 'poll multi Question | Option1 | Option2`\n\n' +
                '✪ Min 2 options, max 12 options'
            )
        }

        let isMulti = false
        let fullText = args.join(' ').trim()

        if (fullText.toLowerCase().startsWith('multi ')) {
            isMulti = true
            fullText = fullText.slice(6).trim()
        }

        const parts = fullText.split('|').map(p => p.trim()).filter(Boolean)

        if (parts.length < 3) {
            return reply(
                '✘ Need at least a question and 2 options\n' +
                'Example: ' + prefix + 'poll Who is best? | Ronaldo | Messi | Mbappe'
            )
        }

        const question = parts[0]
        const options = parts.slice(1)

        if (options.length > 12) {
            return reply('✘ Maximum 12 options allowed')
        }

        for (const opt of options) {
            if (opt.length > 100) return reply('✘ Option too long: "' + opt.slice(0, 20) + '..."')
        }

        if (question.length > 255) return reply('✘ Question too long (max 255 characters)')

        try {
            await sock.sendMessage(m.chat, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: isMulti? 0 : 1
                }
            }, { quoted: m })
        } catch (err) {
            console.error('[POLL ERROR]', err.message)
            reply('✘ Failed t֎ create poll: ' + err.message)
        }
    }
}