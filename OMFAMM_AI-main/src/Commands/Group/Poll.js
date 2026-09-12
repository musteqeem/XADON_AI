const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

module.exports = {
    name:     'poll',
    alias:    ['createpoll', 'vote'],
    desc:     'Create a WhatsApp native poll in a group',
    category: 'Group',
    groupOnly: true,
    reactions: { start: '📊', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {

        await sock.sendMessage(m.chat, { react: { text: '📊', key: m.key } });

        // ── Parse input ────────────────────────────────────────
        // Format: .poll Question | Option1 | Option2 | Option3
        // Or:     .poll multi Question | Option1 | Option2 (multi-select)
        if (!args.length) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} POLL CREATOR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Single Choice:
│   ${prefix}poll Question | Opt1 | Opt2
│ 
│ ❏ Multi Choice:
│   ${prefix}poll multi Question | Opt1 | Opt2
│
│ ❏ Rules:
│   • Min: 2 options
│   • Max: 12 options
╰─────────────────────────╯

_*📊 Create polls easily with ${BOT_NAME}*_

Note: Send options separated by |`
            )
        }

        let isMulti = false
        let fullText = args.join(' ').trim()

        if (fullText.toLowerCase().startsWith('multi ')) {
            isMulti  = true
            fullText = fullText.slice(6).trim()
        }

        const parts = fullText.split('|').map(p => p.trim()).filter(Boolean)

        if (parts.length < 3) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply(
`_*❌ Invalid Format*_

Need at least 1 question + 2 options
Example: ${prefix}poll Who is best? | Ronaldo | Messi | Mbappe`
            )
        }

        const question = parts[0]
        const options  = parts.slice(1)

        if (options.length > 12) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply('_*❌ Maximum 12 options allowed*_')
        }

        // Validate option length
        for (const opt of options) {
            if (opt.length > 100) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(`_*❌ Option too long*_ \n"${opt.slice(0, 20)}..."`)
            }
        }

        if (question.length > 255) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply('_*❌ Question too long. Max 255 characters*_')
        }

        // ── Send native WhatsApp poll ──────────────────────────
        try {
            await sock.sendMessage(m.chat, {
                poll: {
                    name:            question,
                    values:          options,
                    selectableCount: isMulti ? 0 : 1  // 0 = unlimited (multi), 1 = single
                }
            }, { quoted: m })

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[POLL ERROR]', err.message)
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`_*❌ Failed to create poll*_ \n${err.message}`)
        }
    }
}