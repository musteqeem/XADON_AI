const fs = require('fs');
const path = require('path');
const config = require('../../../settings/config');

const BOT_NAME = config.botname || process.env.BOTNAME || 'XADON AI';
const DB_PATH = path.join(__dirname, '../../../database/lang_prefs.json');

const LANG_NAMES = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
  'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese',
  'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi',
  'tr': 'Turkish', 'yo': 'Yoruba', 'ig': 'Igbo', 'ha': 'Hausa', 'sw': 'Swahili',
  //... 260+ languages total
};

const SUPPORTED_LANGS = Object.keys(LANG_NAMES);

function loadPrefs() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {}
  return { 'global': null, 'groups': {} };
}

function savePrefs(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getLang(jid) {
  const prefs = loadPrefs();
  if (jid?.endsWith('@g.us') && prefs.groups[jid]) return prefs.groups[jid];
  return prefs.global || null;
}

function setLang(jid, langCode, isGroup = false) {
  const prefs = loadPrefs();
  if (isGroup && jid?.endsWith('@g.us')) {
    if (langCode) prefs.groups[jid] = langCode;
    else delete prefs.groups[jid];
  } else {
    prefs.global = langCode || null;
  }
  savePrefs(prefs);
}

function formatLanguageList() {
  const list = SUPPORTED_LANGS.slice(0, 260).map(code => {
    const name = LANG_NAMES[code];
    const pad = '.'.repeat(Math.max(1, 12 - code.length));
    return `❏ ${code}${pad} ${name}`;
  });
  return list.join('\n') + `\n❏...and ${SUPPORTED_LANGS.length - 260} more languages.`;
}

module.exports = {
  name: 'setlang',
  alias: ['lang', 'botlang', 'setlanguage'],
  category: 'Tools',
  desc: 'Set auto-translation language for this chat',
  usage: '.setlang list |.setlang <code> |.setlang group <code> |.setlang off',

  execute: async (sock, m, { args, reply }) => {
    const jid = m.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    await sock.sendMessage(m.chat, { react: { text: '🌐', key: m.key } });

    if (!args[0] || args[0].toLowerCase() === 'list') {
      return reply(
        `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LANGUAGES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Total : ${SUPPORTED_LANGS.length} languages

${formatLanguageList()}

╭─֎ *HOW TO USE*
│ ❏.setlang <code> : Set global
│ ${isGroup? '❏.setlang group <code> : Set for this group' : ''}
│ ❏.setlang off : Disable global
│ ${isGroup? '❏.setlang group off : Disable this group' : ''}
╰─────────────────────────╯`
      );
    }

    const cmd = args[0].toLowerCase();
    const code = args[1]?.toLowerCase();

    // ── GROUP ─────────────────────────────────────────────────
    if (cmd === 'group') {
      if (!isGroup) return reply('✘ ֎ This command only works in groups.');
      if (!code) return reply('✘ ֎ Usage:.setlang group <code> |.setlang group off');

      if (code === 'off') {
        setLang(jid, null, true);
        return reply(`✓ ֎ Group translation disabled.`);
      }

      const baseCode = code.split('-')[0];
      if (!SUPPORTED_LANGS.includes(code) &&!SUPPORTED_LANGS.includes(baseCode))
        return reply('✘ ֎ Invalid language code. Use.setlang list');

      setLang(jid, code, true);
      return reply(
        `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LANGUAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Scope : This Group
❏ Language : ${LANG_NAMES[code] || code.toUpperCase()}
❏ Code : ${code}
❏ Status : Enabled`
      );
    }

    // ── OFF ───────────────────────────────────────────────────
    if (cmd === 'off') {
      setLang(jid, null, false);
      return reply(`✓ ֎ Global translation disabled.`);
    }

    // ── SET GLOBAL ────────────────────────────────────────────
    const baseCmd = cmd.split('-')[0];
    if (!SUPPORTED_LANGS.includes(cmd) &&!SUPPORTED_LANGS.includes(baseCmd))
      return reply('✘ ֎ Invalid language code. Use.setlang list');

    setLang(jid, cmd, false);
    return reply(
      `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LANGUAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Scope : Global
❏ Language : ${LANG_NAMES[cmd] || cmd.toUpperCase()}
❏ Code : ${cmd}
❏ Status : Enabled`
    );
  },
  getLang,
  setLang
};