const { getByCategory, getAll } = require('../../Plugin/xdnCmd');
const os = require('os');
const fs = require('fs');
const path = require('path');
const readMore = String.fromCharCode(8206).repeat(4000); // 4000 is safe limit

// ADDED: Custom image and audio from.env with fallbacks
const DEFAULT_IMAGE = path.join(__dirname, '../../../thumbnail/image.jpg');
const DEFAULT_AUDIO = path.join(__dirname, '../../../thumbnail/xadon.mp3');
const MENU_IMAGE = process.env.MENU_IMAGE || DEFAULT_IMAGE;
const MENU_AUDIO = process.env.MENU_AUDIO || DEFAULT_AUDIO;

// ── ADDED: 26 FANCY TECH UNICODES MAPPED TO EACH CATEGORY ──
const CATEGORY_ICONS_MAP = {
    'admin': '⚜️',
    'ai': '🧠',
    'anime': '⧬',
    'anomaly': '⧭',
    'art': '🎨',
    'asset': '🗄️',
    'bot': '🤖',
    'community': '🏘️',
    'converter': '⧮',
    'core': '֎',
    'dev-centre': '🌚',
    'documents': '📜',
    'economy': '💎',
    'emote': '✨',
    'engine': '⚙️',
    'fetcher': '⟁',
    'games': '🎮',
    'group': '👥',
    'hype-fun': '🔥',
    'media-modifier': '🎬',
    'owner': '👑',
    'privacy': '🔒',
    'rando': '🎲',
    'search': '🔍',
    'tools': '🧰',
    'trivia': '❓',
    'utility': '⧉',
    'voice': '🎙️',
    'whatsapp business': '💼'
};

// Fallback function for safety
const getCategoryIcon = (catName) => {
    return CATEGORY_ICONS_MAP[catName.toLowerCase()] || '⧫';
};

