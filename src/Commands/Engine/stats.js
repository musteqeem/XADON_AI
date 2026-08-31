const { getVar } = require('../../Plugin/configManager');
const { getFont } = require('../Bot/botfont.js');
const fs = require('fs');
const path = require('path');

function uptime() {
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const m = Math.floor(up % 3600 / 60);
    const s = Math.floor(up % 60);
    return `${h}h ${m}m ${s}s`;
}

function on(val, defaultVal = true) {
    if (val === undefined || val === null) return defaultVal? '✓ ON' : '✘ OFF';
    return val!== false && val!== 'false' && val!== 0? '✓ ON' : '✘ OFF';
}

function typingMode() {
    const mode = getVar('FAKE_TYPING', 'default');
    if (mode === 'all') return '✓ ON › all messages';
    if (mode === 'commands') return '✓ ON › commands only';
    return '✘ OFF';
}

function autoRecordingStatus() {
    return on(getVar('AUTO_RECORDING', true));
}

function afkStatus() {
    try {
        const afk = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'afk.json'), 'utf8'));
        if (!afk.enabled) return '✘ OFF';
        const diff = Date.now() - afk.since;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        const time = days > 0? `${days}d ${hrs % 24}h` : hrs > 0? `${hrs}h ${mins % 60}m` : `${mins}m`;
        return `✓ ON › _${afk.reason}_ (${time})`;
    } catch {
        return '✘ OFF';
    }
}

function antideleteStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'antidelete.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function antieditStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'antiedit.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function autoStatusView() {
    try {
        const { loadConfig } = require('../Plugin/statusHandler');
        return loadConfig().autoView? '✓ ON' : '✘ OFF';
    } catch { return on(getVar('AUTO_STATUS_VIEW', true)); }
}

function autoStatusLike() {
    try {
        const { loadConfig } = require('../Plugin/statusHandler');
        return loadConfig().autoLike? '✓ ON' : '✘ OFF';
    } catch { return on(getVar('AUTO_STATUS_LIKE', true)); }
}

function autoReactStatus() {
    try {
        const ar = require('../Owner/autoreact.js');
        return ar.isEnabled()? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function antiwordStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'antiword.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function antitagStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'antitag.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function antigmStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'antigm.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function antilinkStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'antilink.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function asscmdStatus() {
    try { require('../Owner/setcmd.js'); return '✓ ON'; } catch { return '✘ OFF'; }
}

function autoStickerStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'autosticker.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function autoVoiceStatus(jid) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database', 'autovoice.json'), 'utf8'));
        return data[jid]? '✓ ON' : '✘ OFF';
    } catch { return '✘ OFF'; }
}

function row(label, value, pad = 14) {
    const dots = '·'.repeat(Math.max(1, pad - label.length));
    return `❏◦ ${label} ${dots}› ${value}\n`;
}

function getVerifiedContext() {
    const contextInfo = {
        forwardingScore: 999,
        isForwarded: true,
        participant: '0@s.whatsapp.net',
        remoteJid: '120363402922206865@newsletter',
        quotedMessage: { conversation: '```⌘ XADON AI 𓀀```' },
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402922206865@newsletter',
            newsletterName: 'xadon ai verified ✓',
            serverMessageId: 1
        }
    };
    const fakeQuoted = {
        key: { remoteJid: '120363402922206865@newsletter', fromMe: false, participant: '0@s.whatsapp.net', id: '3EB0' + Math.random().toString(16).substring(2, 10) },
        message: { conversation: '```⌘ XADON AI 𓀀```' }
    };
    return { contextInfo, fakeQuoted };
}

module.exports = {
    name: 'botinfo',
    alias: ['stats', 'botstats', 'crysStats'],
    desc: 'Show full bot statistics and settings',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '📊', success: '✨', error: '❔' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '📊', key: m.key } });

        const bot = require('../../../settings/config');
        const jid = m.chat;
        const font = getFont(jid) || 'default';
        const prefix = getVar('PREFIX', '.');
        const tz = getVar('TIMEZONE', 'Africa/Lagos');
        const lang = getVar('BOT_LANG', getVar('BOTLANG', 'en')) || 'en';
        const name = sock.user?.name || 'XADON AI';
        const number = sock.user?.id?.split(':')[0] || '—';
        const caption = getVar('CAPTION', '© XADON AI V2');
        const menuStyle = getVar('MENU_STYLE', '1');
        const mode = bot.status?.public?? true? '_*Public 彡*_' : '_*Private 彡*_';

        const info = `⌘ ⿻ *B⎔T STATISTICS* ⿻ ⌘\n\n𒆜 ಠ_ಠ *B⎔T INFO*\n𓀀\n` +
            row('Name', name) +
            row('Number', number) +
            row('Mode', mode) +
            row('Prefix', `[ ${prefix} ]`) +
            row('Font', font) +
            row('Language', lang) +
            row('Timezone', tz) +
            row('Style', '× ' + menuStyle) +
            '\n\n𒆜 ✪ *PERFORMANCE*\n𓅓\n' +
            row('Uptime', uptime()) +
            row('Messages', String(global.crysStats?.messages || 0)) +
            row('Commands', String(global.crysStats?.cmd || 0)) +
            '\n\n𒆜 ⌘ *CORE TOGGLES*\n𓄂ᬼ𓆃\n' +
            row('Auto Read', on(getVar('AUTO_READ', true))) +
            row('Anti Call', on(getVar('ANTI_CALL', true))) +
            row('Cmd React', autoReactStatus()) +
            row('Auto React', on(getVar('AUTO_REACT', true))) +
            row('Tag Emoji', caption) +
            row('Status View', autoStatusView()) +
            row('Status Like', autoStatusLike()) +
            row('Fake Typing', typingMode()) +
            row('Auto Record', autoRecordingStatus()) +
            '\n\n𒆜 ⚔ *PROTECTION*\n𓃼\n' +
            row('Anti Delete', antideleteStatus(jid)) +
            row('Anti Edit', antieditStatus(jid)) +
            row('Anti Word', antiwordStatus(jid)) +
            row('Anti Tag', antitagStatus(jid)) +
            row('Anti GM', antigmStatus(jid)) +
            row('Anti Link', antilinkStatus(jid)) +
            '\n\n𒆜 ✪ *EXTRAS*\n𓅓\n' +
            row('AFK', afkStatus()) +
            row('AssCmd', asscmdStatus()) +
            row('Auto Sticker', autoStickerStatus(jid)) +
            row('Auto Voice', autoVoiceStatus(jid)) +
            row('Caption', `_${caption}_`) +
            '\n⌘ ⿻ *𝗫𝗔𝗗𝗢𝗡 𝗔𝗜* ⿻ ⌘';

        const { contextInfo, fakeQuoted } = getVerifiedContext();

        try {
            await sock.sendMessage(jid, {
                image: { url: 'https://media.crysnovax.workers.dev/4b050f72-ca45-4fa3-84fc-806ad438483a.jpg' },
                caption: info,
                contextInfo
            }, { quoted: fakeQuoted });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
        } catch (e) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(info);
        }
    }
};