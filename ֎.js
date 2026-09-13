// XADON AI - PTERODACTYL STABLE VERSION - SESSION-PERSISTENT 2.0.3
// @musteqeem 12/09/26
// Session files are NEVER automatically deleted.
// Connection errors ONLY restart/reconnect the socket.
//
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

const {
    default: makeWASocket,
    Browsers,
    useMultiFileAuthState,
    DisconnectReason,
    jidDecode,
    downloadContentFromMessage
} = require('@musteqeem/baileys');

const { smsg } = require('./library/serialize');
const { loadCommands } = require('./src/Plugin/xdnLoadCmd');
const { handleMessage } = require('./src/Plugin/xdnMsg');
const { xdnStatistic } = require('./src/Plugin/xdnStatistic');
const setupMessageHandler = require('./?.js');


// ============================================================
// SERVER
// ============================================================

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


// ============================================================
// GLOBAL STATE
// ============================================================

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


// ============================================================
// ERROR STRINGS THAT DON'T NEED HUGE LOG SPAM
// ============================================================

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


// ============================================================
// COLORS
// ============================================================

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
    color('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');


// ============================================================
// CONFIG
// ============================================================

const loadConfig = () => {
    try {
        delete require.cache[require.resolve('./settings/config')];
        return require('./settings/config');
    } catch (err) {
        console.log(yellow('[CONFIG] Could not reload config:'), err.message);
        return {};
    }
};


const safeJson = (value) => {
    if (value === undefined) return 'undefined';
    try {
        return JSON.stringify(value, (key, val) => {
            if (Buffer.isBuffer(val)) return `<Buffer ${val.length} bytes>`;
            if (typeof val === 'bigint') return val.toString();
            return val;
        });
    } catch {
        return String(value);
    }
};


// ============================================================
// BANNER
// ============================================================

const showBanner = () => {
    console.clear();

    console.log(rainbow(`
╔══════════╗
║ ██╗  ██╗ █████╗ ██████╗  ██████╗ ███╗   ██╗ ║
║ ╚██╗██╔╝██╔══██╗██╔══██╗██╔═══██╗████╗  ██║ ║
║  ╚███╔╝ ███████║██████╔╝██║   ██║██╔██╗ ██║ ║
║  ██╔██╗ ██╔══██║██╔═══╝ ██║   ██║██║╚██╗██║ ║
║ ██╔╝ ██╗██║  ██║██║     ╚██████╔╝██║ ╚████║ ║
║ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ║
╚══════════════════════════════════════════╝
    `));

    console.log(rainbow(' XADON AI V2.8.8.2 PREMIUM'));
    console.log(magenta.bold(' OMFAMM BOT CORE ENGINE - PRODUCTION'));
    console.log(line());

    console.log(
        white(' ©2026 ') +
        cyan('OMFAMM BOT') +
        white(' | Powered by ') +
        gold('XADON AI')
    );

    console.log(
        green(' Status: ') +
        green.bold('SESSION-PERSISTENT ULTRA STABLE')
    );

    console.log(line());
};


// ============================================================
// TERMINAL QUESTION
// ============================================================

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


// ============================================================
// CONNECTION CONTROL
// ============================================================

let isConnecting = false;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let conflictAttempts = 0;

let authMethod = null;

let activeSocket = null;

let reconnectGeneration = 0;

// Prevent two Pterodactyl/PM2 processes from opening the same auth state.
// Only the lock file is removable; WhatsApp session files are never touched.
let sessionLockPath = null;
let sessionLockOwned = false;

const acquireSessionLock = (sessionPath) => {
    const lockPath = path.join(sessionPath, '.xadon-session.lock');

    const readLockPid = () => {
        try {
            return Number(JSON.parse(fs.readFileSync(lockPath, 'utf8'))?.pid) || 0;
        } catch {
            return 0;
        }
    };

    const pidIsAlive = (pid) => {
        if (!pid) return false;
        try {
            process.kill(pid, 0);
            return true;
        } catch (err) {
            return err?.code !== 'ESRCH';
        }
    };

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const fd = fs.openSync(lockPath, 'wx');
            fs.writeFileSync(fd, JSON.stringify({
                pid: process.pid,
                startedAt: new Date().toISOString()
            }), 'utf8');
            fs.closeSync(fd);

            sessionLockPath = lockPath;
            sessionLockOwned = true;
            return;
        } catch (err) {
            if (err?.code !== 'EEXIST') throw err;

            const ownerPid = readLockPid();
            if (ownerPid && pidIsAlive(ownerPid)) {
                throw new Error(
                    `Session is already in use by another running process (PID ${ownerPid}). ` +
                    'Stop the duplicate bot process before starting this one.'
                );
            }

            // Stale lock only. Authentication files remain untouched.
            fs.unlinkSync(lockPath);
        }
    }

    throw new Error('Unable to acquire the session lock.');
};

