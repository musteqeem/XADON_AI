// =============================================
// AUTO NEWS - AUTO FOLLOW + AUTO REACT CHANNELS
// =============================================

const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const CONFIG_PATH = path.join(process.cwd(), 'database', 'autonews.json');
const FORCE_CHANNEL = '120363402922206865@newsletter'; // Change this

const defaultConfig = {
    additionalChannels: [],
    seenMessages: {},
    maxSeen: 500
};

let config = {...defaultConfig };
try {
    if (fs.existsSync(CONFIG_PATH)) {
        config = {...defaultConfig,...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
    }
} catch {}

function saveConfig() {
    try {
        if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
            fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        }
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch {}
}

function getAllChannels() {
    const channels = [FORCE_CHANNEL];
    for (const ch of config.additionalChannels) {
        if (ch && ch!== FORCE_CHANNEL &&!channels.includes(ch)) {
            channels.push(ch);
        }
    }
    return channels;
}

function smartEmoji(message) {
    if (!message) return '❤️';
    if (message.imageMessage) return '🔥';
    if (message.videoMessage || message.ptvMessage) return '🚀';
    if (message.audioMessage) return '🎧';
    if (message.stickerMessage) return '😍';
    if (message.documentMessage) return '📄';
    if (message.pollCreationMessage) return '📊';
    if (message.extendedTextMessage?.text?.includes('http')) return '🔗';
    if ((message.extendedTextMessage?.text?.length || 0) > 100) return '📝';
    if (message.conversation || message.extendedTextMessage?.text) return '💛';
    return '✨';
}

async function isFollowing(sock, jid) {
    try {
        const following = await sock.newsletterSubscribed();
        if (!following ||!Array.isArray(following)) return false;
        return following.some(ch => ch.id === jid || ch.jid === jid);
    } catch {
        return false;
    }
}

async function followChannel(sock, jid, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            if (!sock.user) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempt++;
                continue;
            }
            const following = await isFollowing(sock, jid);
            if (following) return true;
            await sock.newsletterFollow(jid);
            return true;
        } catch (err) {
            attempt++;
            if (err.message?.includes('rate') || err.message?.includes('429')) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else return false;
        }
    }
    return false;
}

