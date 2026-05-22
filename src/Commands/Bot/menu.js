const { getByCategory, getAll } = require('../../Plugin/xdnCmd');
const { getVar } = require('../../Plugin/configManager');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');

const readmore = String.fromCharCode(0x200e).repeat(4001);

module.exports = {
    name: 'menu',
    alias: ['help', 'list', 'commands'],
    desc: 'Show all commands',
    category: 'general',
    reactions: { start: '💬', success: '✨' },

    execute: async (sock, m, { prefix, config, reply }) => {
        const menuStyle = parseInt(getVar('MENU_STYLE', '0')) || 0;
        const senderJid = m.sender || m.key.participant || m.key.remoteJid || '';
        const senderNum = senderJid.split('@')[0] || 'Unknown';

        // Get user name
        const getUserName = async (jid) => {
            if (!jid) return 'Unknown';
            try {
                const contact = sock.store?.contacts?.get?.(jid);
                if (contact?.notify?.trim()) return contact.notify;
                if (contact?.name?.trim()) return contact.name;
                if (contact?.verifiedName?.trim()) return contact.verifiedName;
                if (m.pushName?.trim() && m.sender!== jid.split('@')[0]) return m.pushName;

                if (m.isGroup && m.key) {
                    try {
                        const meta = await sock.groupMetadata(m.chat);
                        const participant = meta.participants.find(p => p.id === jid);
                        if (participant?.name?.trim()) return participant.name;
                    } catch {}
                }

                if (global.contacts && global.contacts[jid]) {
                    const c = global.contacts[jid];
                    if (c.notify) return c.notify;
                    if (c.name) return c.name;
                }

                return jid.split('@')[0];
            } catch (e) {
                console.log('[Menu] Name fetch error:', e.message);
                return jid.split('@')[0];
            }
        };

        const userName = await getUserName(senderJid);
        const categories = getByCategory();
        const botName = getVar('BOT_NAME', config.settings?.title || 'XADON AI');
        const uptimeMin = Math.floor((Date.now() - global.crysStats.startTime) / 60000);
        const totalCmds = new Set([...getAll().values()].filter(cmd =>!cmd?.isAlias).map(cmd => cmd.name?.toLowerCase())).size;
        const time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos'
        }).toLowerCase();

        // Get storage info
        const storage = (() => {
            try {
                const total = os.totalmem();
                const free = os.freem();
                const used = total - free;
                const usedGB = (used / 1024 / 1024 / 1024).toFixed(1);
                const totalGB = (total / 1024 / 1024 / 1024).toFixed(1);
                const percent = Math.round(used / total * 100);
                return `${usedGB}/${totalGB}GB (${percent}%)`;
            } catch {
                return 'N/A';
            }
        })();

        let menuText;
        switch (menuStyle) {
            case 0:
                menuText = "__STYLE6__";
                break;
            case 6:
                menuText = getOriginalMenu(userName, senderNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories, config);
                break;
            case 1:
                menuText = getHolographicMenu(userName, senderNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories);
                break;
            case 2:
                menuText = getCardStyleMenu(userName, senderNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories);
                break;
            case 3:
                menuText = getMatrixMenu(userName, senderNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories);
                break;
            case 4:
                menuText = getGlitchMenu(userName, senderNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories);
                break;
            case 5:
                menuText = getNatureMenu(userName, senderNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories);
                break;
            default:
                menuText = getOriginalMenu(userName, senderNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories, config);
        }

        const thumbUrl = getVar('THUMB_URL', config.thumbUrl || config.thumbnail || null);
        const imageBuffer = await getImage(thumbUrl, config);

        if (menuText === "__STYLE6__") {
            await require("./ⓘ")(sock, m, {
                userName,
                userNum: senderNum,
                prefix,
                botName,
                uptimeMin,
                totalCmds,
                storage,
                time,
                categories
            });
        } else {
            if (imageBuffer) {
                await sock.sendMessage(m.chat, { image: imageBuffer, caption: menuText }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, { text: menuText }, { quoted: m });
            }
        }
    }
};