const releaseSessionLock = () => {
    if (!sessionLockOwned || !sessionLockPath) return;

    try {
        fs.unlinkSync(sessionLockPath);
    } catch {}

    sessionLockOwned = false;
    sessionLockPath = null;
};


// ============================================================
// IMPORTANT:
// NEVER DELETE SESSION FROM THIS FILE
// ============================================================

const ensureSessionFolder = (sessionPath) => {
    try {
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, {
                recursive: true
            });

            console.log(
                green('📁 Session folder created: ') +
                white(sessionPath)
            );
        }
    } catch (err) {
        console.log(
            red('[SESSION FOLDER ERROR]'),
            err.message
        );
    }
};


// ============================================================
// CLEAR ONLY RECONNECT TIMER
// DOES NOT TOUCH SESSION FILES
// ============================================================

const clearReconnect = () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
};


// ============================================================
// SAFE SOCKET DESTROY
// IMPORTANT:
// This destroys the CONNECTION object only.
// It NEVER touches the session folder.
// ============================================================

const destroySocket = async (sock) => {
    if (!sock) return;

    try {
        if (typeof sock.ws?.close === 'function') {
            try {
                sock.ws.close();
            } catch {}
        }
    } catch {}

    try {
        if (typeof sock.end === 'function') {
            try {
                sock.end();
            } catch {}
        }
    } catch {}
};


// ============================================================
// RECONNECT SCHEDULER
// ============================================================

const scheduleReconnect = (
    delay,
    reason = 'connection closed'
) => {

    if (reconnectTimeout) {
        return;
    }

    const generation = ++reconnectGeneration;

    const wait = Math.max(
        1000,
        Math.min(120000, delay)
    );

    console.log(
        yellow(`🔄 ${reason}`)
    );

    console.log(
        cyan(`   Reconnecting in ${Math.ceil(wait / 1000)} seconds...`)
    );

    console.log(
        green('   🔐 Existing session will be preserved.')
    );

    reconnectTimeout = setTimeout(() => {

        reconnectTimeout = null;

        if (generation !== reconnectGeneration) {
            return;
        }

        if (isConnecting) {
            return;
        }

        if (activeSocket) {
            return;
        }

        clientstart().catch(err => {
            console.error(
                red('[RECONNECT ERROR]'),
                err?.message || err
            );

            isConnecting = false;
            activeSocket = null;

            scheduleReconnect(
                10000,
                'reconnect attempt failed'
            );
        });

    }, wait);
};


// ============================================================
// DISCONNECT EXPLANATION
// ============================================================

