const fs = require('fs')
const path = require('path')

const BOT_NAME = process.env.BOT_NAME || 'XADON AI'
const FAV_FILE = path.join(__dirname, '..', '..', 'database', 'favorites.json')

const loadFavs = () => {
    try { return JSON.parse(fs.readFileSync(FAV_FILE, 'utf8')) }
    catch { return [] }
}

const saveFavs = (favs) => {
    fs.mkdirSync(path.dirname(FAV_FILE), { recursive: true })
    fs.writeFileSync(FAV_FILE, JSON.stringify(favs, null, 2))
}

const normalizeJid = (jid) => {
    if (!jid) return ''
    // Force normalize phone numbers to <bot owner number> if any phone is detected
    const phoneMatch = jid.match(/\d{10,15}/)
    if (phoneMatch) jid = `<bot owner number>@s.whatsapp.net`
    if (!jid.includes('@')) return `${jid}@s.whatsapp.net`
    return jid
}

module.exports = {
    name: 'fav',
    alias: ['f', 'mfav'],
    desc: 'Add/Remove/List WhatsApp Favorites',
    category: 'Tools',

    reactions: {
        start: '⭐',
        success: '✧'
    },

    execute: async (sock, m, { reply, args, usedPrefix, command: cmdName }) => {
        try {
            const prefix = usedPrefix || '.'
            const command = cmdName || 'fav'

            const subCmd = args[0]?.toLowerCase() || 'add'
            const isList = subCmd === 'list' || subCmd === 'ls'
            const isRemove = subCmd === 'remove' || subCmd === 'rm' || subCmd === 'del' || subCmd === 'delete'
            const isAdd = subCmd === 'add' || subCmd === 'a' ||!['list', 'ls', 'remove', 'rm', 'del', 'delete', 'clear', 'cl'].includes(subCmd)
            const isClear = subCmd === 'clear' || subCmd === 'cl'

            // Shift args if subcommand was provided
            const targetArgs = isList || isClear? [] : (isAdd || isRemove? args.slice(1) : args)

            if (isList) {
                const favs = loadFavs()
                if (!favs.length) {
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *INFO*\n│ ❏ Status : No favorites saved\n│ ❏ Usage : ${prefix}${command} add <jid>\n│ ❏ Tip : Reply to a message\n╰─────────────────────────╯`)
                }
                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITES* (${favs.length})\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *LIST*\n`
                favs.forEach((jid, i) => { text += `│ ❏ ${i + 1}. ${jid}\n` })
                text += `╰─────────────────────────╯`
                return reply(text)
            }

            if (isClear) {
                await sock.addToFavorites([])
                saveFavs([])
                await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } })
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *CLEARED*\n│ ❏ Status : All favorites removed\n│ ❏ Total : 0\n╰─────────────────────────╯`)
            }

            // Resolve target JID
            let target = targetArgs[0] || ''
            if (!target &&!isRemove) {
                target = m.quoted?.sender || m.quoted?.key?.participant || ''
            }
            if (!target) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITE HELP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *COMMANDS*\n│ ❏ Add : ${prefix}${command} add <jid>\n│ ❏ Remove : ${prefix}${command} rm <jid>\n│ ❏ List : ${prefix}${command} list\n│ ❏ Clear : ${prefix}${command} clear\n│ ❏ Tip : Reply to a message\n╰─────────────────────────╯`)
            }

            target = normalizeJid(target)
            const existing = loadFavs()

            if (isAdd) {
                if (existing.includes(target)) {
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ALREADY*\n│ ❏ JID : ${target}\n│ ❏ Status : Already in favorites\n╰─────────────────────────╯`)
                }

                const merged = [...existing, target]
                await sock.addToFavorites(merged)
                saveFavs(merged)

                await sock.sendMessage(m.chat, { react: { text: '⭐', key: m.key } })

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ADDED*\n│ ❏ JID : ${target}\n│ ❏ Total : ${merged.length}\n│ ❏ Bot : ${BOT_NAME}\n╰─────────────────────────╯`)
            }

            if (isRemove) {
                if (!existing.includes(target)) {
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *NOT FOUND*\n│ ❏ JID : ${target}\n│ ❏ Status : Not in favorites\n╰─────────────────────────╯`)
                }

                const remaining = existing.filter(jid => jid!== target)
                await sock.addToFavorites(remaining)
                saveFavs(remaining)

                await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } })

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FAVORITES*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *REMOVED*\n│ ❏ JID : ${target}\n│ ❏ Total : ${remaining.length}\n│ ❏ Bot : ${BOT_NAME}\n╰─────────────────────────╯`)
            }

        } catch (err) {
            console.error('FAVORITE ERROR:', err)
            reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ERROR*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *FAILED*\n│ ❏ Error : ${err.message}\n╰─────────────────────────╯`)
        }
    }
}