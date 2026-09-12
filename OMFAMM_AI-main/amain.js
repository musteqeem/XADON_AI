// XADON AI - PTERODACTYL STABLE VERSION - FIXED 2.0.2
// @musteqeem 25/08/26
// Deobfuscation with AI is strictly prohibited

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const readline = require('readline');
const fs = require('fs');
const chalk = require('chalk');
const gradient = require('gradient-string');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');

const {
    default: makeWASocket,
    Browsers,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    downloadContentFromMessage
} = require('@musteqeem/baileys');

const { smsg } = require('./library/serialize');
const { loadCommands } = require('./src/Plugin/xdnLoadCmd');
const { handleMessage } = require('./src/Plugin/xdnMsg');
const { xdnStatistic } = require('./src/Plugin/xdnStatistic');

// DO NOT CHANGE - FILE EXISTS
const setupMessageHandler = require('./?.js');

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, 'Public')));

app.get('/', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'Public/index.html'))
);

app.get('/ping', (req, res) =>
    res.status(200).send('OK')
);

// ======================================================
// GLOBALS
// ======================================================

global.botStats = {
    messages: 0,
    commands: 0,
    startTime: Date.now(),
    uptime: 0
};

global.botInstances = global.botInstances || new Map();
global.onlineUsers = global.onlineUsers || new Set();

if (!global.afk) {
    global.afk = new Map();
}

// ======================================================
// IGNORED ERRORS
// ======================================================

const ignoredErrors = [
    'ECONNRESET',
    'EKEYTYPE',
    'item-not-found',
    'rate-overlimit',
    'Timed Out',
    'ECONNREFUSED',
    'write ECONNRESET',
    'express',
    'Bad MAC',
    'Connection Closed',
    'network timeout',
    'read ECONNRESET',
    'Connection terminated',
    'Socket closed',
    'Socket connection timeout',
    'decrypt error',
    'Value not found',
    'Failed to decrypt message with any known session'
];

// ======================================================
// COLORS
// ======================================================

const rainbow = gradient(
    'cyan',
    'pink',
    'yellow',
    'green',
    'blue',
    'magenta'
);

const gold = chalk.hex('#FFD700').bold;
const cyan = chalk.cyanBright;
const magenta = chalk.magentaBright;
const blue = chalk.blueBright;
const green = chalk.greenBright;
const red = chalk.redBright;
const yellow = chalk.yellowBright;
const white = chalk.whiteBright;
const gray = chalk.gray;

const line = (color = cyan) =>
    color('━━━━━━━━━━━━━━━━━━');

// ======================================================
// CONFIG
// ======================================================

const loadConfig = () => {
    try {
        delete require.cache[
            require.resolve('./settings/config')
        ];

        return require('./settings/config');
    } catch (err) {
        console.log(
            yellow('[CONFIG] Could not load config, using defaults.')
        );

        return {};
    }
};

// ======================================================
// BANNER
// ======================================================

const showBanner = () => {
    console.clear();

    console.log(
        rainbow(`
╔══════════╗
║ ██╗  ██╗ █████╗ ██████╗  ██████╗ ███╗   ██╗ ║
║ ╚██╗██╔╝██╔══██╗██╔══██╗██╔═══██╗████╗  ██║ ║
║  ╚███╔╝ ███████║██████╔╝██║   ██║██╔██╗ ██║ ║
║  ██╔██╗ ██╔══██║██╔═══╝ ██║   ██║██║╚██╗██║ ║
║ ██╔╝ ██╗██║  ██║██║     ╚██████╔╝██║ ╚████║ ║
║ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ║
╚══════════════════════════════════════════╝
        `)
    );

    console.log(
        rainbow(' XADON AI V2.8.8.2 PREMIUM')
    );

    console.log(
        magenta.bold(' OMFAMM BOT CORE ENGINE - PRODUCTION')
    );

    console.log(line());

    console.log(
        white(' ©2026 ') +
        cyan('OMFAMM BOT') +
        white(' | Powered by ') +
        gold('XADON AI')
    );

    console.log(
        green(' Status: ') +
        green.bold('ULTRA STABLE ACTIVE')
    );

    console.log(line());
};

