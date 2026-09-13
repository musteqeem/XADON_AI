const axios = require('axios')

module.exports = {
    name: 'wss',
    alias: ['wssp','wsstab','wssfull','wssmobile','wssweb'],
    category: 'Tools',
    desc: 'Capture website screenshot',
    usage: '.wss <url> |.wssmobile <url> |.wssfull <url> |.wsstab <url>',
    reactions: { start: '📸', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        try {
            const cmd = m.body.toLowerCase().split(/\s+/)[0].slice(1)

            const sources = [
                args.join(' '),
                m.quoted?.body || '',
                m.quoted?.text || '',
                m.quoted?.caption || ''
            ].join(' ').trim()

            if (!sources.trim()) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
  • WEBSITE SCREENSHOT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.wss <url> → desktop
│ ❏.wssmobile <url> → phone
│ ❏.wsstab <url> → tablet
│ ❏.wssfull <url> → full page
│
│ ❏ Supports multiple URLs
╰─────────────────────────╯`
                )
            }

            const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g
            const rawMatches = sources.match(urlRegex) || []

            const urls = [...new Set(
                rawMatches.map(u =>!/^https?:\/\//i.test(u)? 'https://' + u : u)
            )]

            if (!urls.length) return reply('✘ No valid urls found')

            await sock.sendMessage(m.chat, { react: { text: '📸', key: m.key } })

            let device = 'desktop'
            if (cmd === 'wssp' || cmd === 'wssmobile') device = 'phone'
            if (cmd === 'wsstab') device = 'tablet'
            if (cmd === 'wssfull') device = 'full'

            for (const targetUrl of urls) {
                try {
                    const api = `https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(targetUrl)}&device=${device}`
                    const res = await axios.get(api, { responseType: 'arraybuffer' })
                    const buffer = Buffer.from(res.data)

                    await sock.sendMessage(m.chat, {
                        image: buffer,
                        headerText: `## ◈ Website Screenshot`,
                        contentText: '---',
                        title: `◈ ${device.toUpperCase()}`,
                        footerText: targetUrl
                    }, { quoted: m })
                } catch (err) {
                    reply(`✘ Failed for: ${targetUrl}`)
                }
            }

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } })

        } catch (err) {
            console.error('[WSS ERROR]', err.message)
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } })
            reply('✘ error')
        }
    }
}