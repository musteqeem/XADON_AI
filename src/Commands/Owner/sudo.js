const fs   = require('fs')
const path = require('path')
const { getVar, setVar } = require('../../Plugin/configManager')

const ENV_PATH = path.join(process.cwd(), '.env')

// Clean number: remove +, spaces, and keep only digits
const cleanNumber = (num) => num.replace(/[^0-9]/g, '').trim()

// Saves to runtime + process.env + .env file
const saveSudo = (value) => {
    const cleaned = value.split(',')
        .map(cleanNumber)
        .filter(Boolean)
        .join(',')

    setVar('SUDO_NUMBERS', cleaned)
    process.env.SUDO_NUMBERS = cleaned

    try {
        if (!fs.existsSync(ENV_PATH)) {
            fs.writeFileSync(ENV_PATH, `SUDO_NUMBERS=${cleaned}\n`)
            return
        }

        const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n')
        let found = false

        const updated = lines.map(line => {
            if (line.trim().startsWith('SUDO_NUMBERS=')) {
                found = true
                return `SUDO_NUMBERS=${cleaned}`
            }
            return line
        })

        if (!found) updated.push(`SUDO_NUMBERS=${cleaned}`)
        fs.writeFileSync(ENV_PATH, updated.join('\n'))

    } catch (e) {
        console.error('[SUDO] .env write failed:', e.message)
    }
}

// Read clean list
const getList = () => {
    const fromEnv     = process.env.SUDO_NUMBERS || ''
    const fromRuntime = String(getVar('SUDO_NUMBERS') || '')

    const combined = [fromEnv, fromRuntime]
        .join(',')
        .split(',')
        .map(cleanNumber)
        .filter(Boolean)

    return [...new Set(combined)]
}

module.exports = {
    name: 'sudo',
    alias: ['addsudo', 'delsudo', 'sudolist'],
    desc: 'Manage sudo users with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '👑', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const sub  = args[0]?.toLowerCase()
        const list = getList()

        // .sudo list
        if (!sub || sub === 'list') {
            if (!list.length) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SUDO USERS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : EMPTY
│ ❏ Count : 0
╰─────────────────────────╯

Use:
֎.sudo add <number>
֎.sudo del <number>`
                )
            }

            const formatted = list
                .map((n, i) => `❏ ${i + 1}. +${n}`)
                .join('\n')

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SUDO USERS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ACTIVE
│ ❏ Count : ${list.length}
╰─────────────────────────╯
${formatted}

_Near-owner access enabled_`
            )
        }

        // .sudo add <number>
        if (sub === 'add') {
            let num = (args[1] || '').trim()
            if (!num) return reply('֎ Usage:.sudo add <number>\nExample:.sudo add 2347043550282')

            num = cleanNumber(num)
            if (!num) return reply('֎ Enter a valid phone number')

            if (list.includes(num)) {
                return reply(`֎ +${num} is already a sudo user`)
            }

            list.push(num)
            saveSudo(list.join(','))

            return reply(
`֎ Added +${num} to sudo users
_Works immediately - saved to .env_`
            )
        }

        // .sudo del / remove
        if (sub === 'del' || sub === 'remove') {
            let num = (args[1] || '').trim()
            if (!num) return reply('֎ Usage:.sudo del <number>\nExample:.sudo del 2347043550282')

            num = cleanNumber(num)
            if (!num) return reply('֎ Enter a valid phone number')

            const updated = list.filter(n => n !== num)

            if (updated.length === list.length) {
                return reply(`֎ +${num} is not a sudo user`)
            }

            saveSudo(updated.join(','))
            return reply(`֎ Removed +${num} from sudo users`)
        }

        // .sudo clear
        if (sub === 'clear') {
            saveSudo('')
            return reply('֎ All sudo users cleared')
        }

        // Help
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SUDO COMMANDS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
֎.sudo list → Show sudo users
֎.sudo add <number> → Add sudo
֎.sudo del <number> → Remove sudo
֎.sudo clear → Clear all sudo users`
        )
    }
}