// Style 0: Original
function getOriginalMenu(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories, config) {
    let text = '';
    text += `╭────⟨ 📊 Statistics ⟩────╮\n`;
    text += `│ ❏ PREFIX : ${prefix}\n`;
    text += `│ ❏ USER : ${userName}\n`;
    text += `│ ❏ NUMBER : ${userNum}\n`;
    text += `│ ❏ COMMANDS : ${totalCmds}\n`;
    text += `│ ❏ UPTIME : ${uptimeMin} MIN\n`;
    text += `│ ❏ MODE : ${config.settings?.mode?.toUpperCase() || 'PUBLIC'}\n`;
    text += `│ ❏ STORAGE : ${storage}\n`;
    text += `╚══════════════╝\n\n`;
    text += `╭─❍ *DEVELOPER*\n`;
    text += `╰──────────────────\n`;
    text += readmore;

    for (const [category, commands] of Object.entries(categories)) {
        text += `*${category.toUpperCase()}*\n`;
        const seen = new Set();
        for (const cmd of commands) {
            if (!cmd?.name) continue;
            const cmdName = cmd.name.toLowerCase();
            if (seen.has(cmdName)) continue;
            seen.add(cmdName);
            text += `> │ ➫ ${prefix}${cmd.name}\n`;
        }
        text += `╰──────────────────\n\n`;
    }

    text += `╭━━━⟨ 📋 Commands ⟩━━━╮\n\n`;
    text += `*!\nHow can I help you today?`;
    text += `\n✨ Type ${prefix}help <command> for details`;
    text += `\n╚═══════════╝\n\n`;
    return text;
}

// Style 1: Holographic
function getHolographicMenu(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories) {
    let text = `╔═══════════╗\n`;
    text += `║ ◆ HOLOGRAPHIC INTERFACE ◆ ║\n`;
    text += `║ ▓▒░ HOLOGRAM ACTIVATED ░▒▓ ║\n`;
    text += `╚═══════════╝\n\n`;

    const greetings = [
        `Welcome *${userName}*!`,
        `Greetings *${userName}*!`,
        `Hello *${userName}*!`,
        `Hey *${userName}*! 👋`
    ];
    text += greetings[Math.floor(Math.random() * greetings.length)] + '\n\n';

    text += `┌─⟨ SYSTEM DIAGNOSTICS ⟩──────┐\n`;
    text += `│\n`;
    text += `│ ⟡ USER : ${userName}\n`;
    text += `│ ⟡ NUMBER : ${userNum}\n`;
    text += `│ ⟡ PREFIX : ${prefix}\n`;
    text += `│ ⟡ COMMANDS : ${totalCmds}\n`;
    text += `│ ⟡ UPTIME : ${uptimeMin} MIN\n`;
    text += `│ ⟡ STORAGE : ${storage}\n`;
    text += `│ ⟡ TIME : ${time}\n`;
    text += `│\n`;
    text += `└────────────────────────────────┘\n\n`;
    text += readmore;

    text += `╔═══════════╗\n`;
    text += `║ ⟨ COMMAND NETWORK ⟩ ║\n`;
    text += `╚═══════════╝\n`;

    for (const [category, commands] of Object.entries(categories)) {
        text += `┏━⟨ ${category.toUpperCase()} ⟩━\n`;
        const seen = new Set();
        commands.forEach(cmd => {
            if (cmd?.name &&!seen.has(cmd.name.toLowerCase())) {
                seen.add(cmd.name.toLowerCase());
                text += `┃ ∘ ${prefix}${cmd.name}\n`;
            }
        });
        text += `└────────\n`;
    }

    text += `╔═══════════╗\n`;
    text += `║ ◈ HOLOGRAPHIC INTERFACE ◈ ║\n`;
    text += `║ ▓▒▓ Powered by ${botName} ▓▒▓ ║\n`;
    text += `╚═══════════╝`;
    return text;
}

// Style 2: Card Style
function getCardStyleMenu(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories) {
    let text = `╭───────────────────╮\n`;
    text += `│ 💎 ${botName}\n`;
    text += `╰───────────────────╯\n`;
    text += `Hello *${userName}*! 👋\n`;
    text += `Your AI assistant is ready.\n\n`;
    text += `╭─❍ *INFO*\n`;
    text += `│ 👤 ${userName}\n`;
    text += `│ 🔢 ${userNum}\n`;
    text += `│ ⚡ ${totalCmds} commands\n`;
    text += `│ ⏱️ ${uptimeMin} min uptime\n`;
    text += `│ 💾 ${storage}\n`;
    text += `╰───────────────────╯\n\n`;
    text += readmore;
    text += `🌿 Command Garden 🌿\n\n`;

    for (const [category, commands] of Object.entries(categories)) {
        text += `┌ 📦 ${category.toUpperCase()}\n`;
        const seen = new Set();
        commands.forEach(cmd => {
            if (cmd?.name &&!seen.has(cmd.name.toLowerCase())) {
                seen.add(cmd.name.toLowerCase());
                text += `│ • ${prefix}${cmd.name}\n`;
            }
        });
        text += `└────────\n\n`;
    }

    text += `🌿━━━━━━━━━━🌿\n`;
    text += `💬 Type ${prefix}help <command> for details`;
    return text;
}