// ======================================================
// QUESTION
// ======================================================

const question = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(cyan(query), answer => {
            resolve(answer.trim());
            rl.close();
        });
    });
};

// ======================================================
// CONNECTION CONTROL
// ======================================================

let isConnecting = false;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let conflictAttempts = 0;

let authMethod = null; // pairing | qr
let activeSocket = null;
let reconnectGeneration = 0;

// Prevent endless bad-session loops
let badSessionDetected = false;

// Prevent repeated fatal session messages
let sessionErrorShown = false;

// ======================================================
// CLEAR RECONNECT
// ======================================================

const clearReconnect = () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
};

// ======================================================
// SCHEDULE RECONNECT
// ======================================================

const scheduleReconnect = (
    delay,
    reason = 'connection closed'
) => {
    if (reconnectTimeout) {
        return;
    }

    if (badSessionDetected) {
        console.log(
            yellow(
                '⛔ Reconnect blocked because the session requires fresh pairing.'
            )
        );

        return;
    }

    const generation = ++reconnectGeneration;

    const wait = Math.max(
        1000,
        Math.min(120000, delay)
    );

    console.log(
        yellow(
            `🔄 ${reason}. Reconnecting in ${Math.ceil(wait / 1000)}s...`
        )
    );

    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;

        if (
            generation !== reconnectGeneration ||
            isConnecting ||
            activeSocket ||
            badSessionDetected
        ) {
            return;
        }

        clientstart().catch(err => {
            console.error(
                red('[RECONNECT ERROR]'),
                err?.message || err
            );
        });

    }, wait);
};

// ======================================================
// DISCONNECT EXPLANATION
// ======================================================

const explainDisconnect = (
    statusCode,
    reason
) => {

    const explanations = {
        401:
            'Logged Out / Unauthorized → Session is no longer valid.',

        408:
            'Connection Lost / Timed Out → Network issue or WhatsApp timeout.',

        411:
            'Multidevice Mismatch → Library/session compatibility issue.',

        428:
            'Connection Closed → Temporary connection closure.',

        440:
            'Connection Replaced → Another connection replaced this session.',

        500:
            'Bad Session → Authentication/session state is invalid.',

        503:
            'Service Unavailable → WhatsApp service may be temporarily unavailable.',

        515:
            'Restart Required → WhatsApp requested a socket restart.'
    };

    const msg =
        explanations[statusCode] ||
        'Unknown disconnect reason.';

    console.log(
        yellow('📖 Explanation: ') +
        white(msg)
    );

    if (reason) {
        console.log(
            gray('   Raw reason: ' + reason)
        );
    }
};

// ======================================================
// CLIENT START
// ======================================================

