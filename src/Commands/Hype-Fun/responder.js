const BOT_NAME = process.env.BOT_NAME || 'XADON';

module.exports = {
    name: 'xadon',
    alias: ['xad', 'xadon!', 'x!'],
    desc: 'XADON signature + Defense AI + Hack simulation',
    category: 'fun',
    usage: '.xadon [hack <target>]',
    reactions: { start: '⚡', success: '🛡️', hack: '💀', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const subCmd = args[0]?.toLowerCase();

        // ── HACK SIMULATION MODE ──
        if (subCmd === 'hack' && args[1]) {
            const target = args.slice(1).join(' ');
            await sock.sendMessage(m.chat, { react: { text: '💀', key: m.key } });

            const steps = [
                `Initializing ${BOT_NAME} Hack Module...`,
                `Scanning target: ${target}`,
                `Bypassing firewall... [■■■■□□□□] 40%`,
                `Injecting payload... [■■■■■■□□] 60%`,
                `Cracking encryption... [■■■■■■■■□] 80%`,
                `Root access: GRANTED`,
                `Downloading data... [■■■■■■■■■■] 100%`,
                `Wiping logs... Done`,
                `Mission Complete. ${target} is owned.`
            ];

            await reply(`*֎ ${BOT_NAME} HACK SEQUENCE INITIATED*`);

            for (let i = 0; i < steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 600)); // delay for effect
                await reply(`\`\`\`[${i+1}/${steps.length}] ${steps[i]}\`\`\``);
            }

            await sock.sendMessage(m.chat, { react: { text: '🛡️', key: m.key } });
            return reply(`_*⚠️ This is a simulation. ${BOT_NAME} does not hack real systems*_`);
        }

        // ── DEFAULT XADON SIGNATURE ──
        try {
            const reactions = ['⚡', '🛡️', '💀', '🤖', '🔥', '👁️', '🧠'];
            const randomReact = reactions[Math.floor(Math.random() * reactions.length)];
            await sock.sendMessage(m.chat, { react: { text: randomReact, key: m.key } });

            const replies = [
                `${BOT_NAME} Defense Grid activated — perimeter secured 🛡️`,
                `Threat level: 0%. ${BOT_NAME} is watching 👁️`,
                `${BOT_NAME} online — Firewalls up. You’re safe.`,
                `Intrusion detected? ${BOT_NAME} already neutralized it 💀`,
                `${BOT_NAME} Protocol: Protect. Detect. Destroy.`,
                `All systems nominal. ${BOT_NAME} guarding the network ⚡`,
                `${BOT_NAME} AI Sentinel active. No breaches found.`,
                `Encryption: 512-bit. Crackable? Not by them.`,
                `${BOT_NAME} scanning... No malware. You’re clean.`,
                `Defense mode: MAXIMUM. ${BOT_NAME} never sleeps.`,
                `${BOT_NAME} breached the matrix — jkjk, I built it 🔥`,
                `Ping: 1ms. Exploit: 0. ${BOT_NAME} runs this.`,
                `${BOT_NAME} in root. Permission: GRANTED.`,
                `Running nmap... 1 host found: YOU 😎`,
                `${BOT_NAME} decompiled your vibes. 10/10 code.`,
                `SQL Injection? Blocked. XSS? Blocked. ${BOT_NAME}? Unstoppable.`,
                `${BOT_NAME} AI Core: Overclocked to 9000GHz ⚡`,
                `Packet sniffer active. I see everything 👁️`,
                `${BOT_NAME} kernel patch applied. System hardened.`,
                `Zero-day? ${BOT_NAME} patched it yesterday.`,
                `${BOT_NAME} has entered the chat — bow down 🙌`,
                `You summoned ${BOT_NAME}. The legend responds.`,
                `${BOT_NAME} power level: UNMEASURABLE`,
                `Loading ${BOT_NAME}... 100% Complete ✅`,
                `${BOT_NAME} sees all, knows all, roasts all 💀`,
                `Mission: Dominate. Status: ${BOT_NAME} online 🤖`,
                `${BOT_NAME} AI — smarter than your WiFi router`,
                `Alert: ${BOT_NAME} detected unmatched aura`,
                `${BOT_NAME} reporting for duty, Boss.`,
                `System override. ${BOT_NAME} is now in control.`
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];

            const loadingBars = [
                `[■□□□□] 10%`, `[■■■□□□□□□] 30%`, `[■■■■■□□] 50%`,
                `[■■■■■■■□□□] 70%`, `[■■■■■□] 90%`, `[■■■■■■■■■■] 100% BOOT COMPLETE`
            ];
            const randomBar = loadingBars[Math.floor(Math.random() * loadingBars.length)];

            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit', second: '2-digit',
                hour12: true, timeZone: 'Africa/Lagos'
            }).toLowerCase();

            const finalMsg =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} SYSTEM*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SYSTEM RESPONSE*
│ ❏ ${randomReply}
│
│ ❏ Boot Status : ${randomBar}
│ ❏ Time : ${timeStr} WAT
╰─────────────────────────╯

_*💡 Use ${prefix}xadon hack <target> for simulation*_
_*🛡️ ${BOT_NAME} — Defending your digital world*_`;

            await reply(finalMsg);

        } catch (err) {
            console.error(`[${BOT_NAME} ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ XADON glitched. Firewall reset required*_');
        }
    }
};