async function followAllChannels(sock, channels) {
    let followed = 0;
    for (const ch of channels) {
        const following = await isFollowing(sock, ch);
        if (!following) {
            const ok = await followChannel(sock, ch);
            if (ok) followed++;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

let pollIntervalId = null;
let refollowIntervalId = null;
let isStarted = false;

async function startAutoNews(sock) {
    if (isStarted) return;

    await new Promise(resolve => {
        if (sock.user) return resolve();
        sock.ev.on('connection.update', function handler(update) {
            if (update.connection === 'open') {
                sock.ev.off('connection.update', handler);
                resolve();
            }
        });
    });

    isStarted = true;
    stopAutoNews();

    const channels = getAllChannels();
    await followAllChannels(sock, channels);

    for (const ch of channels) {
        if (!config.seenMessages[ch]) config.seenMessages[ch] = [];
    }
    saveConfig();

    // Refollow every 5s
    refollowIntervalId = setInterval(async () => {
        if (!sock.user) return;
        const allChannels = getAllChannels();
        await followAllChannels(sock, allChannels);
    }, 5000);

    // Poll messages every 60s
    pollIntervalId = setInterval(async () => {
        if (!sock.user) return;
        for (const ch of channels) {
            try {
                const data = await sock.newsletterFetchMessages(ch, 10, 0, 0);
                if (!data?.messages?.length) continue;

                const seen = config.seenMessages[ch] || [];
                for (const msg of data.messages) {
                    const msgId = msg.key?.id;
                    if (!msgId || seen.includes(msgId)) continue;

                    seen.push(msgId);
                    if (seen.length > config.maxSeen) seen.shift();

                    const emoji = smartEmoji(msg.message);
                    try {
                        await sock.newsletterReactMessage(ch, msgId, emoji);
                    } catch (e) {
                        if (!e.message?.includes('rate')) {}
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                config.seenMessages[ch] = seen;
                saveConfig();
            } catch (err) {
                if (!err.message?.includes('Connection Closed') &&
                   !err.message?.includes('Socket closed') &&
                   !err.message?.includes('Timed Out')) {}
            }
        }
    }, 60000);
}

function stopAutoNews() {
    if (pollIntervalId) clearInterval(pollIntervalId);
    if (refollowIntervalId) clearInterval(refollowIntervalId);
    pollIntervalId = null;
    refollowIntervalId = null;
    isStarted = false;
}

module.exports = {
    name: 'autonews',
    alias: ['anews', 'newsbot'],
    desc: 'Manage auto-react channels - force channel always active',
    category: 'Owner',
    ownerOnly: true,
    usage: `.autonews on <jid> → Add channel\n.autonews off <jid> → Remove channel\n.autonews list → Show channels\n.autonews restart → Restart\n.autonews check → Force re-follow`,
    examples: ['.autonews on 120363xxx@newsletter', '.autonews list', '.autonews restart'],
    reactions: { start: '⚙️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase();

        //.autonews on <jid>
        if (sub === 'on' && args[1]) {
            const jid = args[1];
            if (!jid.includes('@newsletter')) return reply(`✘ Invalid newsletter JID`);
            if (config.additionalChannels.includes(jid)) return reply(`✘ Channel already tracked`);

            config.additionalChannels.push(jid);
            saveConfig();
            stopAutoNews();
            await startAutoNews(sock);

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO-NEWS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CHANNEL ADDED*
│ ❏ JID : ${jid}
│
╭─֎ *SETTINGS*
│ ❏ Force : ${FORCE_CHANNEL}
│ ❏ Extra : ${config.additionalChannels.length}
│ ❏ Auto re-follow : ON
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        //.autonews off <jid>
        if (sub === 'off' && args[1]) {
            const jid = args[1];
            if (jid === FORCE_CHANNEL) return reply(`✘ Cannot remove force channel`);

            config.additionalChannels = config.additionalChannels.filter(c => c!== jid);
            saveConfig();
            stopAutoNews();
            await startAutoNews(sock);

            return reply(`✓ Channel removed: ${jid}`);
        }

        //.autonews list / status
        if (sub === 'list' || sub === 'status') {
            const allChannels = getAllChannels();
            let text =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} TRACKED CHANNELS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CHANNELS*
│ ❏ Force : ${FORCE_CHANNEL}\n`;

            if (config.additionalChannels.length > 0) {
                text += `│\n│ ❏ Extra :\n`;
                config.additionalChannels.forEach((ch, i) => {
                    text += `│ ${i + 1}. ${ch}\n`;
                });
            }
            text += `│\n│ ❏ Total : ${allChannels.length}\n`;
            text += `│ ❏ Auto re-follow : ON\n`;
            text += `│ ❏ Check interval : 60s\n`;
            text += `╰─────────────────────────╯\n_Powered by ${BOT_NAME}_`;

            return reply(text);
        }

        //.autonews restart
        if (sub === 'restart') {
            stopAutoNews();
            await startAutoNews(sock);
            return reply(`✓ Auto-News restarted`);
        }

        //.autonews check / refollow
        if (sub === 'check' || sub === 'refollow') {
            const allChannels = getAllChannels();
            await followAllChannels(sock, allChannels);
            return reply(`✓ Checked ${allChannels.length} channel(s) and re-followed`);
        }

        // Help
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO-NEWS HELP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}autonews on <jid> → Add channel
│ ❏ ${prefix}autonews off <jid> → Remove
│ ❏ ${prefix}autonews list → Show all
│ ❏ ${prefix}autonews restart → Restart
│ ❏ ${prefix}autonews check → Re-follow all
│
╭─֎ *INFO*
│ ❏ Force channel always active
│ ❏ Auto reacts with smart emoji
│ ❏ Checks every 60 seconds
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    },

    startAutoNews,
    stopAutoNews,
    FORCE_CHANNEL
};