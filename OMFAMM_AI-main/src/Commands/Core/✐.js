const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database/translate-defaults.json');

const loadDefaults = () => {
    try {
        if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {}
    return {};
};

const saveDefaults = (data) => {
    try {
        if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch {}
};

// Language code -> Human readable name
const LANG_NAMES = {
    'af': 'Afrikaans', 'ak': 'Akan', 'am': 'Amharic', 'ar': 'Arabic', 'ary': 'Moroccan Arabic', 'arz': 'Egyptian Arabic',
    'ast': 'Asturian', 'az': 'Azerbaijani', 'be': 'Belarusian', 'bem': 'Bemba', 'bg': 'Bulgarian', 'bn': 'Bengali',
    'br': 'Breton', 'bs': 'Bosnian', 'ca': 'Catalan', 'ce': 'Chechen', 'ceb': 'Cebuano', 'ckb': 'Kurdish (Sorani)',
    'co': 'Corsican', 'cs': 'Czech', 'cv': 'Chuvash', 'cy': 'Welsh', 'da': 'Danish', 'de': 'German', 'dv': 'Dhivehi',
    'dz': 'Dzongkha', 'ee': 'Ewe', 'el': 'Greek', 'en': 'English', 'eo': 'Esperanto', 'es': 'Spanish', 'et': 'Estonian',
    'eu': 'Basque', 'fa': 'Persian', 'fi': 'Finnish', 'fo': 'Faroese', 'fr': 'French', 'fy': 'Frisian', 'ga': 'Irish',
    'gd': 'Scottish Gaelic', 'gl': 'Galician', 'gn': 'Guarani', 'gu': 'Gujarati', 'ha': 'Hausa', 'haw': 'Hawaiian',
    'he': 'Hebrew', 'hi': 'Hindi', 'hmn': 'Hmong', 'hr': 'Croatian', 'ht': 'Haitian Creole', 'hu': 'Hungarian',
    'hy': 'Armenian', 'ia': 'Interlingua', 'id': 'Indonesian', 'ie': 'Interlingue', 'ig': 'Igbo', 'ii': 'Sichuan Yi',
    'is': 'Icelandic', 'it': 'Italian', 'iu': 'Inuktitut', 'ja': 'Japanese', 'jv': 'Javanese', 'ka': 'Georgian',
    'kg': 'Kongo', 'ki': 'Kikuyu', 'kk': 'Kazakh', 'kl': 'Kalaallisut', 'km': 'Khmer', 'kn': 'Kannada', 'ko': 'Korean',
    'ku': 'Kurdish (Kurmanji)', 'ky': 'Kyrgyz', 'la': 'Latin', 'lb': 'Luxembourgish', 'lg': 'Luganda', 'ln': 'Lingala',
    'lo': 'Lao', 'lt': 'Lithuanian', 'ltg': 'Latgalian', 'lv': 'Latvian', 'mai': 'Maithili', 'mg': 'Malagasy',
    'mfe': 'Mauritian Creole', 'mi': 'Maori', 'mk': 'Macedonian', 'ml': 'Malayalam', 'mn': 'Mongolian', 'mr': 'Marathi',
    'ms': 'Malay', 'mt': 'Maltese', 'my': 'Burmese', 'ne': 'Nepali', 'nl': 'Dutch', 'nn': 'Norwegian Nynorsk',
    'no': 'Norwegian', 'nso': 'Northern Sotho', 'ny': 'Chichewa', 'oc': 'Occitan', 'om': 'Oromo', 'or': 'Odia',
    'os': 'Ossetian', 'pa': 'Punjabi', 'pap': 'Papiamento', 'pl': 'Polish', 'ps': 'Pashto', 'pt': 'Portuguese',
    'qu': 'Quechua', 'rm': 'Romansh', 'rn': 'Kirundi', 'ro': 'Romanian', 'ru': 'Russian', 'rw': 'Kinyarwanda',
    'sa': 'Sanskrit', 'sc': 'Sardinian', 'sd': 'Sindhi', 'se': 'Northern Sami', 'sh': 'Serbo-Croatian', 'si': 'Sinhala',
    'sk': 'Slovak', 'sl': 'Slovenian', 'sm': 'Samoan', 'sn': 'Shona', 'so': 'Somali', 'sq': 'Albanian', 'sr': 'Serbian',
    'ss': 'Swati', 'st': 'Sesotho', 'su': 'Sundanese', 'sv': 'Swedish', 'sw': 'Swahili', 'ta': 'Tamil', 'te': 'Telugu',
    'tg': 'Tajik', 'th': 'Thai', 'ti': 'Tigrinya', 'tk': 'Turkmen', 'tl': 'Tagalog', 'tn': 'Tswana', 'to': 'Tongan',
    'tr': 'Turkish', 'ts': 'Tsonga', 'tt': 'Tatar', 'tw': 'Twi', 'ty': 'Tahitian', 'ug': 'Uyghur', 'uk': 'Ukrainian',
    'ur': 'Urdu', 'uz': 'Uzbek', 've': 'Venda', 'vi': 'Vietnamese', 'wa': 'Walloon', 'wo': 'Wolof', 'xh': 'Xhosa',
    'yi': 'Yiddish', 'yo': 'Yoruba', 'za': 'Zhuang', 'zh': 'Chinese', 'zu': 'Zulu',

    // Variants
    'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)', 'zh-HK': 'Chinese (Hong Kong)', 'zh-SG': 'Chinese (Singapore)',
    'pt-PT': 'Portuguese (Portugal)', 'pt-BR': 'Portuguese (Brazil)', 'en-GB': 'English (UK)', 'en-US': 'English (US)',
    'en-AU': 'English (Australia)', 'en-CA': 'English (Canada)', 'en-IN': 'English (India)', 'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)', 'es-AR': 'Spanish (Argentina)', 'es-CO': 'Spanish (Colombia)', 'fr-FR': 'French (France)',
    'fr-CA': 'French (Canada)', 'fr-BE': 'French (Belgium)', 'fr-CH': 'French (Switzerland)', 'de-DE': 'German (Germany)',
    'de-AT': 'German (Austria)', 'de-CH': 'German (Switzerland)', 'it-IT': 'Italian (Italy)', 'it-CH': 'Italian (Switzerland)',
    'nl-NL': 'Dutch (Netherlands)', 'nl-BE': 'Dutch (Belgium)', 'ru-RU': 'Russian (Russia)', 'ru-UA': 'Russian (Ukraine)',
    'ar-EG': 'Arabic (Egypt)', 'ar-SA': 'Arabic (Saudi Arabia)', 'ar-MA': 'Arabic (Morocco)', 'ar-AE': 'Arabic (UAE)',
    'hi-IN': 'Hindi (India)', 'bn-IN': 'Bengali (India)', 'bn-BD': 'Bengali (Bangladesh)', 'ta-IN': 'Tamil (India)',
    'ta-LK': 'Tamil (Sri Lanka)', 'te-IN': 'Telugu (India)', 'mr-IN': 'Marathi (India)', 'gu-IN': 'Gujarati (India)',
    'kn-IN': 'Kannada (India)', 'ml-IN': 'Malayalam (India)', 'pa-IN': 'Punjabi (India)', 'pa-PK': 'Punjabi (Pakistan)',
    'ur-PK': 'Urdu (Pakistan)', 'ur-IN': 'Urdu (India)', 'ne-NP': 'Nepali (Nepal)', 'si-LK': 'Sinhala (Sri Lanka)',
    'km-KH': 'Khmer (Cambodia)', 'lo-LA': 'Lao (Laos)', 'my-MM': 'Burmese (Myanmar)', 'mn-MN': 'Mongolian (Mongolia)',
    'ka-GE': 'Georgian (Georgia)', 'hy-AM': 'Armenian (Armenia)', 'az-AZ': 'Azerbaijani (Azerbaijan)', 'kk-KZ': 'Kazakh (Kazakhstan)',
    'ky-KG': 'Kyrgyz (Kyrgyzstan)', 'tg-TJ': 'Tajik (Tajikistan)', 'tk-TM': 'Turkmen (Turkmenistan)', 'uz-UZ': 'Uzbek (Uzbekistan)',
    'af-ZA': 'Afrikaans (South Africa)', 'sw-KE': 'Swahili (Kenya)', 'sw-TZ': 'Swahili (Tanzania)', 'yo-NG': 'Yoruba (Nigeria)',
    'ig-NG': 'Igbo (Nigeria)', 'ha-NG': 'Hausa (Nigeria)', 'am-ET': 'Amharic (Ethiopia)', 'ti-ER': 'Tigrinya (Eritrea)',
    'ti-ET': 'Tigrinya (Ethiopia)', 'rw-RW': 'Kinyarwanda (Rwanda)', 'rn-BI': 'Kirundi (Burundi)', 'lg-UG': 'Luganda (Uganda)',
    'sn-ZW': 'Shona (Zimbabwe)', 'so-SO': 'Somali (Somalia)', 'mg-MG': 'Malagasy (Madagascar)', 'mt-MT': 'Maltese (Malta)',
    'is-IS': 'Icelandic (Iceland)', 'fo-FO': 'Faroese (Faroe Islands)', 'kl-GL': 'Greenlandic (Greenland)', 'se-NO': 'Northern Sami (Norway)'
};

const langName = (code) => {
    if (!code) return '?';
    const c = code.toLowerCase();
    if (LANG_NAMES[c]) return LANG_NAMES[c];
    const base = c.split('-')[0];
    if (LANG_NAMES[base]) return LANG_NAMES[base];
    return c.toUpperCase();
};

const translate = async (text, targetLang) => {
    try {
        // Primary: Google Translate
        const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'auto',
                tl: targetLang,
                dt: 't',
                q: text
            },
            timeout: 10000
        });
        const data = res.data;
        if (!data?.[0]) throw new Error('empty');
        return {
            translated: data[0].map(item => item?.[0] || '').join('').trim(),
            from: data?.[2] || 'auto'
        };
    } catch {}

    // Fallback: MyMemory
    const res2 = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: text, langpair: `auto|${targetLang}` },
        timeout: 10000
    });
    if (res2.data?.responseStatus!== 200) throw new Error('Translation service unavailable');
    return {
        translated: res2.data.responseData.translatedText,
        from: 'auto'
    };
};

const formatResult = (translatedText, fromLang, toLang) => {
    return `╭──────────────────────\n` +
           `│ 乂 *TRANSLATION*\n` +
           `│ ☬ ${langName(fromLang)} ➜ ${langName(toLang)}\n` +
           `╰──────────────────────\n` +
           `${translatedText}`;
};

module.exports = {
    translate,
    formatResult,
    loadDefaults,
    saveDefaults,
    langName
};