module.exports = {
    name: 'menu',
    alias: ['help', 'main', 'list'],
    desc: 'View all Bot commands',
    category: 'General',
    usage: '.menu |.menu list |.menu <category>',
    reactions: { start: '📜', success: '✨', error: '❔' },

    execute: async (sock, m, { args, prefix }) => {
        const chatId = m.key.remoteJid;
        const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

        try {
            await sock.sendMessage(chatId, { react: { text: '📜', key: m.key } });

            const allCommands = getAll();
            const categories = getByCategory();

            if (!allCommands || allCommands.size === 0) {
                return sock.sendMessage(chatId, { text: '✘ No commands found' }, { quoted: m });
            }

            const sub = args[0]?.toLowerCase();

            // ── STATS ──
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const phone = m.sender.split('@')[0];
            const pushName = m.pushName || 'User';
            const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024 / 1024).toFixed(2);
            const ramTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

            // ── LAGOS TIME ──
            const nowLagos = new Date();
            const dayName = nowLagos.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Lagos' });
            const dayNum = nowLagos.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'Africa/Lagos' });
            const month = nowLagos.toLocaleDateString('en-US', { month: 'long', timeZone: 'Africa/Lagos' });
            const year = nowLagos.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'Africa/Lagos' });
            const timeLagos = nowLagos.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });

            // ── HEADER ── PREMIUM ROYAL UNICODE
            let header = `╭─⭓ 𓆩⚜️𓆪 *֎•${BOT_NAME}* 𓆩⚜️𓆪 ⭔─╮\n`;
            header += `┃ ⫷⫸ ⫷⫸ ⫷⫸ ⫷⫸ ⫷⫸\n`;
            header += `┃ 𒆜 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗕𝗮𝗰𝗸, *${pushName}* 𒆜\n`;
            header += `┃ ⫷⫸ ⫷⫸ ⫷⫸ ⫷⫸ ⫷⫸\n`;
            header += `⌬───❖──➫───➫──✯──➫───➫ ────❖────⌬\n`;
            header += `❒ ✦┃ 𝗡𝘂𝗺𝗯𝗲𝗿 : +${phone}\n`;
            header += `❒ ✦┃ 𝗣𝗿𝗲𝗳𝗶𝘅 : [ ${prefix} ]\n`;
            header += `❒ ✦┃ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 : ${allCommands.size}\n`;
            header += `❒ ✦┃ 𝗨𝗽𝘁𝗶𝗺𝗲 : ${hours}h ${minutes}m\n`;
            header += `❒ ✦┃ 𝗥𝗔𝗠 : ${ramUsed}GB / ${ramTotal}GB\n`;
            header += `❒ ✦┃ 𝗗𝗮𝘆 : ${dayName} ⏚\n`;
            header += `❒ ✦┃ 𝗗𝗮𝘁𝗲 : ${dayNum} ${month} ${year}\n`;
            header += `❒ ✦┃ 𝗧𝗶𝗺𝗲 : ${timeLagos} 〔𝗟𝗮𝗴𝗼𝘀〕\n`;
            header += `╰❖──────⌬───────✯───────⌬───────❖╯\n\n`;
            header += `${readMore}\n`;

            let menu = '';

            // ── SUBCOMMAND: LIST ──
            if (sub === 'list' || sub === 'categories') {
                menu = header;
                menu += `━━〔 *AVAILABLE CATEGORIES* 〕━━━\n`;
                const catNames = Object.keys(categories);
                catNames.forEach((cat) => {
                    const icon = getCategoryIcon(cat);
                    menu += `❏◦ ${icon} ➫ ${cat.toUpperCase()} [${categories[cat].length}]\n`;
                });
                menu += `\n━━━✯━━━━✯━━━━━✯━━━━━━━━━🜲\n`;
                menu += `💡 Use *${prefix}menu <category>* to view commands\n`;
                menu += `⌬ ══〔 𓆩 *${BOT_NAME}* 𓆪 〕══ ⌬`;
            }

            // ── SUBCOMMAND: SINGLE CATEGORY ──
            else if (sub && categories[sub]) {
                const cmds = categories[sub];
                const seen = new Set();
                let commandList = '';
                const icon = getCategoryIcon(sub);

                for (const c of cmds) {
                    if (!c?.name || seen.has(c.name.toLowerCase())) continue;
                    seen.add(c.name.toLowerCase());
                    commandList += `⌘ ➫ ✦┃${prefix}${c.name}\n`;
                }

                menu = header;
                menu += `━━〔 ${icon} ${sub.toUpperCase()} ${icon} 〕━━━\n`;
                menu += `❏┃ ✯━━━━━━━✯━━━━━━✯━━━━━\n`;
                menu += `${commandList}`;
                menu += `━━━✯━━━━✯━━━━━✯━━━━━━━━━🜲\n\n`;
                menu += `💡 Use *${prefix}menu* for full menu\n`;
                menu += `⌬ ══〔 𓆩 *${BOT_NAME}* 𓆪 〕══ ⌬`;
            }

            // ── DEFAULT: FULL MENU WITH COLLAPSE ──
            else {
                menu = header;
                menu += `✨ *❖ Welcome to ${BOT_NAME} ❖*\n\n`;

                const catNames = Object.keys(categories);
                catNames.forEach((cat) => {
                    const cmds = categories[cat];
                    const icon = getCategoryIcon(cat);
                    const seen = new Set();
                    let commandList = '';

                    for (const c of cmds) {
                        if (!c?.name || seen.has(c.name.toLowerCase())) continue;
                        seen.add(c.name.toLowerCase());
                        commandList += `⌘ ➫ ✦┃${prefix}${c.name}\n`;
                    }

                    if (commandList) {
                        menu += `━━〔 ${icon} ${cat.toUpperCase()} 〕━━━\n`;
                        menu += `❏┃ ✯━━━━━━━✯━━━━━━✯━━━━━\n`;
                        menu += `${commandList}`;
                        menu += `⌬━━━━━✯━━━━━━❖━━━━━✯━━━━━🜲\n`;
                    }
                });
                menu += `💡 Tips: *${prefix}menu list* | *${prefix}menu ai*\n`;
                menu += `⌬ ══〔 𓆩 *${BOT_NAME}* 𓆪 〕══ ⌬`;
            }

            // ── SEND WITH IMAGE ── MODIFIED TO USE.ENV
            let imageBuffer = null;
            if (MENU_IMAGE.startsWith('http')) {
                try {
                    const res = await fetch(MENU_IMAGE);
                    imageBuffer = Buffer.from(await res.arrayBuffer());
                } catch(e) { console.error('MENU_IMAGE fetch error', e) }
            } else if (fs.existsSync(MENU_IMAGE)) {
                imageBuffer = fs.readFileSync(MENU_IMAGE);
            }

            if (imageBuffer) {
                await sock.sendMessage(chatId, { image: imageBuffer, caption: menu }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, { text: menu }, { quoted: m });
            }

            // ── ADDED: SEND AUDIO AFTER MENU ──
            try {
                let audioBuffer = null;
                if (MENU_AUDIO.startsWith('http')) {
                    const res = await fetch(MENU_AUDIO);
                    audioBuffer = Buffer.from(await res.arrayBuffer());
                } else if (fs.existsSync(MENU_AUDIO)) {
                    audioBuffer = fs.readFileSync(MENU_AUDIO);
                }

                if (audioBuffer) {
                    await sock.sendMessage(chatId, {
                        audio: audioBuffer,
                        mimetype: 'audio/mpeg',
                        ptt: false // set true if you want voice note style
                    }, { quoted: m });
                }
            } catch(e) {
                console.error('MENU_AUDIO send error', e)
            }

            await sock.sendMessage(chatId, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[MENU ERROR]', err);
            await sock.sendMessage(chatId, { react: { text: '❔', key: m.key } });
            await sock.sendMessage(chatId, { text: `✘ MENU CRASHED\n${err.message}` }, { quoted: m });
        }
    }
};