const clientstart = async () => {

    if (isConnecting || activeSocket) {
        console.log(
            yellow(
                '⏳ Already connecting, skipping...'
            )
        );

        return;
    }

    if (badSessionDetected) {
        console.log(
            red(
                '⛔ Connection start blocked: session requires fresh pairing.'
            )
        );

        return;
    }

    isConnecting = true;
    clearReconnect();

    let storeCleanupInterval = null;

    try {

        const config = loadConfig();

        showBanner();

        const sessionPath = path.resolve(
            './' + (config.session || 'sessions')
        );

        // ==================================================
        // SESSION DIRECTORY
        // ==================================================

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(
                sessionPath,
                {
                    recursive: true
                }
            );
        }

        // ==================================================
        // MESSAGE STORE
        // ==================================================

        const store = {

            messages: new Map(),

            contacts: new Map(),

            groupMetadata: new Map(),

            presences: {},

            loadMessage: async (jid, id) => {
                return (
                    store.messages.get(
                        jid + ':' + id
                    ) || null
                );
            },

            bind: (ev) => {

                ev.on(
                    'messages.upsert',
                    ({ messages }) => {

                        for (const msg of messages) {

                            if (
                                msg?.key?.remoteJid &&
                                msg?.key?.id
                            ) {

                                store.messages.set(
                                    msg.key.remoteJid +
                                    ':' +
                                    msg.key.id,
                                    msg
                                );
                            }
                        }
                    }
                );

                ev.on(
                    'contacts.update',
                    contacts => {

                        for (const contact of contacts) {

                            if (contact?.id) {
                                store.contacts.set(
                                    contact.id,
                                    contact
                                );
                            }
                        }
                    }
                );
            }
        };

        // ==================================================
        // STORE CLEANUP
        // ==================================================

        storeCleanupInterval = setInterval(() => {

            if (store.messages.size > 300) {
                store.messages.clear();
            }

        }, 300000);

        // ==================================================
        // AUTH STATE
        // ==================================================

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            sessionPath
        );

        // ==================================================
        // BAILEYS VERSION
        // ==================================================

        const {
            version
        } = await fetchLatestBaileysVersion();

        // ==================================================
        // AUTH METHOD
        // ==================================================

        if (
            !state.creds.registered &&
            !authMethod
        ) {

            console.log(
                rainbow(
                    '\n╔════════════════════════════════════╗'
                )
            );

            console.log(
                magenta.bold(
                    '║     CHOOSE LOGIN METHOD            ║'
                )
            );

            console.log(
                rainbow(
                    '╚════════════════════════════════════╝\n'
                )
            );

            console.log(
                white(
                    '1. Pairing Code  (Recommended for servers)'
                )
            );

            console.log(
                white(
                    '2. QR Code\n'
                )
            );

            const choice = await question(
                blue('→ Enter 1 or 2: ')
            );

            if (choice === '2') {

                authMethod = 'qr';

                console.log(
                    green(
                        '\n✅ QR Code mode selected\n'
                    )
                );

            } else {

                authMethod = 'pairing';

                console.log(
                    green(
                        '\n✅ Pairing Code mode selected\n'
                    )
                );
            }
        }

        // ==================================================
        // CREATE SOCKET
        // ==================================================

        const sock = makeWASocket({

            logger: pino({
                level: 'silent'
            }),

            auth: state,

            version,

            browser:
                Browsers.macOS('Chrome'),

            connectTimeoutMs:
                60000,

            keepAliveIntervalMs:
                30000,

            retryRequestDelayMs:
                250,

            maxMsgRetryCount:
                5,

            fireInitQueries:
                true,

            syncFullHistory:
                false,

            markOnlineOnConnect:
                false,

            printQRInTerminal:
                false,

            generateHighQualityLinkPreview:
                true,

            getMessage: async (key) => {

                const msg =
                    await store.loadMessage(
                        key.remoteJid,
                        key.id
                    );

                return msg?.message || undefined;
            }
        });

        // ==================================================
        // ACTIVE SOCKET
        // ==================================================

        activeSocket = sock;

        store.bind(sock.ev);

        sock.store = store;

        // ==================================================
        // HELPERS
        // ==================================================

        sock.decodeJid = (jid) => {

            if (!jid) {
                return jid;
            }

            if (/:\\d+@/gi.test(jid)) {

                const decoded =
                    jidDecode(jid) || {};

                if (
                    decoded.user &&
                    decoded.server
                ) {

                    return (
                        decoded.user +
                        '@' +
                        decoded.server
                    );
                }
            }

            return jid;
        };

        sock.public =
            config.status?.public ?? true;

        // ==================================================
        // DOWNLOAD MEDIA
        // ==================================================

        sock.downloadMediaMessage =
            async (msg) => {

                try {

                    const mtype =
                        Object.keys(
                            msg?.message || {}
                        )[0];

                    if (!mtype) {
                        return null;
                    }

                    const content =
                        mtype.replace(
                            'Message',
                            ''
                        );

                    const stream =
                        await downloadContentFromMessage(
                            msg.message[mtype],
                            content
                        );

                    let buffer =
                        Buffer.from([]);

                    for await (
                        const chunk of stream
                    ) {
                        buffer = Buffer.concat([
                            buffer,
                            chunk
                        ]);
                    }

                    return buffer;

                } catch (err) {

                    console.log(
                        yellow(
                            '[DOWNLOAD MEDIA ERROR]'
                        ),
                        err?.message || err
                    );

                    return null;
                }
            };

        // ==================================================
        // SEND TEXT
        // ==================================================

        sock.sendText = (
            jid,
            text,
            quoted = '',
            options = {}
        ) => {

            return sock.sendMessage(
                jid,
                {
                    text,
                    ...options
                },
                {
                    quoted
                }
            );
        };

        // ==================================================
        // CONNECTION HANDLER
        // ==================================================

        let pairingRequested = false;

        sock.ev.on(
            'connection.update',
            async (update) => {

                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update;

                // ==================================================
                // QR MODE
                // ==================================================

                if (
                    qr &&
                    authMethod === 'qr' &&
                    !state.creds.registered
                ) {

                    console.log(
                        rainbow(
                            '\n SCAN THIS QR CODE WITH WHATSAPP \n'
                        )
                    );

                    qrcode.generate(
                        qr,
                        {
                            small: true
                        }
                    );
                }

                // ==================================================
                // PAIRING CODE MODE
                // ==================================================

                if (
                    authMethod === 'pairing' &&
                    connection === 'connecting' &&
                    !state.creds.registered &&
                    !pairingRequested
                ) {

                    pairingRequested = true;

                    try {

                        await new Promise(
                            resolve =>
                                setTimeout(
                                    resolve,
                                    1500
                                )
                        );

                        console.log(
                            rainbow(
                                '\n╔════════════════════════════════════╗'
                            )
                        );

                        console.log(
                            magenta.bold(
                                '║     XADON AI - PAIRING CODE        ║'
                            )
                        );

                        console.log(
                            rainbow(
                                '╚════════════════════════════════════╝\n'
                            )
                        );

                        const number =
                            await question(
                                blue(
                                    '📱 Enter WhatsApp Number (country code, no +):\n'
                                ) +
                                yellow(
                                    'Example: 234123456789\n→ '
                                )
                            );

                        const cleanNumber =
                            number.replace(
                                /[^0-9]/g,
                                ''
                            );

                        if (
                            !cleanNumber ||
                            cleanNumber.length < 10
                        ) {

                            console.log(
                                red(
                                    '❌ Invalid number.'
                                )
                            );

                            pairingRequested = false;

                            return;
                        }

                        console.log(
                            yellow(
                                '\n🔄 Generating Pairing Code...'
                            )
                        );

                        const code =
                            await sock.requestPairingCode(
                                cleanNumber,
                                'XADONITE'
                            );

                        console.log(
                            chalk.green(
                                '\n╔════════════════════════════════════╗'
                            )
                        );

                        console.log(
                            chalk.cyan.bold(
                                '║  ✅ PAIRING CODE GENERATED         ║'
                            )
                        );

                        console.log(
                            chalk.cyan.bold(
                                `║  Code: ${code}                     ║`
                            )
                        );

                        console.log(
                            chalk.cyan.bold(
                                '║                                    ║'
                            )
                        );

                        console.log(
                            chalk.white(
                                '║  1. Open WhatsApp                  ║'
                            )
                        );

                        console.log(
                            chalk.white(
                                '║  2. Settings → Linked Devices      ║'
                            )
                        );

                        console.log(
                            chalk.white(
                                '║  3. Link a Device                  ║'
                            )
                        );

                        console.log(
                            chalk.white(
                                '║  4. Link with phone number         ║'
                            )
                        );

                        console.log(
                            chalk.white(
                                '║  5. Enter the code above           ║'
                            )
                        );

                        console.log(
                            chalk.cyan.bold(
                                '╚════════════════════════════════════╝\n'
                            )
                        );

                    } catch (err) {

                        console.log(
                            red('Pairing error:'),
                            err?.message || err
                        );

                        pairingRequested = false;
                    }
                }

                // ==================================================
                // CONNECTING
                // ==================================================

                if (connection === 'connecting') {

                    console.log(
                        cyan(
                            '🔄 Connecting to WhatsApp Servers...'
                        )
                    );
                }

                // ==================================================
                // OPEN
                // ==================================================

                if (connection === 'open') {

                    isConnecting = false;

                    reconnectAttempts = 0;

                    conflictAttempts = 0;

                    badSessionDetected = false;

                    sessionErrorShown = false;

                    clearReconnect();

                    reconnectGeneration++;

                    const botId =
                        sock.user?.id
                            ?.split(':')[0];

                    if (botId) {

                        global.botInstances.set(
                            botId,
                            sock
                        );
                    }

                    console.log(
                        green.bold(
                            '\n✅ SUCCESSFULLY CONNECTED TO XADON AI'
                        )
                    );

                    console.log(
                        cyan('📱 Number: ') +
                        gold(botId || 'Unknown')
                    );

                    console.log(
                        magenta('🌐 Dashboard: ') +
                        blue(
                            `http://localhost:${port}`
                        )
                    );

                    console.log(
                        line(green) + '\n'
                    );

                    io.emit(
                        'bot-status',
                        {
                            status:
                                'connected',

                            number:
                                botId,

                            name:
                                sock.user?.name
                        }
                    );

                    // ==================================================
                    // CONNECTED MESSAGE
                    // ==================================================

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                2500
                            )
                    );

                    if (!sock.user?.id) {
                        return;
                    }

                    const userId =
                        botId +
                        '@s.whatsapp.net';

                    const thumbUrl =
                        config.branding?.thumbUrl ||
                        'https://files.catbox.moe/bkvkel.jpeg';

                    try {

                        await sock.sendMessage(
                            userId,
                            {
                                image: {
                                    url:
                                        thumbUrl
                                },

                                caption:
                                    `\`×͜× BOT IS LIVE! ✧\`\n` +
                                    `*${config.branding?.title || 'XADON AI'}* is Online!\n\n` +
                                    `𝓂𝓊𝓈𝓉ℯ𝓆ℯ𝓂 𝓋𝑒𝓇𝒾𝒻𝒾𝑒𝒹\n` +
                                    `❏▸ Prefix ⇆ [ ${config.settings?.prefix || '.'} ]\n` +
                                    `❏▸ Mode ⇆ ${config.status?.public ? 'Public' : 'Private'}\n` +
                                    `❏┃ Version ⇆ OMFAMM BOT\n` +
                                    `╚════════╝`,

                                contextInfo: {

                                    isForwarded:
                                        true,

                                    forwardedNewsletterMessageInfo:
                                    {
                                        newsletterJid:
                                            '120363423325164241@newsletter',

                                        newsletterName:
                                            'XADON AI',

                                        serverMessageId:
                                            1
                                    },

                                    externalAdReply:
                                    {
                                        title:
                                            config.branding?.title ||
                                            'XADON AI',

                                        body:
                                            'XADON AI - Stable Uptime',

                                        sourceUrl:
                                            'https://whatsapp.com/channel/0029Vb7ACifD38Cb7Jlj5w3B',

                                        thumbnailUrl:
                                            thumbUrl,

                                        mediaType:
                                            1,

                                        renderLargerThumbnail:
                                            false,

                                        showAdAttribution:
                                            true
                                    }
                                }
                            }
                        );

                        console.log(
                            green(
                                '✅ Connected message sent!'
                            )
                        );

                    } catch (err) {

                        console.log(
                            yellow(
                                '[Connected msg failed]'
                            ),
                            err?.message || err
                        );
                    }
                }

                // ==================================================
                // CONNECTION CLOSED
                // ==================================================

                if (connection === 'close') {

                    // Ignore events from old sockets
                    if (sock !== activeSocket) {
                        return;
                    }

                    // Clear store cleanup timer
                    if (storeCleanupInterval) {
                        clearInterval(
                            storeCleanupInterval
                        );

                        storeCleanupInterval = null;
                    }

                    isConnecting = false;

                    activeSocket = null;

                    const statusCode =
                        new Boom(
                            lastDisconnect?.error
                        )?.output?.statusCode;

                    const reason =
                        lastDisconnect?.error
                            ?.message || '';

                    console.log(
                        red(
                            '\n❌ Connection closed'
                        )
                    );

                    console.log(
                        red('   Status Code :'),
                        red(
                            String(
                                statusCode ||
                                'Unknown'
                            )
                        )
                    );

                    console.log(
                        gray('   Reason      :'),
                        gray(reason)
                    );

                    explainDisconnect(
                        statusCode,
                        reason
                    );

                    // ==================================================
                    // REMOVE INSTANCE
                    // ==================================================

                    if (sock.user?.id) {

                        global.botInstances.delete(
                            sock.user.id.split(':')[0]
                        );
                    }

                    // ==================================================
                    // 401 LOGGED OUT
                    // ==================================================

                    if (
                        statusCode ===
                        DisconnectReason.loggedOut ||
                        statusCode === 401
                    ) {

                        const isConflict =
                            reason
                                .toLowerCase()
                                .includes(
                                    'conflict'
                                );

                        // Try conflict recovery a few times
                        if (
                            isConflict &&
                            conflictAttempts < 3
                        ) {

                            conflictAttempts++;

                            console.log(
                                yellow(
                                    `⚠️ Session conflict detected (attempt ${conflictAttempts}/3)`
                                )
                            );

                            console.log(
                                yellow(
                                    '   → Another device may be using the same session.'
                                )
                            );

                            console.log(
                                yellow(
                                    '   → Trying to reconnect in 8 seconds...\n'
                                )
                            );

                            scheduleReconnect(
                                8000,
                                'session conflict detected'
                            );

                            return;
                        }

                        // Genuine logout
                        badSessionDetected = true;

                        console.log(
                            red.bold(
                                '\n⛔ SESSION LOGGED OUT'
                            )
                        );

                        console.log(
                            yellow(
                                'The bot will NOT keep restarting.'
                            )
                        );

                        console.log(
                            white(
                                'If you intentionally logged out the device, delete the sessions folder and pair again.'
                            )
                        );

                        console.log(
                            white(
                                'The bot is now waiting instead of entering a restart loop.\n'
                            )
                        );

                        return;
                    }

                    // ==================================================
                    // 500 BAD SESSION
                    // ==================================================

                    if (
                        statusCode ===
                        DisconnectReason.badSession ||
                        statusCode === 500
                    ) {

                        badSessionDetected = true;

                        if (!sessionErrorShown) {

                            sessionErrorShown = true;

                            console.log(
                                red.bold(
                                    '\n⛔ BAD SESSION DETECTED'
                                )
                            );

                            console.log(
                                yellow(
                                    'The existing authentication state is invalid.'
                                )
                            );

                            console.log(
                                yellow(
                                    'Automatic session deletion has been DISABLED.'
                                )
                            );

                            console.log(
                                white(
                                    '\nTo repair it safely:'
                                )
                            );

                            console.log(
                                white(
                                    '1. Stop the bot.'
                                )
                            );

                            console.log(
                                white(
                                    '2. Delete the sessions folder.'
                                )
                            );

                            console.log(
                                white(
                                    '3. Start the bot again.'
                                )
                            );

                            console.log(
                                white(
                                    '4. Pair the WhatsApp account again.'
                                )
                            );

                            console.log(
                                green(
                                    '\n✅ No more automatic BAD SESSION restart loop.\n'
                                )
                            );
                        }

                        io.emit(
                            'bot-status',
                            {
                                status:
                                    'session_error',

                                message:
                                    'Fresh pairing required'
                            }
                        );

                        return;
                    }

                    // ==================================================
                    // 515 RESTART REQUIRED
                    // ==================================================

                    if (
                        statusCode ===
                        DisconnectReason.restartRequired ||
                        statusCode === 515
                    ) {

                        console.log(
                            yellow(
                                '\n🔄 Restart Required by WhatsApp'
                            )
                        );

                        console.log(
                            yellow(
                                'Reconnecting in 2.5 seconds while keeping session...\n'
                            )
                        );

                        scheduleReconnect(
                            2500,
                            'WhatsApp requested a connection restart'
                        );

                        return;
                    }

                    // ==================================================
                    // 408 / 428 / 503 / OTHER RECOVERABLE
                    // ==================================================

                    reconnectAttempts++;

                    const delay =
                        Math.min(
                            120000,
                            5000 *
                            Math.pow(
                                2,
                                Math.min(
                                    reconnectAttempts - 1,
                                    4
                                )
                            )
                        );

                    scheduleReconnect(
                        delay,
                        `recoverable disconnect (attempt ${reconnectAttempts})`
                    );
                }
            }
        );

        // ==================================================
        // CREDENTIALS
        // ==================================================

        sock.ev.on(
            'creds.update',
            saveCreds
        );

        // ==================================================
        // MESSAGE HANDLER
        // ==================================================

        setupMessageHandler(
            sock,
            store,
            handleMessage,
            smsg,
            io,
            loadConfig
        );

        // ==================================================
        // GROUP WELCOME / GOODBYE
        // ==================================================

        sock.ev.on(
            'group-participants.update',
            async (update) => {

                try {

                    const groupEventsPath =
                        path.resolve(
                            process.cwd(),
                            'database/groupEvents.json'
                        );

                    if (
                        !fs.existsSync(
                            groupEventsPath
                        )
                    ) {
                        return;
                    }

                    const groupEvents =
                        JSON.parse(
                            fs.readFileSync(
                                groupEventsPath,
                                'utf8'
                            )
                        );

                    if (
                        !groupEvents[
                            update.id
                        ]?.enabled
                    ) {
                        return;
                    }

                    const metadata =
                        await sock.groupMetadata(
                            update.id
                        );

                    const memberCount =
                        metadata.participants.length;

                    const groupName =
                        metadata.subject;

                    for (
                        const participant
                        of update.participants
                    ) {

                        const userId =
                            typeof participant === 'string'
                                ? participant
                                : participant.id;

                        if (
                            update.action === 'add'
                        ) {

                            let ppUrl =
                                'https://files.catbox.moe/bkvkel.jpeg';

                            try {

                                ppUrl =
                                    await sock.profilePictureUrl(
                                        userId,
                                        'image'
                                    );

                            } catch {}

                            await sock.sendMessage(
                                update.id,
                                {
                                    image: {
                                        url:
                                            ppUrl
                                    },

                                    caption:
                                        `❏┃ Welcome to *${groupName}*\n` +
                                        `👋 @${userId.split('@')[0]}!\n` +
                                        `❏┃ Members: ${memberCount}\n` +
                                        `❏┃ ${groupEvents[update.id].welcome || 'Welcome to the group!'}\n\n` +
                                        `╚════════╝`,

                                    mentions: [
                                        userId
                                    ]
                                }
                            );
                        }

                        if (
                            update.action === 'remove'
                        ) {

                            await sock.sendMessage(
                                update.id,
                                {
                                    text:
                                        `❏┃ @${userId.split('@')[0]} left *${groupName}*\n` +
                                        `❏┃ ${groupEvents[update.id].goodbye || 'Goodbye!'}\n` +
                                        `❏┃ Members: ${memberCount}\n` +
                                        `╚════════╝`,

                                    mentions: [
                                        userId
                                    ]
                                }
                            );
                        }
                    }

                } catch (err) {

                    const errorText =
                        err?.message || '';

                    if (
                        !ignoredErrors.some(
                            e =>
                                errorText.includes(e)
                        )
                    ) {

                        console.log(
                            red(
                                '[Group Events Error]'
                            ),
                            errorText
                        );
                    }
                }
            }
        );

        // ==================================================
        // CONTACTS UPDATE
        // ==================================================

        sock.ev.on(
            'contacts.update',
            contacts => {

                for (
                    const contact
                    of contacts
                ) {

                    if (!contact?.id) {
                        continue;
                    }

                    store.contacts.set(
                        contact.id,
                        {
                            id:
                                contact.id,

                            name:
                                contact.name ||
                                contact.notify ||
                                null
                        }
                    );
                }
            }
        );

        return sock;

    } catch (err) {

        isConnecting = false;

        activeSocket = null;

        if (storeCleanupInterval) {
            clearInterval(
                storeCleanupInterval
            );

            storeCleanupInterval = null;
        }

        console.error(
            red('[CLIENT START ERROR]'),
            err?.message || err
        );

        // Do not reconnect if this looks like a
        // permanent authentication/session failure.
        const errorText =
            String(
                err?.message ||
                err ||
                ''
            );

        const permanentSessionError =
            errorText.includes(
                'Bad session'
            ) ||
            errorText.includes(
                'badSession'
            ) ||
            errorText.includes(
                '401'
            );

        if (permanentSessionError) {

            badSessionDetected = true;

            console.log(
                red(
                    '⛔ Authentication/session error detected.'
                )
            );

            console.log(
                yellow(
                    'Automatic restart disabled. Fresh pairing may be required.'
                )
            );

            return;
        }

        scheduleReconnect(
            10000,
            'startup error'
        );
    }
};

