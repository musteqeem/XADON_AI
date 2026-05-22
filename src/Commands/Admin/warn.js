const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');

const WARN_FILE = path.join(__dirname, '../../../database/warns.json');

let warns = {};

const loadWarns = () => {
    try {
        if (fs.existsSync(WARN_FILE))
            warns = JSON.parse(fs.readFileSync(WARN_FILE, 'utf8'));
    } catch (e) {
        console.error('[WARN LOAD ERROR]', e.message);
        warns = {};
    }
};

const saveWarns = () => {
    try { fs.writeFileSync(WARN_FILE, JSON.stringify(warns, null, 2)); }
    catch (e) { console.error('[WARN SAVE ERROR]', e.message); }
};

loadWarns();

const getTargetUser = (m, args) => {
    if (m.mentionedJid && m.mentionedJid.length > 0) return m.mentionedJid[0];
    if (m.quoted && m.quoted.sender) return m.quoted.sender;
    if (args[0]) {
        const number = args[0].replace(/[^0-9]/g, '');
        if (number.length >= 10) return `${number}@s.whatsapp.net`;
    }
    return null;
};

const getAdminLink = (config) => {
    const adminNum = config?.owner?.number || config?.owner || global.ownerNumber || null;
    if (!adminNum) return null;
    return `https://wa.me/${adminNum.toString().replace(/[^0-9]/g, '')}`;
};

async function addWarningOverlay(imageBuffer) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const { width, height } = metadata;

        const redOverlay = await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0.4 }
            }
        }).png().toBuffer();

        const fontSize = Math.max(48, Math.floor(width / 6));
        const svgText = `
            <svg width="${width}" height="${height}">
                <style>
                   .warning-text {
                        font-family: 'Impact', 'Arial Black', sans-serif;
                        font-size: ${fontSize}px;
                        font-weight: bold;
                        fill: #FFD966;
                        stroke: #8B0000;
                        stroke-width: 3px;
                        paint-order: stroke;
                        text-anchor: middle;
                        dominant-baseline: middle;
                        transform: rotate(-25deg, ${width/2}, ${height/2});
                        letter-spacing: 4px;
                    }
                </style>
                <text x="50%" y="50%" class="warning-text">WARNING</text>
            </svg>
        `;
        const svgBuffer = Buffer.from(svgText);

        const finalImage = await sharp(imageBuffer)
          .composite([
                { input: redOverlay, blend: 'over' },
                { input: svgBuffer, blend: 'over' }
            ])
          .jpeg({ quality: 92 })
          .toBuffer();

        return finalImage;
    } catch (err) {
        console.error('[OVERLAY ERROR]', err.message);
        return imageBuffer;
    }
}

const formatWarnMenu = (target, count, reason, config, prefix = '.') => {
    const username = target.split('@')[0];
    const isFinal = count >= 3;
    const text =
       `✦ *WARN SYSTEM* ✦\n\n` +
       `User: @${username}\n` +
       `Warning: ${count}/3\n` +
       `Reason: ${reason}\n` +
       `Status: ${isFinal? 'CRITICAL' : 'ACTIVE'}\n\n` +
       `This is an official warning from group administration`;
    const buttons = [{
        buttonId: `${prefix}appeal`,
        buttonText: { displayText: 'Appeal Warn' },
        type: 1
    }];
    return { text, buttons };
};

const formatResetMenu = (target) => {
    const username = target.split('@')[0];
    return {
        text:
           `✦ *WARN SYSTEM - CLEARED*\n\n` +
           `User: @${username}\n` +
           `Status: All warnings removed\n` +
           `Record: Clean slate`
    };
};

const formatStatusMenu = (target, count) => {
    const username = target.split('@')[0];
    const status = count === 0? 'Clean' : count >= 3? 'Critical' : 'On Watch';
    return {
        text:
           `✦ *WARN SYSTEM - STATUS* ✦\n\n` +
           `User: @${username}\n` +
           `Warnings: ${count}/3\n` +
           `Status: ${status}`
    };
};

const formatHelpMenu = (prefix = '.') => ({
    text:
       `✦ *WARN SYSTEM* ✦\n\n` +
       `Commands:\n` +
       `• ${prefix}warn @user [reason]\n` +
       `• ${prefix}resetwarn @user\n` +
       `• ${prefix}warnings @user\n` +
       `• ${prefix}appeal (DM only)\n\n` +
       `3 warnings = auto-kick\n` +
       `Warns persist even after rejoin`
});