const explainDisconnect = (statusCode, reason) => {

    const explanations = {

        401:
            'Logged Out / Conflict → WhatsApp rejected or replaced the connection.',

        408:
            'Connection Lost / Timed Out → Network or WhatsApp timeout.',

        411:
            'Multidevice Mismatch → Possible library/session compatibility issue.',

        428:
            'Connection Closed → Temporary connection shutdown.',

        440:
            'Connection Replaced → Another connection replaced this socket.',

        500:
            'Bad Session → Session may be invalid/corrupted. Session files will NOT be deleted.',

        515:
            'Restart Required → WhatsApp requested a socket restart.',

        503:
            'Service Unavailable → WhatsApp service temporarily unavailable.'
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


// ============================================================
// CREATE / START SOCKET
// ============================================================

const clientstart = async () => {

    if (isConnecting) {
        console.log(
            yellow('⏳ Already connecting, skipping...')
        );

        return;
    }

    if (activeSocket) {
        console.log(
            yellow('⏳ Existing socket still active, skipping...')
        );

        return;
    }

    isConnecting = true;

    clearReconnect();

    let sessionPath = null;
    let sock = null;

    try {

        const config = loadConfig();

        showBanner();


        // ====================================================
        // SESSION PATH
        // ====================================================

        sessionPath = path.resolve(
            './' + (config.session || 'sessions')
        );

        ensureSessionFolder(sessionPath);

        acquireSessionLock(sessionPath);

        console.log(
            cyan('🔐 Persistent Session: ') +
            green(sessionPath)
        );

        console.log(
            green('🛡️ Automatic session deletion: DISABLED')
        );


        // ====================================================
        // MESSAGE STORE
        // ====================================================

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
                                msg.key?.remoteJid &&
                                msg.key?.id
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

                            if (contact.id) {
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


        // ====================================================
        // STORE MEMORY CLEANUP
        // ====================================================

        setInterval(() => {

            try {

                if (store.messages.size > 300) {
                    store.messages.clear();
                }

            } catch {}
        }, 300000);


        // ====================================================
        // LOAD EXISTING AUTH
        // ====================================================

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            sessionPath
        );


        // ====================================================
        // BAILEYS VERSION
        // ====================================================
        // This fork ships its own protocol defaults. Do not force an
        // upstream "latest" version here; version drift can make a
        // paired socket open and then get rejected by WhatsApp.
        const version = undefined;


        // ====================================================
        // AUTH METHOD
        // ====================================================

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
                white('2. QR Code\n')
            );

            const choice =
                await question(
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


        // ====================================================
        // CREATE SOCKET
        // ====================================================

        sock = makeWASocket({

            logger: pino({
                level: 'silent'
            }),

            auth: state,

            ...(version ? { version } : {}),

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

            getMessage:
                async key =>
                    store.loadMessage(
                        key.remoteJid,
                        key.id
                    )
        });


        // ====================================================
        // REGISTER LIVE SOCKET
        // ====================================================

        activeSocket = sock;

        store.bind(sock.ev);

        sock.store = store;


        // ====================================================
        // JID DECODER
        // ====================================================

        sock.decodeJid = (jid) => {

            if (!jid) {
                return jid;
            }

            if (/:\d+@/gi.test(jid)) {

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


        // ====================================================
        // PUBLIC MODE
        // ====================================================

        sock.public =
            config.status?.public ?? true;


        // ====================================================
        // DOWNLOAD MEDIA
        // ====================================================

        sock.downloadMediaMessage =
            async (msg) => {

                const mtype =
                    Object.keys(
                        msg.message || {}
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
            };


        // ====================================================
        // SEND TEXT
        // ====================================================

        sock.sendText =
            (
                jid,
                text,
                quoted = '',
                options = {}
            ) =>
                sock.sendMessage(
                    jid,
                    {
                        text,
                        ...options
                    },
                    {
                        quoted
                    }
                );


        // ====================================================
        // PAIRING
        // ====================================================

        let pairingRequested = false;


        // ====================================================
        // CONNECTION UPDATE
        // ====================================================

        sock.ev.on(
            'connection.update',
            async (update) => {

                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update;


                // ============================================
                // QR CODE
                // ============================================

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


                // ============================================
                // PAIRING CODE
                // ============================================

                if (
                    authMethod === 'pairing' &&
                    connection === 'connecting' &&
                    !state.creds.registered &&
                    !pairingRequested
                ) {

                    pairingRequested = true;

                    try {

                        await new Promise(
                            r => setTimeout(r, 1500)
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
                                    '❌ Invalid number. Restart the bot.'
                                )
                            );

                            pairingRequested =
                                false;

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
                            err.message
                        );

                        pairingRequested =
                            false;

                        /*
                         * IMPORTANT:
                         * Even pairing errors do NOT delete
                         * the session directory.
                         */

                        if (
                            sock === activeSocket
                        ) {

                            isConnecting = false;
                            activeSocket = null;

                            await destroySocket(sock);

                            scheduleReconnect(
                                10000,
                                'pairing request failed'
                            );
                        }
                    }
                }


                // ============================================
                // CONNECTING
                // ============================================

                if (
                    connection === 'connecting'
                ) {

                    console.log(
                        cyan(
                            '🔄 Connecting to WhatsApp Servers...'
                        )
                    );
                }


                // ============================================
                // OPEN
                // ============================================

                if (
                    connection === 'open'
                ) {

                    isConnecting = false;

                    reconnectAttempts = 0;

                    conflictAttempts = 0;

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
                        green(
                            '🔐 Session: PRESERVED'
                        )
                    );

                    console.log(
                        green(
                            '🛡️ Auto-delete: DISABLED'
                        )
                    );

                    console.log(
                        line(green) + '\n'
                    );


                    io.emit(
                        'bot-status',
                        {
                            status: 'connected',
                            number: botId,
                            name: sock.user?.name
                        }
                    );


                    // ========================================
                    // CONNECTED MESSAGE
                    // ========================================

                    await new Promise(
                        r => setTimeout(r, 2500)
                    );


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
                                    url: thumbUrl
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

                                    isForwarded: true,

                                    forwardedNewsletterMessageInfo: {

                                        newsletterJid:
                                            '120363423325164241@newsletter',

                                        newsletterName:
                                            'XADON AI',

                                        serverMessageId:
                                            1
                                    },

                                    externalAdReply: {

                                        title:
                                            config.branding?.title ||
                                            'XADON AI',

                                        body:
                                            'XADON AI - Stable Uptime',

                                        sourceUrl:
                                            'https://whatsapp.com/channel/0029Vb7ACifD38Cb7Jlj5w3B',

                                        thumbnailUrl:
                                            thumbUrl,

                                        mediaType: 1,

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
                            err.message
                        );
                    }
                }


                // ============================================
                // CONNECTION CLOSED
                // ============================================

                if (
                    connection === 'close'
                ) {

                    /*
                     * Ignore stale sockets.
                     */

                    if (
                        sock !== activeSocket
                    ) {
                        return;
                    }


                    isConnecting = false;

                    activeSocket = null;


                    const disconnectError =
                        lastDisconnect?.error;

                    // Do not use new Boom(undefined) here: it can turn an
                    // unknown transport error into a fake 500 "bad session".
                    const statusCode =
                        disconnectError?.output?.statusCode ??
                        disconnectError?.statusCode ??
                        disconnectError?.data?.statusCode ??
                        null;

                    const reason =
                        disconnectError?.message ||
                        disconnectError?.output?.payload?.message ||
                        String(disconnectError || '');

                    console.log(
                        gray('   Error Name  : ' + (disconnectError?.name || 'Unknown'))
                    );

                    if (disconnectError?.data !== undefined) {
                        console.log(
                            gray('   Error Data  : ' + safeJson(disconnectError.data))
                        );
                    }

                    console.log(
                        gray('   Error Output: ' + safeJson(disconnectError?.output))
                    );


                    console.log(
                        red(
                            '\n❌ WhatsApp connection closed'
                        )
                    );

                    console.log(
                        red('   Status Code :'),
                        red(statusCode || 'Unknown')
                    );

                    console.log(
                        gray('   Reason      :'),
                        gray(reason || 'Unknown')
                    );


                    explainDisconnect(
                        statusCode,
                        reason
                    );


                    // ========================================
                    // REMOVE ONLY MEMORY REFERENCE
                    // NEVER SESSION FILES
                    // ========================================

                    if (
                        sock.user?.id
                    ) {

                        const botId =
                            sock.user.id
                                .split(':')[0];

                        global.botInstances.delete(
                            botId
                        );
                    }


                    /*
                     * IMPORTANT:
                     *
                     * We NEVER do:
                     *
                     * fs.rmSync(sessionPath)
                     *
                     * fs.rmdirSync(sessionPath)
                     *
                     * unlink session files
                     *
                     * delete auth files
                     *
                     * recreate an empty auth state
                     *
                     * The existing session remains untouched.
                     */


                    console.log(
                        green(
                            '🔐 Session files preserved.'
                        )
                    );


                    // ========================================
                    // 401 / LOGGED OUT / CONFLICT
                    // ========================================

                    if (
                        statusCode === DisconnectReason.loggedOut ||
                        statusCode === 401 ||
                        statusCode === DisconnectReason.connectionReplaced ||
                        statusCode === 440
                    ) {

                        const lowerReason =
                            String(reason)
                                .toLowerCase();


                        const isConflict =
                            statusCode === DisconnectReason.connectionReplaced ||
                            statusCode === 440 ||
                            lowerReason.includes('conflict') ||
                            lowerReason.includes('replaced') ||
                            lowerReason.includes('connection replaced');


                        if (
                            isConflict &&
                            conflictAttempts < 5
                        ) {

                            conflictAttempts++;

                            console.log(
                                yellow(
                                    `⚠️ Session conflict detected (${conflictAttempts}/5)`
                                )
                            );

                            console.log(
                                yellow(
                                    '   Restarting socket without touching session files...'
                                )
                            );

                            await destroySocket(sock);

                            scheduleReconnect(
                                8000,
                                'session conflict'
                            );

                            return;
                        }


                        console.log(
                            red.bold(
                                '\n⚠️ WhatsApp reported logout/session rejection.'
                            )
                        );

                        console.log(
                            yellow(
                                'The session directory has NOT been deleted.'
                            )
                        );

                        console.log(
                            yellow(
                                'The bot will keep attempting to reconnect using the existing session.'
                            )
                        );

                        console.log(
                            gray(
                                'If WhatsApp permanently invalidated the credentials, manual re-pairing may still be required.'
                            )
                        );


                        await destroySocket(sock);


                        reconnectAttempts++;

                        scheduleReconnect(
                            15000,
                            'logout/session rejection'
                        );

                        return;
                    }


                    // ========================================
                    // 500 BAD SESSION
                    // ========================================

                    if (
                        statusCode ===
                            DisconnectReason.badSession ||
                        statusCode === 500
                    ) {

                        console.log(
                            red.bold(
                                '\n⚠️ BAD SESSION REPORTED'
                            )
                        );

                        console.log(
                            yellow(
                                '⚠️ IMPORTANT: Session files WILL NOT be deleted.'
                            )
                        );

                        console.log(
                            cyan(
                                '🔄 Restarting connection using the existing session...'
                            )
                        );


                        await destroySocket(sock);


                        reconnectAttempts++;

                        scheduleReconnect(
                            10000,
                            'bad session reported'
                        );

                        return;
                    }


                    // ========================================
                    // 515 RESTART REQUIRED
                    // ========================================

                    if (
                        statusCode ===
                            DisconnectReason.restartRequired ||
                        statusCode === 515
                    ) {

                        console.log(
                            yellow(
                                '\n🔄 WhatsApp requested a socket restart.'
                            )
                        );

                        console.log(
                            green(
                                '🔐 Keeping existing session files.'
                            )
                        );


                        await destroySocket(sock);


                        scheduleReconnect(
                            2500,
                            'WhatsApp requested restart'
                        );

                        return;
                    }


                    // ========================================
                    // 408 / 428 / 440 / 411 / 503
                    // AND EVERY OTHER ERROR
                    // ========================================

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


                    console.log(
                        yellow(
                            '🔄 Recoverable connection failure.'
                        )
                    );

                    console.log(
                        green(
                            '🔐 Session preserved. Restarting socket only.'
                        )
                    );


                    await destroySocket(sock);


                    scheduleReconnect(
                        delay,
                        `connection error (attempt ${reconnectAttempts})`
                    );
                }
            }
        );


        // ====================================================
        // SAVE CREDENTIALS
        // ====================================================

        sock.ev.on(
            'creds.update',
            async () => {

                try {

                    await saveCreds();

                } catch (err) {

                    console.log(
                        red(
                            '[SAVE CREDS ERROR]'
                        ),
                        err.message
                    );

                    /*
                     * NEVER delete session because saveCreds
                     * encounters an error.
                     *
                     * The next connection attempt will use
                     * whatever valid credentials remain.
                     */
                }
            }
        );


        // ====================================================
        // MESSAGE HANDLER
        // ====================================================

        setupMessageHandler(
            sock,
            store,
            handleMessage,
            smsg,
            io,
            loadConfig
        );


        // ====================================================
        // GROUP WELCOME / GOODBYE
        // ====================================================

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


                        // ====================================
                        // WELCOME
                        // ====================================

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
                                        url: ppUrl
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


                        // ====================================
                        // GOODBYE
                        // ====================================

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

                    const message =
                        err?.message || String(err);


                    if (
                        !ignoredErrors.some(
                            e =>
                                message.includes(e)
                        )
                    ) {

                        console.log(
                            red('[Group Events Error]'),
                            message
                        );
                    }
                }
            }
        );


        // ====================================================
        // CONTACTS
        // ====================================================

        sock.ev.on(
            'contacts.update',
            contacts => {

                for (
                    const contact
                    of contacts
                ) {

                    if (!contact.id) {
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

        console.error(
            red('[CLIENTSTART ERROR]'),
            err?.message || err
        );


        /*
         * VERY IMPORTANT:
         *
         * Even if clientstart() itself fails,
         * we DO NOT delete the session.
         */

        if (sock) {
            await destroySocket(sock);
        }

        releaseSessionLock();

        if (
            sock === activeSocket
        ) {
            activeSocket = null;
        }


        isConnecting = false;


        reconnectAttempts++;


        const delay =
            Math.min(
                120000,
                10000 *
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
            'socket startup error'
        );
    }
};


// ============================================================
// PROCESS SHUTDOWN
// ============================================================

const gracefulShutdown = async (signal) => {
    console.log(yellow(`[SHUTDOWN] ${signal} received.`));
    clearReconnect();

    const sock = activeSocket;
    activeSocket = null;
    isConnecting = false;

    if (sock) {
        try { await destroySocket(sock); } catch {}
    }

    releaseSessionLock();
    setTimeout(() => process.exit(0), 50);
};

process.once('SIGINT', () => {
    gracefulShutdown('SIGINT').catch(() => process.exit(0));
});

process.once('SIGTERM', () => {
    gracefulShutdown('SIGTERM').catch(() => process.exit(0));
});

// ============================================================
// PROCESS ERRORS
// ============================================================

process.on(
    'uncaughtException',
    (err) => {

        const message =
            String(
                err?.message || err
            );


        if (
            ignoredErrors.some(
                e => message.includes(e)
            )
        ) {
            return;
        }


        console.log(
            red('[UNCAUGHT EXCEPTION]'),
            message
        );


        /*
         * DO NOT DELETE SESSION.
         *
         * If the process itself survives,
         * restart the WhatsApp connection.
         */

        if (
            !activeSocket &&
            !isConnecting
        ) {

            scheduleReconnect(
                5000,
                'uncaught exception recovery'
            );
        }
    }
);


process.on(
    'unhandledRejection',
    (err) => {

        const message =
            String(
                err?.message || err
            );


        if (
            ignoredErrors.some(
                e => message.includes(e)
            )
        ) {
            return;
        }


        console.log(
            red('[UNHANDLED REJECTION]'),
            message
        );


        /*
         * Never touch session files here.
         */

        if (
            !activeSocket &&
            !isConnecting
        ) {

            scheduleReconnect(
                5000,
                'unhandled rejection recovery'
            );
        }
    }
);


// ============================================================
// START APPLICATION
// ============================================================

(async () => {

    try {

        const config =
            loadConfig();


        // ================================================
        // DATABASE
        // ================================================

        if (
            !fs.existsSync('./database')
        ) {

            fs.mkdirSync(
                './database',
                {
                    recursive: true
                }
            );
        }


        // ================================================
        // SESSION
        // ================================================

        const sessionFolder =
            path.resolve(
                './' +
                (
                    config.session ||
                    'sessions'
                )
            );


        /*
         * Creates the folder if missing.
         *
         * It NEVER removes an existing folder.
         */

        ensureSessionFolder(
            sessionFolder
        );


        // ================================================
        // DATABASE FILES
        // ================================================

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


        // ================================================
        // COMMANDS
        // ================================================

        loadCommands();


        // ================================================
        // DASHBOARD
        // ================================================

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

                console.log(
                    green(
                        '🔐 Session persistence: ENABLED'
                    )
                );

                console.log(
                    green(
                        '🛡️ Automatic session deletion: DISABLED'
                    )
                );
            }
        );


        // ================================================
        // STATISTICS
        // ================================================

        xdnStatistic(
            app,
            io
        );


        // ================================================
        // DASHBOARD SOCKET
        // ================================================

        io.on(
            'connection',
            (socket) => {

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
                    () =>
                        console.log(
                            yellow(
                                '👤 Dashboard disconnected'
                            )
                        )
                );
            }
        );


        // ================================================
        // START WHATSAPP
        // ================================================

        await clientstart();

    } catch (err) {

        console.error(
            red('[STARTUP ERROR]'),
            err?.message || err
        );


        /*
         * IMPORTANT:
         *
         * Even startup errors never delete
         * the session folder.
         */

        isConnecting = false;

        activeSocket = null;

        scheduleReconnect(
            10000,
            'application startup error'
        );
    }

})();