// ======================================================
// ERROR HANDLERS
// ======================================================

process.on(
    'uncaughtException',
    err => {

        const errorText =
            String(
                err?.message ||
                err ||
                ''
            );

        if (
            ignoredErrors.some(
                e =>
                    errorText.includes(e)
            )
        ) {
            return;
        }

        console.log(
            red('[UNCAUGHT EXCEPTION]'),
            errorText
        );
    }
);

process.on(
    'unhandledRejection',
    err => {

        const errorText =
            String(
                err?.message ||
                err ||
                ''
            );

        if (
            ignoredErrors.some(
                e =>
                    errorText.includes(e)
            )
        ) {
            return;
        }

        console.log(
            red('[UNHANDLED REJECTION]'),
            errorText
        );
    }
);

// ======================================================
// START
// ======================================================

(async () => {

    try {

        const config =
            loadConfig();

        const sessionFolder =
            './' +
            (config.session ||
                'sessions');

        // ==================================================
        // DATABASE
        // ==================================================

        if (
            !fs.existsSync(
                './database'
            )
        ) {

            fs.mkdirSync(
                './database',
                {
                    recursive: true
                }
            );
        }

        if (
            !fs.existsSync(
                sessionFolder
            )
        ) {

            fs.mkdirSync(
                sessionFolder,
                {
                    recursive: true
                }
            );
        }

        if (
            !fs.existsSync(
                './database/antilink.json'
            )
        ) {

            fs.writeFileSync(
                './database/antilink.json',
                '{}'
            );
        }

        if (
            !fs.existsSync(
                './database/groupEvents.json'
            )
        ) {

            fs.writeFileSync(
                './database/groupEvents.json',
                '{}'
            );
        }

        if (
            !fs.existsSync(
                './database/runtime-config.json'
            )
        ) {

            fs.writeFileSync(
                './database/runtime-config.json',
                '{}'
            );
        }

        // ==================================================
        // LOAD COMMANDS
        // ==================================================

        loadCommands();

        // ==================================================
        // DASHBOARD
        // ==================================================

        server.listen(
            port,
            () => {

                console.log(
                    cyan(
                        '✅ Xadon dashboard: '
                    ) +
                    blue(
                        `http://localhost:${port}`
                    )
                );
            }
        );

        // ==================================================
        // STATISTICS
        // ==================================================

        xdnStatistic(
            app,
            io
        );

        // ==================================================
        // SOCKET.IO
        // ==================================================

        io.on(
            'connection',
            socket => {

                console.log(
                    white(
                        '👤 Dashboard connected'
                    )
                );

                socket.emit(
                    'stats',
                    global.botStats
                );

                socket.on(
                    'disconnect',
                    () => {

                        console.log(
                            yellow(
                                '👤 Dashboard disconnected'
                            )
                        );
                    }
                );
            }
        );

        // ==================================================
        // START BOT
        // ==================================================

        await clientstart();

    } catch (err) {

        console.error(
            red('[STARTUP ERROR]'),
            err?.message || err
        );
    }

})();