
const fs   = require('fs')
const path = require('path')
const { getVar, setVar } = require('../../Plugin/configManager')

const ENV_PATH = path.join(process.cwd(), '.env')

// Clean number: remove +, spaces, and keep only digits
const cleanNumber = (num) => num.replace(/[^0-9]/g, '').trim()

// Saves to runtime + process.env + .env file
const saveDual = (value) => {
    const cleaned = value.split(',')
        .map(cleanNumber)
        .filter(Boolean)
        .join(',')

    setVar('DUAL_NUMBERS', cleaned)
    process.env.DUAL_NUMBERS = cleaned

    try {
        if (!fs.existsSync(ENV_PATH)) {
            fs.writeFileSync(ENV_PATH, `DUAL_NUMBERS=${cleaned}\n`)
            return
        }

        const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n')
        let found = false

        const updated = lines.map(line => {
            if (line.trim().startsWith('DUAL_NUMBERS=')) {
                found = true
                return `DUAL_NUMBERS=${cleaned}`
            }
            return line
        })

        if (!found) updated.push(`DUAL_NUMBERS=${cleaned}`)
        fs.writeFileSync(ENV_PATH, updated.join('\n'))

    } catch (e) {
        console.error('[XDN DUAL] .env write failed:', e.message)
    }
}

// Read clean list
const getList = () => {
    const fromEnv     = process.env.DUAL_NUMBERS || ''
    const fromRuntime = String(getVar('DUAL_NUMBERS') || '')

    const combined = [fromEnv, fromRuntime]
        .join(',')
        .split(',')
        .map(cleanNumber)
        .filter(Boolean)

    return [...new Set(combined)]
}

module.exports = {
    name: 'dual',
    alias: ['adddual', 'deldual', 'duallist'],
    desc: 'Manage dual users with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '🔖', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase()
        const list = getList()

        // .dual list
        if (!sub || sub === 'list') {
            if (!list.length) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • DUAL USERS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : EMPTY
│ ❏ Count : 0
╰─────────────────────────╯

Use:
֎.dual add <number>
֎.dual del <number>

> ֎`
                )
            }

            const formatted = list
                .map((n, i) => `❏ ${i + 1}. +${n}`)
                .join('\n')

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • DUAL USERS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ACTIVE
│ ❏ Count : ${list.length}
│ ❏ Access : FULL OWNER
╰─────────────────────────╯
${formatted}

> ֎`
            )
        }

        // .dual add <number>
        if (sub === 'add') {
            let num = (args[1] || '').trim()
            if (!num) return reply('֎ Usage:.dual add <number>\nExample:.dual add 2347043550282')

            num = cleanNumber(num)
            if (!num) return reply('֎ Enter a valid phone number')

            if (list.includes(num)) {
                return reply(`֎ +${num} is already a dual user`)
            }

            list.push(num)
            saveDual(list.join(','))

            return reply(
`֎ Added +${num} to dual users
_Full owner-level access enabled_`
            )
        }

        // .dual del / remove
        if (sub === 'del' || sub === 'remove') {
            let num = (args[1] || '').trim()
            if (!num) return reply('֎ Usage:.dual del <number>\nExample:.dual del 2347043550282')

            num = cleanNumber(num)
            if (!num) return reply('֎ Enter a valid phone number')

            const updated = list.filter(n => n !== num)

            if (updated.length === list.length) {
                return reply(`֎ +${num} is not a dual user`)
            }

            saveDual(updated.join(','))
            return reply(`֎ Removed +${num} from dual users`)
        }

        // .dual clear
        if (sub === 'clear') {
            saveDual('')
            return reply('֎ All dual users cleared')
        }

        // Help
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • DUAL COMMANDS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ .dual list → Show dual users
│ ❏ .dual add <number> → Add dual
│ ❏ .dual del <number> → Remove dual
│ ❏ .dual clear → Clear all dual users
╰─────────────────────────╯

> ֎`
        )
    }
}