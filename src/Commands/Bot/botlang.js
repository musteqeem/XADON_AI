const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../../database/lang_prefs.json');

const LANG_NAMES = {
    'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
    'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean',
    'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 'pl': 'Polish', 'nl': 'Dutch',
    'id': 'Indonesian', 'ms': 'Malay', 'vi': 'Vietnamese', 'th': 'Thai', 'sv': 'Swedish',
    'no': 'Norwegian', 'da': 'Danish', 'fi': 'Finnish', 'ro': 'Romanian', 'uk': 'Ukrainian',
    'cs': 'Czech', 'hu': 'Hungarian', 'el': 'Greek', 'he': 'Hebrew', 'bn': 'Bengali',
    'fa': 'Persian', 'yo': 'Yoruba', 'ig': 'Igbo', 'ha': 'Hausa', 'sw': 'Swahili',
    'zu': 'Zulu', 'ta': 'Tamil', 'te': 'Telugu', 'mr': 'Marathi', 'gu': 'Gujarati',
    'kn': 'Kannada', 'ml': 'Malayalam', 'pa': 'Punjabi', 'or': 'Odia', 'ur': 'Urdu',
    'si': 'Sinhala', 'ne': 'Nepali', 'my': 'Burmese', 'km': 'Khmer', 'lo': 'Lao',
    'ps': 'Pashto', 'sd': 'Sindhi', 'am': 'Amharic', 'ti': 'Tigrinya', 'ca': 'Catalan',
    'eu': 'Basque', 'gl': 'Galician', 'ga': 'Irish', 'cy': 'Welsh', 'gd': 'Scottish Gaelic',
    'is': 'Icelandic', 'lt': 'Lithuanian', 'lv': 'Latvian', 'et': 'Estonian', 'sl': 'Slovenian',
    'sk': 'Slovak', 'bg': 'Bulgarian', 'sr': 'Serbian', 'hr': 'Croatian', 'bs': 'Bosnian',
    'mk': 'Macedonian', 'sq': 'Albanian', 'mt': 'Maltese', 'la': 'Latin', 'eo': 'Esperanto',
    'af': 'Afrikaans', 'st': 'Sesotho', 'tn': 'Tswana', 'ts': 'Tsonga', 've': 'Venda',
    'xh': 'Xhosa', 'rw': 'Kinyarwanda', 'rn': 'Kirundi', 'lg': 'Luganda', 'ny': 'Chichewa',
    'sn': 'Shona', 'so': 'Somali', 'mg': 'Malagasy', 'wo': 'Wolof', 'ak': 'Akan',
    'bem': 'Bemba', 'ln': 'Lingala', 'nso': 'Northern Sotho', 'ss': 'Swati', 'tw': 'Twi',
    'az': 'Azerbaijani', 'hy': 'Armenian', 'ka': 'Georgian', 'kk': 'Kazakh', 'ky': 'Kyrgyz',
    'tg': 'Tajik', 'tk': 'Turkmen', 'uz': 'Uzbek', 'mn': 'Mongolian', 'ku': 'Kurdish',
    'ckb': 'Sorani Kurdish', 'dv': 'Dhivehi', 'dz': 'Dzongkha', 'os': 'Ossetian',
    'tt': 'Tatar', 'ug': 'Uyghur', 'yi': 'Yiddish', 'fil': 'Filipino', 'tl': 'Tagalog',
    'jv': 'Javanese', 'su': 'Sundanese', 'mi': 'Maori', 'haw': 'Hawaiian', 'fj': 'Fijian',
    'sm': 'Samoan', 'to': 'Tongan', 'ceb': 'Cebuano', 'hmn': 'Hmong', 'ty': 'Tahitian',
    'mfe': 'Mauritian Creole', 'pap': 'Papiamento', 'ay': 'Aymara', 'qu': 'Quechua',
    'gn': 'Guarani', 'nah': 'Nahuatl', 'ab': 'Abkhazian', 'aa': 'Afar', 'av': 'Avaric',
    'ae': 'Avestan', 'ba': 'Bashkir', 'bm': 'Bambara', 'bi': 'Bislama', 'bo': 'Tibetan',
    'ch': 'Chamorro', 'cr': 'Cree', 'cu': 'Church Slavic', 'ff': 'Fulah', 'gv': 'Manx',
    'hz': 'Herero', 'io': 'Ido', 'kj': 'Kwanyama', 'kr': 'Kanuri', 'ks': 'Kashmiri',
    'kv': 'Komi', 'kw': 'Cornish', 'li': 'Limburgish', 'lu': 'Luba-Katanga', 'mh': 'Marshallese',
    'na': 'Nauru', 'nd': 'North Ndebele', 'ng': 'Ndonga', 'nr': 'South Ndebele',
    'nv': 'Navajo', 'oj': 'Ojibwa', 'pi': 'Pali', 'rar': 'Cook Islands Maori',
    'sc': 'Sardinian', 'sco': 'Scots', 'sg': 'Sango', 'sz': 'Silesian', 'vo': 'Volapük',
    'wa': 'Walloon', 'zza': 'Zaza'
};