// Style 3: Matrix
function getMatrixMenu(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories) {
    let text = `▓\n`;
    text += `⟫ MATRIX ACCESS GRANTED ⟪⟪\n`;
    text += `▓\n\n`;
    text += `▓ COMMAND MATRIX ▓▓\n\n`;
    text += `USER → ${userName}\n`;
    text += `[NODE ID] ${userNum}\n`;
    text += `UPTIME → ${uptimeMin} MIN\n`;
    text += `CMDS → ${totalCmds}\n`;
    text += `STORAGE → ${storage}\n\n`;
    text += readmore;
    text += `╔═══════════╗\n`;

    for (const [category, commands] of Object.entries(categories)) {
        text += `┌─[ ${category.toUpperCase()} ]─\n`;
        const seen = new Set();
        commands.forEach(cmd => {
            if (cmd?.name &&!seen.has(cmd.name.toLowerCase())) {
                seen.add(cmd.name.toLowerCase());
                text += `│ > ${prefix}${cmd.name}\n`;
            }
        });
        text += `└──────\n\n`;
    }

    text += `▓\n`;
    text += `▓▓▓▓`;
    return text;
}

// Style 4: Glitch
function getGlitchMenu(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories) {
    let text = `～ Ａ Ｅ Ｓ Ｔ Ｈ Ｅ Ｔ Ｉ Ｃ ～～\n\n`;
    text += `🌸 Welcome, *${userName}\n`;
    text += `░░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░░▀░░▀░▀░░\n\n`;
    text += `🌸 Welcome, *${userName}\n`;
    text += `ユーザー → ${userName}\n`;
    text += `時間 → ${time}\n`;
    text += `稼働時間 → ${uptimeMin}分\n`;
    text += `🌱 Growing Info:\n`;
    text += readmore;
    text += `🌿━━━━━━━━━━🌿\n`;
    text += `🌿 Command Garden 🌿\n\n`;
    text += `🌿━━━━━━━━━━🌿\n`;

    for (const [category, commands] of Object.entries(categories)) {
        text += `［ ${category.toUpperCase()} ］\n`;
        const seen = new Set();
        commands.forEach(cmd => {
            if (cmd?.name &&!seen.has(cmd.name.toLowerCase())) {
                seen.add(cmd.name.toLowerCase());
                text += `～ ${prefix}${cmd.name}\n`;
            }
        });
        text += `\n`;
    }

    text += `🌿━━━━━━━━━━🌿\n`;
    text += `💜 R E T R O V I B E S 💜`;
    return text;
}

// Style 5: Nature
function getNatureMenu(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories) {
    let text = `🌿━━━━━━━━━━━━━━━━━━🌿\n`;
    text += ` 🍃 ${botName}\n`;
    text += ` Your Digital Garden\n`;
    text += `🌿━━━━━━━━━━🌿\n`;
    text += `🍃 Welcome, *${userName}*\n`;
    text += `🌱 Growing Info:\n`;
    text += ` ∘ Commands: ${totalCmds}\n`;
    text += ` ∘ Growth Time: ${uptimeMin} min\n`;
    text += ` ∘ Garden Space: ${storage}\n\n`;
    text += readmore;
    text += `🌿 Command Garden 🌿\n\n`;

    for (const [category, commands] of Object.entries(categories)) {
        text += `🍃 ${category.toUpperCase()}\n`;
        const seen = new Set();
        commands.forEach(cmd => {
            if (cmd?.name &&!seen.has(cmd.name.toLowerCase())) {
                seen.add(cmd.name.toLowerCase());
                text += ` 🍃 ${prefix}${cmd.name}\n`;
            }
        });
        text += `\n`;
    }

    text += `🌿━━━━━━━━━━🌿\n`;
    text += ` 🍃 Eco-Friendly Bot 🍃\n`;
    text += `🌿━━━━━━━━━━🌿`;
    return text;
}

// Get menu image
async function getImage(url, config) {
    const imageUrl = url || config?.thumbUrl || config?.thumbnail || 'https://i.imgur.com/BoN9kdC.png';
    if (!imageUrl) return null;

    const localPath = path.join(__dirname, '../../assets/menu.png');
    if (fs.existsSync(localPath)) return fs.readFileSync(localPath);

    try {
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, res.data);
        return res.data;
    } catch (e) {
        console.log('[Menu] Image download failed:', e.message);
        return null;
    }
}