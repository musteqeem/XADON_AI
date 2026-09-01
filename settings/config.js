// © 2026 XADON AI V2 --- POWERED BY MUSTEQEEM
const fs = require('fs');
const path = require('path');
const { getVar } = require('../src/Plugin/configManager');

const USER_CONFIG_PATH = path.join(__dirname, '../database/user-config.json');
let userConfig = {};
try {
    if (fs.existsSync(USER_CONFIG_PATH)) {
        userConfig = JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf8'));
    }
} catch {}

const getSessionNumber = () => {
    try {
        const credsPath = path.join(__dirname, '../sessions/creds.json');
        if (fs.existsSync(credsPath)) {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            const rawId = creds?.me?.id;
            if (rawId) return rawId.split(':')[0].split('@')[0];
        }
    } catch {}
    return null;
};

const defaultNumber = process.env.OWNER_NUMBER || '2349027879263';
const resolvedOwner =
    process.env.OWNER_NUMBER ||
    getVar('OWNER_NUMBER') ||
    userConfig?.owner?.number ||
    getSessionNumber() ||
    defaultNumber;

const config = {
    owner: resolvedOwner,
    botNumber: process.env.BOT_NUMBER || getVar('BOT_NUMBER') || userConfig?.bot?.number || getSessionNumber() || defaultNumber,
    session: 'sessions', // FIX 1: FORCE 'sessions'. Don't allow.env to change it
    thumbUrl: process.env.THUMB_URL || getVar('THUMB_URL') || userConfig?.thumbUrl || 'https://files.catbox.moe/bkvkel.jpeg',

    panelApiPort: process.env.PANEL_API_PORT || getVar('PANEL_API_PORT') || userConfig?.panelApiPort || 9000,
    panelRoot: process.env.PANEL_ROOT || getVar('PANEL_ROOT') || userConfig?.panelRoot || process.cwd(),

    status: {
        public: process.env.PUBLIC_MODE!== undefined? process.env.PUBLIC_MODE === 'true' : (getVar('PUBLIC_MODE')?? userConfig?.bot?.public?? true),
        terminal: false, // FIX 2: FORCE FALSE. Pairing code is more stable than QR for PM2
        reactsw: process.env.REACT_STATUS!== undefined? process.env.REACT_STATUS!== 'false' : (getVar('REACT_STATUS')?? userConfig?.bot?.reactsw?? true),
        requestPairingCode: true // FIX 3: FORCE TRUE. Only asks once then uses session
    },

    mode: {
        autoRead: process.env.AUTO_READ!== 'false',
        autoTyping: process.env.AUTO_TYPING === 'true',
        autoRecording: process.env.AUTO_RECORDING === 'true',
        alwaysOnline: process.env.ALWAYS_ONLINE === 'true',
        selfBot: process.env.SELF_BOT === 'true'
    },

    settings: {
        title: process.env.BOT_NAME || getVar('BOT_NAME') || userConfig?.bot?.name || 'XADON AI',
        packname: process.env.BOT_NAME || getVar('BOT_NAME') || userConfig?.bot?.name || 'XADON AI',
        prefix: (() => {
            const envPrefix = process.env.PREFIX;
            if (envPrefix!== undefined) return (envPrefix === 'null' || envPrefix === '')? '' : envPrefix;
            const runtimePrefix = getVar('PREFIX');
            if (runtimePrefix!== undefined && runtimePrefix!== null) return (runtimePrefix === 'null' || runtimePrefix === '')? '' : runtimePrefix;
            const userPrefix = userConfig?.bot?.prefix;
            if (userPrefix!== undefined && userPrefix!== null) return (userPrefix === 'null' || userPrefix === '')? '' : userPrefix;
            return '.';
        })(),
        description: 'Professional WhatsApp Bot — OMFAMM BOT powered by XADON AI V2',
        author: 'https://github.com/musteqeem/XADON_AI',
        footer: '© OMFAMM BOT | Powered by XADON AI',
        ownerJid: getVar('OWNER_JID') || userConfig?.owner?.jid || `${resolvedOwner}@s.whatsapp.net`,
        ownerName: process.env.OWNER_NAME || getVar('OWNER_NAME') || userConfig?.owner?.name || 'XADON OWNER'
    },

    permissions: {
        owners: process.env.OWNER_NUMBERS? process.env.OWNER_NUMBERS.split(',').map(n => n.trim() + '@s.whatsapp.net') : [`${resolvedOwner}@s.whatsapp.net`],
        premium: [],
        banned: []
    },

    message: {
        owner: '`❦︎ OWNER ONLY CMD! ☠︎︎`',
        group: '`༒︎ GROUP ONLY CMD! 𓂀`',
        admin: '`✪ ONLY FOR GROUP ADMINS ⍟`',
        private: '*❁ USE THIS CMD IN YOUR DM 𖦹*'
    },

    mess: {
        owner: '`❦︎OWNER ONLY CMD!`',
        done: '`☻︎ Mode changed!`',
        error: '*Something went wrong! ✘*',
        wait: '֎ *_Please wait... _*'
    },

    autoReply: {
        enabled: process.env.AUTO_REPLY!== 'false',
        ai: {
            enabled: true,
            apiUrl: process.env.AI_API_URL || 'https://all-in-1-ais.officialhectormanuel.workers.dev/',
            model: process.env.AI_MODEL || 'gpt-4.5-preview',
            maxMemory: 10
        },
        greetings: {
            enabled: true,
            keywords: ['hi', 'hello', 'hey', 'morning', 'afternoon', 'evening'],
            response: 'Hello! 👋 How can OMFAMM BOT help you today?'
        }
    },

    newsletter: {
        name: process.env.BOT_NAME || getVar('BOT_NAME') || 'XADON AI',
        id: '120363423325164241@newsletter'
    },

    api: {
        baseurl: process.env.API_BASEURL || getVar('API_BASEURL') || 'https://hector-api.vercel.app/',
        apikey: process.env.API_KEY || getVar('API_KEY') || 'hector',
        groq: process.env.GROQ_API_KEY || getVar('GROQ_API_KEY') || '',
        openai: process.env.OPENAI_API_KEY || getVar('OPENAI_API_KEY') || '',
        weather: process.env.WEATHER_API_KEY || getVar('WEATHER_API_KEY') || 'e6926030169752d7e0d85377e489c415',
        gateway: process.env.GATEWAY_URL || getVar('GATEWAY_URL') || 'https://api.xadon.link',
        gatewayToken: process.env.GATEWAY_TOKEN || getVar('GATEWAY_TOKEN') || 'x',
        cdn: process.env.CDN_URL || getVar('CDN_URL') || 'https://cdn.musteqeem.link',
        imageBase: process.env.IMAGE_API_BASE || getVar('IMAGE_API_BASE') || 'https://apis.prexzyvilla.site/ai',
        removebg: process.env.REMOVE_BG_API_KEY || getVar('REMOVE_BG_API_KEY') || 'fy5Va5Qivw2BUQoojeSzzcHp'
    },

    sticker: {
        packname: process.env.BOT_NAME || getVar('BOT_NAME') || 'XADON AI',
        author: process.env.STICKER_AUTHOR || getVar('STICKER_AUTHOR') || 'XADON AI'
    },

    branding: {
        title: process.env.BOT_NAME || getVar('BOT_NAME') || userConfig?.bot?.name || 'XADON AI', // FIX 4: ADDED THIS. Your ֎.js needs it
        footer: '© OMFAMM BOT | Powered by XADON AI',
        channel: 'https://whatsapp.com/channel/0029Vb7ACifD38Cb7Jlj5w3B',
        group: process.env.GROUP_LINK || 'https://chat.whatsapp.com/Jbbz2eVEXqa0phS37OlSKs?mode=gi_t',
        repo: 'https://github.com/musteqeem/XADON_AI'
    },

    logging: {
        level: 'silent', // FIX 5: FORCE SILENT. Saves RAM for 1 month
        logCommands: true,
        logMessages: false
    },

    statusHandler: {
        autoView: process.env.AUTO_STATUS_VIEW!== undefined? process.env.AUTO_STATUS_VIEW!== 'false' : (getVar('AUTO_STATUS_VIEW')?? true),
        autoLike: process.env.AUTO_STATUS_LIKE!== undefined? process.env.AUTO_STATUS_LIKE!== 'false' : (getVar('AUTO_STATUS_LIKE')?? true),
        statusEmoji: process.env.STATUS_EMOJI || getVar('STATUS_EMOJI') || '❤️‍🔥',
        ghostMode: process.env.GHOST_MODE!== undefined? process.env.GHOST_MODE!== 'false' : (getVar('GHOST_MODE')?? false)
    }
};

module.exports = config;