module.exports = {
    name: 'warn',
    alias: ['resetwarn', 'warnings', 'warns', 'clearwarn', 'appeal'],
    desc: 'Warning system with visual menu',
    category: 'group',
    usage: '.warn @user [reason] |.resetwarn @user |.appeal',

    execute: async (sock, m, { args, reply, config, prefix, groupMeta, isGroup }) => {
        const groupJid = m.chat;
        const cmd = m.body.toLowerCase().split(/\s+/)[0].replace(/^[.#\/!]/, '');

        if (!warns[groupJid]) warns[groupJid] = {};

        if (cmd === 'appeal') {
            if (m.isGroup) {
                try {
                    const meta = await sock.groupMetadata(m.chat).catch(() => null);
                    const groupName = meta?.subject || 'Unknown Group';
                    const userWarns = warns[groupJid]?.[m.sender] || 0;
                    await sock.sendMessage(m.sender, {
                        text:
                           `✦ *APPEAL REQUEST* ✦\n\n` +
                           `Group: ${groupName}\n` +
                           `Your Warnings: ${userWarns}/3\n` +
                           `Type your appeal message here.\n` +
                           `Be honest and explain your side.\n\n` +
                           `Type your appeal message below`
                    });
                    return sock.sendMessage(m.chat, {
                        text: `✦ @${m.sender.split('@')[0]}, check your DM to submit appeal`,
                        mentions: [m.sender]
                    }, { quoted: m });
                } catch {
                    return reply('✘ Could not send DM. Open chat with me privately.');
                }
            } else {
                return reply(
                   `✦ *APPEAL REQUEST* ✦\n\n` +
                   `You are in direct contact with the bot.\n` +
                   `Type your appeal message below.\n` +
                   `Explain why your warn should be removed.`
                );
            }
        }

        if (!m.isGroup) return reply('✘ Group only command');

        const target = getTargetUser(m, args);

        if (!target && cmd!== 'warnings' && cmd!== 'warns')
            return sock.sendMessage(m.chat, { text: formatHelpMenu(prefix).text }, { quoted: m });

        if (cmd === 'warn') {
            const reason = args.slice(m.mentionedJid?.length? 0 : 1).join(' ').trim() || 'Violation of group rules';
            warns[groupJid][target] = (warns[groupJid][target] || 0) + 1;
            const count = warns[groupJid][target];
            saveWarns();

            let ppBuffer = null;
            try {
                const ppUrl = await sock.profilePictureUrl(target, 'image');
                if (ppUrl) {
                    const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 5000 });
                    ppBuffer = Buffer.from(res.data);
                    ppBuffer = await addWarningOverlay(ppBuffer);
                }
            } catch {}

            const menu = formatWarnMenu(target, count, reason, config, prefix);

            if (ppBuffer) {
                await sock.sendMessage(m.chat, {
                    image: ppBuffer,
                    caption: menu.text,
                    buttons: menu.buttons,
                    headerType: 1,
                    contextInfo: { mentionedJid: [target] }
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, {
                    text: menu.text,
                    buttons: menu.buttons,
                    headerType: 1,
                    mentions: [target]
                }, { quoted: m });
            }

            if (count >= 3) {
                try {
                    await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
                    await sock.sendMessage(m.chat, {
                        text:
                           `✦ *WARN SYSTEM - REMOVED*\n\n` +
                           `User: @${target.split('@')[0]}\n` +
                           `Reason: 3/3 warnings reached\n` +
                           `Action: Auto-kick executed\n` +
                           `Note: Warns persist on rejoin`,
                        mentions: [target]
                    });
                    saveWarns();
                } catch {
                    await sock.sendMessage(m.chat, {
                        text: `✘ Kick failed. Check bot admin rights.`,
                        mentions: [target]
                    });
                }
            }
            return;
        }

        if (cmd === 'resetwarn' || cmd === 'clearwarn') {
            if (!warns[groupJid][target]) {
                return sock.sendMessage(m.chat, {
                    text: `✘ @${target.split('@')[0]} has no warnings`,
                    mentions: [target]
                }, { quoted: m });
            }
            delete warns[groupJid][target];
            saveWarns();
            await sock.sendMessage(m.chat, {
                text: formatResetMenu(target).text,
                mentions: [target]
            }, { quoted: m });
            return;
        }

        if (cmd === 'warnings' || cmd === 'warns') {
            const checkTarget = target || m.sender;
            const count = warns[groupJid][checkTarget] || 0;
            await sock.sendMessage(m.chat, {
                text: formatStatusMenu(checkTarget, count).text,
                mentions: [checkTarget]
            }, { quoted: m });
            return;
        }

        sock.sendMessage(m.chat, { text: formatHelpMenu(prefix).text }, { quoted: m });
    }
};

module.exports.handleRejoin = async function(sock, groupJid, participantJid) {
    try {
        loadWarns();
        const count = warns[groupJid]?.[participantJid];
        if (!count || count === 0) return;
        await sock.sendMessage(groupJid, {
            text:
               `✦ *WARN SYSTEM - REJOIN ALERT* ✦\n\n` +
               `@${participantJid.split('@')[0]} just rejoined\n` +
               `They have ${count}/3 active warnings\n` +
               `Their warn record was NOT reset`,
            mentions: [participantJid]
        });
    } catch {}
};