const SUPPORTED_LANGS = Object.keys(LANG_NAMES);

function loadPrefs() {
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('[XDN Lang] Load error:', e.message);
    }
    return { global: null, groups: {} };
}

function savePrefs(prefs) {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(prefs, null, 2));
    } catch (e) {
        console.error('[XDN Lang] Save error:', e.message);
    }
}

function getLang(jid) {
    const prefs = loadPrefs();
    if (jid?.endsWith('@g.us') && prefs.groups[jid]) {
        return prefs.groups[jid];
    }
    return prefs.global || null;
}

function setLang(jid, lang, isGroup = false) {
    const prefs = loadPrefs();
    if (isGroup && jid?.endsWith('@g.us')) {
        if (lang) {
            prefs.groups[jid] = lang;
        } else {
            delete prefs.groups[jid];
        }
    } else {
        prefs.global = lang || null;
    }
    savePrefs(prefs);
}

function formatLanguageList() {
    const langs = SUPPORTED_LANGS.slice(0, 260);
    const list = langs.map(code => {
        const name = LANG_NAMES[code];
        const spaces = ' '.repeat(Math.max(1, 8 - code.length));
        return `֎ ${code}${spaces}→ ${name}`;
    });
    return list.join('\n') + `\n\n_... AND ${SUPPORTED_LANGS.length - 260} more languages._`;
}

function isValidLang(code) {
    if (SUPPORTED_LANGS.includes(code)) return true;
    const base = code.split('-')[0];
    return SUPPORTED_LANGS.includes(base);
}

module.exports = {
    name: 'setlang',
    alias: ['botlang', 'lang'],
    category: 'tools',
    desc: 'Set auto-translation language for this chat',
    usage: '.setlang list |.setlang <code> |.setlang group <code> |.setlang off',

    execute: async (sock, msg, { args, reply }) => {
        const chatJid = msg.key.remoteJid;
        const isGroup = chatJid.endsWith('@g.us');

        if (!args[0] || args[0].toLowerCase() === 'list') {
            let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • LANGUAGE DATABASE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *Supported: ${SUPPORTED_LANGS.length} Languages*
╰─────────────────────────╯

${formatLanguageList()}

✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Usage:
֎.setlang <code> → Global
֎.setlang group <code> → Group only
֎.setlang off → Disable global
֎.setlang group off → Disable group`;
            return reply(text);
        }

        const subCmd = args[0].toLowerCase();
        const langCode = args[1]?.toLowerCase();

        if (subCmd === 'group') {
            if (!isGroup) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • LANG ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Group lang can only be set in a group chat.`
            );

            if (!langCode) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • LANG ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Usage:.setlang group <code>
    .setlang group off`
            );

            if (langCode === 'off') {
                setLang(chatJid, null, true);
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GROUP LANG DISABLED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Translation is now OFF for this group.`
                );
            }

            if (!isValidLang(langCode)) {
                return reply('֎ Invalid language code. Use.setlang list');
            }

            const finalCode = SUPPORTED_LANGS.includes(langCode)? langCode : langCode.split('-')[0];
            setLang(chatJid, finalCode, true);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GROUP LANG UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Target : Group
│ ❏ Lang : ${LANG_NAMES[finalCode] || finalCode.toUpperCase()}
│ ❏ Code : ${finalCode}
│ ❏ Status : ACTIVE
╰─────────────────────────╯`
            );
        }

        if (subCmd === 'off') {
            setLang(chatJid, null, false);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GLOBAL LANG DISABLED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Global translation is now OFF.`
            );
        }

        if (!isValidLang(subCmd)) {
            return reply('֎ Invalid language code. Use.setlang list');
        }

        const finalCode = SUPPORTED_LANGS.includes(subCmd)? subCmd : subCmd.split('-')[0];
        setLang(chatJid, finalCode, false);
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GLOBAL LANG UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Target : Global
│ ❏ Lang : ${LANG_NAMES[finalCode] || finalCode.toUpperCase()}
│ ❏ Code : ${finalCode}
│ ❏ Status : ACTIVE
╰─────────────────────────╯`
        );
    },

    getLang,
    setLang
};