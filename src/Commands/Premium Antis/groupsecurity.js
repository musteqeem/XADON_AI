'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              XADON AI V2 — ADVANCED GROUP SECURITY         ║
 * ║                                                            ║
 * ║  Risk-based group security / moderation engine              ║
 * ║  - Flood detection                                          ║
 * ║  - Burst detection                                          ║
 * ║  - Repeated-message detection                               ║
 * ║  - Mass-mention detection                                   ║
 * ║  - Suspicious URL detection                                 ║
 * ║  - WhatsApp invite detection                                ║
 * ║  - Suspicious filename / MIME detection                     ║
 * ║  - Unicode anomaly detection                                ║
 * ║  - Oversized-message detection                              ║
 * ║  - Risk scoring                                              ║
 * ║  - Strike escalation                                         ║
 * ║  - Automatic lockdown                                        ║
 * ║  - Admin / bot protection                                    ║
 * ║  - Per-group configuration                                   ║
 * ║                                                            ║
 * ║  Defensive moderation only.                                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATABASE_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DATABASE_DIR, 'groupsecurity.json');
const WARN_DB_PATH = path.join(DATABASE_DIR, 'groupsecurity_warns.json');
const LOG_DB_PATH = path.join(DATABASE_DIR, 'groupsecurity_logs.json');

const DEFAULT_CONFIG = {
    enabled: false,

    // Protection mode:
    // monitor = detect/log only
    // active  = delete + warn
    // strict  = delete + warn + escalation
    mode: 'active',

    // User gets removed after this many strikes.
    strikeLimit: 3,

    // Risk score needed before taking action.
    riskThreshold: 6,

    // Automatically enable group restrictions after repeated incidents.
    autoLockdown: true,

    // Number of high-risk incidents inside lockdown window.
    lockdownThreshold: 5,

    // Lockdown duration.
    lockdownMinutes: 10,

    // Detection switches.
    floodDetection: true,
    burstDetection: true,
    repeatDetection: true,
    mentionDetection: true,
    linkDetection: true,
    inviteDetection: true,
    fileDetection: true,
    unicodeDetection: true,
    oversizeDetection: true,

    // Limits.
    floodWindowMs: 10000,
    floodLimit: 6,

    burstWindowMs: 3000,
    burstLimit: 4,

    repeatWindowMs: 15000,
    repeatLimit: 3,

    mentionLimit: 8,

    maxTextLength: 12000,

    unicodeControlRatio: 0.08,
    repeatedCharacterLimit: 80,

    // Trusted domains.
    allowDomains: [],

    // Explicitly blocked domains.
    blockDomains: [],

    // File extensions that should be treated as high-risk.
    blockedExtensions: [
        '.apk',
        '.exe',
        '.bat',
        '.cmd',
        '.com',
        '.scr',
        '.msi',
        '.jar',
        '.js',
        '.jse',
        '.vbs',
        '.vbe',
        '.ps1',
        '.psm1',
        '.sh',
        '.bash',
        '.dll',
        '.hta'
    ],

    // Administrators are exempt by default.
    adminsExempt: true,

    // Bot itself is always exempt.
    botExempt: true,

    // Users explicitly trusted by the group.
    trustedUsers: [],

    // Cooldown prevents repeated punishment loops.
    actionCooldownMs: 5000
};

const runtime = new Map();

/* ============================================================
 * DATABASE
 * ========================================================== */

function ensureDatabase() {
    if (!fs.existsSync(DATABASE_DIR)) {
        fs.mkdirSync(DATABASE_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        saveJSON(DB_PATH, {});
    }

    if (!fs.existsSync(WARN_DB_PATH)) {
        saveJSON(WARN_DB_PATH, {});
    }

    if (!fs.existsSync(LOG_DB_PATH)) {
        saveJSON(LOG_DB_PATH, []);
    }
}

function loadJSON(file, fallback) {
    try {
        ensureDatabase();

        if (!fs.existsSync(file)) return fallback;

        const raw = fs.readFileSync(file, 'utf8').trim();

        if (!raw) return fallback;

        return JSON.parse(raw);
    } catch (error) {
        console.error('[GROUPSECURITY DB]', error.message);
        return fallback;
    }
}

function saveJSON(file, data) {
    try {
        ensureDatabase();

        const tmp = `${file}.tmp`;

        fs.writeFileSync(
            tmp,
            JSON.stringify(data, null, 2),
            'utf8'
        );

        fs.renameSync(tmp, file);

        return true;
    } catch (error) {
        console.error('[GROUPSECURITY SAVE]', error.message);
        return false;
    }
}

function getConfig(groupJid) {
    const db = loadJSON(DB_PATH, {});

    if (!db[groupJid]) {
        db[groupJid] = {
            ...DEFAULT_CONFIG
        };

        saveJSON(DB_PATH, db);
    }

    return {
        ...DEFAULT_CONFIG,
        ...db[groupJid]
    };
}

function setConfig(groupJid, patch) {
    const db = loadJSON(DB_PATH, {});

    db[groupJid] = {
        ...DEFAULT_CONFIG,
        ...(db[groupJid] || {}),
        ...patch
    };

    saveJSON(DB_PATH, db);

    return db[groupJid];
}

/* ============================================================
 * NORMALIZATION
 * ========================================================== */

function normalizeJid(jid) {
    if (!jid || typeof jid !== 'string') return '';

    return jid
        .replace(/:\d+(?=@)/, '')
        .trim();
}

function senderOf(m) {
    return normalizeJid(
        m?.sender ||
        m?.key?.participant ||
        m?.participant ||
        ''
    );
}

function messageText(m) {
    if (!m) return '';

    if (typeof m.text === 'string') {
        return m.text;
    }

    const msg = m.message || {};

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        msg.buttonsResponseMessage?.selectedButtonId ||
        msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ''
    );
}

/* ============================================================
 * HASHING
 * ========================================================== */

function hashText(text) {
    return crypto
        .createHash('sha256')
        .update(String(text))
        .digest('hex');
}

/* ============================================================
 * URL / DOMAIN DETECTION
 * ========================================================== */

function extractUrls(text) {
    if (!text) return [];

    const matches = text.match(
        /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi
    );

    return Array.isArray(matches) ? matches : [];
}

function normalizeDomain(value) {
    try {
        let input = String(value || '').trim();

        if (!input) return '';

        if (!/^https?:\/\//i.test(input)) {
            input = `https://${input}`;
        }

        const url = new URL(input);

        return url.hostname
            .toLowerCase()
            .replace(/^www\./, '')
            .replace(/\.$/, '');
    } catch {
        return '';
    }
}

function domainMatches(domain, list) {
    if (!domain || !Array.isArray(list)) return false;

    return list.some(entry => {
        const d = normalizeDomain(entry);

        if (!d) return false;

        return (
            domain === d ||
            domain.endsWith(`.${d}`)
        );
    });
}

function isWhatsAppInvite(url) {
    const domain = normalizeDomain(url);

    if (!domain) return false;

    return (
        domain === 'chat.whatsapp.com' ||
        domain === 'wa.me' ||
        domain === 'whatsapp.com'
    ) && /chat|invite|join/i.test(url);
}

/* ============================================================
 * FILE DETECTION
 *
 * IMPORTANT:
 * We inspect metadata only.
 * We do NOT download the file.
 * ========================================================== */

function getFileInfo(m) {
    const msg = m?.message || {};

    const media =
        msg.documentMessage ||
        msg.documentWithCaptionMessage?.message?.documentMessage ||
        msg.imageMessage ||
        msg.videoMessage ||
        msg.audioMessage ||
        null;

    if (!media) return null;

    const fileName = String(
        media.fileName ||
        ''
    );

    const mimetype = String(
        media.mimetype ||
        ''
    ).toLowerCase();

    const size =
        Number(media.fileLength) ||
        Number(media.fileLengthHigh) ||
        0;

    return {
        fileName,
        mimetype,
        size
    };
}

function hasDangerousExtension(fileName, blockedExtensions) {
    if (!fileName) return false;

    const lower = fileName.toLowerCase().trim();

    return blockedExtensions.some(ext =>
        lower.endsWith(ext)
    );
}

function hasDoubleExtension(fileName) {
    if (!fileName) return false;

    const lower = fileName.toLowerCase();

    const dangerous = [
        '.exe',
        '.apk',
        '.scr',
        '.bat',
        '.cmd',
        '.js',
        '.jar',
        '.msi',
        '.vbs',
        '.ps1'
    ];

    const extensions = lower.match(/\.[a-z0-9]{1,8}/g) || [];

    if (extensions.length < 2) return false;

    return dangerous.some(ext =>
        extensions.includes(ext)
    );
}

/* ============================================================
 * UNICODE ANOMALY
 * ========================================================== */

function unicodeAnomaly(text, config) {
    if (!text) {
        return {
            suspicious: false,
            score: 0
        };
    }

    const chars = [...text];

    if (!chars.length) {
        return {
            suspicious: false,
            score: 0
        };
    }

    let controls = 0;

    for (const char of chars) {
        const code = char.codePointAt(0);

        // Ignore normal whitespace.
        if (
            code === 9 ||
            code === 10 ||
            code === 13 ||
            code === 32
        ) {
            continue;
        }

        // C0/C1 controls.
        if (
            (code >= 0 && code <= 8) ||
            (code >= 11 && code <= 12) ||
            (code >= 14 && code <= 31) ||
            (code >= 127 && code <= 159)
        ) {
            controls++;
        }
    }

    const ratio = controls / chars.length;

    const longRepeat =
        new RegExp(
            `(.)\\1{${Math.max(
                10,
                Number(config.repeatedCharacterLimit || 80)
            )},}`,
            'u'
        ).test(text);

    return {
        suspicious:
            ratio >= Number(config.unicodeControlRatio || 0.08) ||
            longRepeat,

        score:
            ratio >= Number(config.unicodeControlRatio || 0.08)
                ? 3
                : longRepeat
                    ? 2
                    : 0
    };
}

/* ============================================================
 * RUNTIME STATE
 * ========================================================== */

function getRuntime(groupJid) {
    if (!runtime.has(groupJid)) {
        runtime.set(groupJid, {
            messages: new Map(),
            actions: new Map(),
            incidents: [],
            lockdownUntil: 0
        });
    }

    return runtime.get(groupJid);
}

function pruneRuntime(state, now) {
    const windows = [
        60000,
        300000
    ];

    for (const [jid, data] of state.messages.entries()) {
        if (
            !data ||
            !Array.isArray(data.timestamps) ||
            !Array.isArray(data.hashes)
        ) {
            state.messages.delete(jid);
            continue;
        }

        data.timestamps = data.timestamps.filter(
            t => now - t < Math.max(...windows)
        );

        data.hashes = data.hashes.filter(
            item => now - item.time < Math.max(...windows)
        );

        if (
            data.timestamps.length === 0 &&
            data.hashes.length === 0
        ) {
            state.messages.delete(jid);
        }
    }

    state.incidents = state.incidents.filter(
        incident => now - incident.time < 10 * 60 * 1000
    );
}

/* ============================================================
 * GROUP ADMIN CHECK
 * ========================================================== */

async function getGroupAdmins(sock, groupJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);

        const admins = new Set();

        for (const participant of metadata?.participants || []) {
            if (
                participant.admin === 'admin' ||
                participant.admin === 'superadmin'
            ) {
                admins.add(
                    normalizeJid(participant.id)
                );
            }
        }

        return {
            metadata,
            admins
        };
    } catch {
        return {
            metadata: null,
            admins: new Set()
        };
    }
}

/* ============================================================
 * BOT JID
 * ========================================================== */

function getBotJids(sock) {
    const set = new Set();

    const id = normalizeJid(sock?.user?.id);

    if (id) {
        set.add(id);
    }

    return set;
}

/* ============================================================
 * MESSAGE TYPE
 * ========================================================== */

function messageHasMedia(m) {
    const msg = m?.message || {};

    return Boolean(
        msg.imageMessage ||
        msg.videoMessage ||
        msg.audioMessage ||
        msg.documentMessage ||
        msg.stickerMessage
    );
}

/* ============================================================
 * DETECTION ENGINE
 * ========================================================== */

function analyzeMessage(m, config, state) {
    const sender = senderOf(m);
    const text = messageText(m);
    const now = Date.now();

    const result = {
        score: 0,
        reasons: [],
        flags: []
    };

    if (!sender) {
        return result;
    }

    if (!state.messages.has(sender)) {
        state.messages.set(sender, {
            timestamps: [],
            hashes: []
        });
    }

    const user = state.messages.get(sender);

    user.timestamps.push(now);

    const textHash = text
        ? hashText(text.trim().toLowerCase())
        : null;

    if (textHash) {
        user.hashes.push({
            hash: textHash,
            time: now
        });
    }

    /* --------------------------------------------------------
     * FLOOD
     * ------------------------------------------------------ */

    if (config.floodDetection) {
        const recent = user.timestamps.filter(
            t => now - t <= Number(config.floodWindowMs)
        );

        if (recent.length >= Number(config.floodLimit)) {
            result.score += 4;
            result.flags.push('flood');
            result.reasons.push(
                `message flood (${recent.length} messages)`
            );
        }
    }

    /* --------------------------------------------------------
     * BURST
     * ------------------------------------------------------ */

    if (config.burstDetection) {
        const recent = user.timestamps.filter(
            t => now - t <= Number(config.burstWindowMs)
        );

        if (recent.length >= Number(config.burstLimit)) {
            result.score += 2;
            result.flags.push('burst');
            result.reasons.push(
                `rapid burst (${recent.length} messages)`
            );
        }
    }

    /* --------------------------------------------------------
     * REPEATED MESSAGE
     * ------------------------------------------------------ */

    if (config.repeatDetection && textHash) {
        const same = user.hashes.filter(
            item =>
                item.hash === textHash &&
                now - item.time <= Number(config.repeatWindowMs)
        );

        if (same.length >= Number(config.repeatLimit)) {
            result.score += 3;
            result.flags.push('repeat');
            result.reasons.push(
                `repeated message (${same.length + 1} times)`
            );
        }
    }

    /* --------------------------------------------------------
     * MASS MENTIONS
     * ------------------------------------------------------ */

    if (config.mentionDetection) {
        const mentions = Array.isArray(m?.mentionedJid)
            ? m.mentionedJid.length
            : 0;

        if (mentions >= Number(config.mentionLimit)) {
            result.score += 3;
            result.flags.push('mass-mention');
            result.reasons.push(
                `mass mention (${mentions} users)`
            );
        }
    }

    /* --------------------------------------------------------
     * TEXT SIZE
     * ------------------------------------------------------ */

    if (
        config.oversizeDetection &&
        text.length > Number(config.maxTextLength)
    ) {
        result.score += 3;
        result.flags.push('oversize');
        result.reasons.push(
            `oversized text (${text.length} characters)`
        );
    }

    /* --------------------------------------------------------
     * URLS
     * ------------------------------------------------------ */

    if (config.linkDetection && text) {
        const urls = extractUrls(text);

        if (urls.length) {
            for (const url of urls) {
                const domain = normalizeDomain(url);

                if (!domain) {
                    result.score += 1;
                    result.flags.push('malformed-url');
                    result.reasons.push(
                        'malformed or unusual URL'
                    );
                    continue;
                }

                if (
                    Array.isArray(config.blockDomains) &&
                    domainMatches(domain, config.blockDomains)
                ) {
                    result.score += 7;
                    result.flags.push('blocked-domain');
                    result.reasons.push(
                        `blocked domain: ${domain}`
                    );

                    continue;
                }

                if (
                    config.inviteDetection &&
                    isWhatsAppInvite(url)
                ) {
                    result.score += 5;
                    result.flags.push('group-invite');
                    result.reasons.push(
                        'WhatsApp group invite'
                    );

                    continue;
                }

                // URLs not explicitly trusted get a small risk score.
                if (
                    !domainMatches(
                        domain,
                        config.allowDomains
                    )
                ) {
                    result.score += 1;
                    result.flags.push('external-link');
                    result.reasons.push(
                        `external link: ${domain}`
                    );
                }
            }
        }
    }

    /* --------------------------------------------------------
     * FILES
     * ------------------------------------------------------ */

    if (config.fileDetection) {
        const file = getFileInfo(m);

        if (file) {
            if (
                hasDangerousExtension(
                    file.fileName,
                    config.blockedExtensions
                )
            ) {
                result.score += 8;
                result.flags.push('dangerous-file-extension');
                result.reasons.push(
                    `blocked file extension: ${file.fileName}`
                );
            }

            if (hasDoubleExtension(file.fileName)) {
                result.score += 5;
                result.flags.push('double-extension');
                result.reasons.push(
                    `suspicious double extension: ${file.fileName}`
                );
            }

            const dangerousMime = [
                'application/x-msdownload',
                'application/x-dosexec',
                'application/x-msdos-program',
                'application/x-sh',
                'application/x-shellscript'
            ];

            if (
                dangerousMime.includes(file.mimetype)
            ) {
                result.score += 7;
                result.flags.push('dangerous-mime');
                result.reasons.push(
                    `suspicious MIME type: ${file.mimetype}`
                );
            }

            // Metadata-only size check.
            if (
                file.size > 100 * 1024 * 1024
            ) {
                result.score += 2;
                result.flags.push('large-file');
                result.reasons.push(
                    'very large media/file'
                );
            }
        }
    }

    /* --------------------------------------------------------
     * UNICODE
     * ------------------------------------------------------ */

    if (config.unicodeDetection && text) {
        const unicode = unicodeAnomaly(
            text,
            config
        );

        if (unicode.suspicious) {
            result.score += unicode.score;
            result.flags.push('unicode-anomaly');
            result.reasons.push(
                'unusual control/repeated-character pattern'
            );
        }
    }

    /* --------------------------------------------------------
     * MEDIA WITHOUT CAPTION
     *
     * We don't mark ordinary media as dangerous.
     * ------------------------------------------------------ */

    if (
        messageHasMedia(m) &&
        !text
    ) {
        // Intentionally neutral.
    }

    return result;
}

/* ============================================================
 * WARN DATABASE
 * ========================================================== */

function warnKey(groupJid, userJid) {
    return `${groupJid}:${userJid}`;
}

function getWarns(groupJid, userJid) {
    const db = loadJSON(WARN_DB_PATH, {});

    const key = warnKey(
        groupJid,
        userJid
    );

    return Number(db[key]?.count || 0);
}

function addWarn(groupJid, userJid, reason) {
    const db = loadJSON(WARN_DB_PATH, {});

    const key = warnKey(
        groupJid,
        userJid
    );

    const previous = db[key] || {
        count: 0,
        history: []
    };

    previous.count =
        Number(previous.count || 0) + 1;

    previous.history = Array.isArray(
        previous.history
    )
        ? previous.history
        : [];

    previous.history.push({
        time: Date.now(),
        reason
    });

    if (previous.history.length > 25) {
        previous.history =
            previous.history.slice(-25);
    }

    db[key] = previous;

    saveJSON(WARN_DB_PATH, db);

    return previous.count;
}

function resetWarns(groupJid, userJid) {
    const db = loadJSON(WARN_DB_PATH, {});

    delete db[
        warnKey(groupJid, userJid)
    ];

    saveJSON(WARN_DB_PATH, db);
}

/* ============================================================
 * SECURITY LOGS
 * ========================================================== */

function writeLog(entry) {
    const logs = loadJSON(
        LOG_DB_PATH,
        []
    );

    if (!Array.isArray(logs)) {
        return;
    }

    logs.push({
        ...entry,
        time: Date.now()
    });

    // Keep the database bounded.
    if (logs.length > 2000) {
        logs.splice(
            0,
            logs.length - 2000
        );
    }

    saveJSON(
        LOG_DB_PATH,
        logs
    );
}

/* ============================================================
 * LOCKDOWN
 * ========================================================== */

function isLockdownActive(groupJid) {
    const state = getRuntime(groupJid);

    return (
        Number(state.lockdownUntil || 0) >
        Date.now()
    );
}

function activateLockdown(groupJid, minutes) {
    const state = getRuntime(groupJid);

    state.lockdownUntil =
        Date.now() +
        Number(minutes || 10) * 60 * 1000;

    return state.lockdownUntil;
}

function clearLockdown(groupJid) {
    const state = getRuntime(groupJid);

    state.lockdownUntil = 0;
}

/* ============================================================
 * DELETE
 * ========================================================== */

async function deleteMessage(sock, m) {
    try {
        if (
            !m?.key?.remoteJid ||
            !m?.key?.id
        ) {
            return false;
        }

        await sock.sendMessage(
            m.key.remoteJid,
            {
                delete: m.key
            }
        );

        return true;
    } catch {
        return false;
    }
}

/* ============================================================
 * PUNISHMENT
 * ========================================================== */

async function punish(
    sock,
    m,
    config,
    analysis,
    admins
) {
    const groupJid = m.chat;
    const sender = senderOf(m);

    const state = getRuntime(groupJid);

    const now = Date.now();

    const previousAction =
        state.actions.get(sender) || 0;

    if (
        now - previousAction <
        Number(config.actionCooldownMs)
    ) {
        return {
            action: 'cooldown'
        };
    }

    state.actions.set(
        sender,
        now
    );

    const reason =
        analysis.reasons.join(', ') ||
        'suspicious activity';

    if (config.mode === 'monitor') {
        writeLog({
            type: 'detected',
            group: groupJid,
            user: sender,
            score: analysis.score,
            flags: analysis.flags,
            reason
        });

        return {
            action: 'monitor'
        };
    }

    await deleteMessage(
        sock,
        m
    );

    let warnings =
        getWarns(
            groupJid,
            sender
        );

    if (
        config.mode === 'active' ||
        config.mode === 'strict'
    ) {
        warnings = addWarn(
            groupJid,
            sender,
            reason
        );
    }

    let kicked = false;

    if (
        config.mode === 'strict' &&
        warnings >=
        Number(config.strikeLimit)
    ) {
        if (
            !admins.has(sender)
        ) {
            try {
                await sock.groupParticipantsUpdate(
                    groupJid,
                    [sender],
                    'remove'
                );

                kicked = true;

                resetWarns(
                    groupJid,
                    sender
                );
            } catch (error) {
                console.error(
                    '[GROUPSECURITY KICK]',
                    error.message
                );
            }
        }
    }

    const stateIncidents =
        state.incidents;

    stateIncidents.push({
        time: now,
        user: sender,
        score: analysis.score,
        highRisk:
            analysis.score >=
            Number(config.riskThreshold)
    });

    writeLog({
        type: kicked
            ? 'kick'
            : 'blocked',
        group: groupJid,
        user: sender,
        score: analysis.score,
        flags: analysis.flags,
        warnings,
        reason
    });

    return {
        action: kicked
            ? 'kick'
            : 'block',
        warnings,
        reason
    };
}

/* ============================================================
 * MAIN HANDLER
 * ========================================================== */

async function handleGroupSecurity(
    sock,
    m,
    mek
) {
    try {
        if (
            !m?.isGroup ||
            !m?.chat ||
            !m?.key
        ) {
            return false;
        }

        ensureDatabase();

        const groupJid = m.chat;
        const sender = senderOf(m);

        if (!sender) {
            return false;
        }

        const config =
            getConfig(groupJid);

        if (!config.enabled) {
            return false;
        }

        const state =
            getRuntime(groupJid);

        const now = Date.now();

        pruneRuntime(
            state,
            now
        );

        const {
            metadata,
            admins
        } = await getGroupAdmins(
            sock,
            groupJid
        );

        /*
         * Never moderate an administrator when
         * adminsExempt is enabled.
         */
        if (
            config.adminsExempt &&
            admins.has(sender)
        ) {
            return false;
        }

        /*
         * Bot exemption.
         */
        if (
            config.botExempt &&
            getBotJids(sock).has(sender)
        ) {
            return false;
        }

        /*
         * Explicit trusted user.
         */
        if (
            Array.isArray(
                config.trustedUsers
            ) &&
            config.trustedUsers
                .map(normalizeJid)
                .includes(sender)
        ) {
            return false;
        }

        const analysis =
            analyzeMessage(
                m,
                config,
                state
            );

        /*
         * No suspicious behavior.
         */
        if (
            analysis.score <= 0
        ) {
            return false;
        }

        /*
         * Track high-risk incidents.
         */
        if (
            analysis.score >=
            Number(config.riskThreshold)
        ) {
            state.incidents.push({
                time: now,
                user: sender,
                score: analysis.score,
                highRisk: true
            });
        }

        /*
         * AUTOMATIC LOCKDOWN
         */
        if (
            config.autoLockdown &&
            !isLockdownActive(groupJid)
        ) {
            const recentHighRisk =
                state.incidents.filter(
                    incident =>
                        now - incident.time <=
                        60 * 1000 &&
                        incident.highRisk
                );

            if (
                recentHighRisk.length >=
                Number(
                    config.lockdownThreshold
                )
            ) {
                activateLockdown(
                    groupJid,
                    config.lockdownMinutes
                );

                writeLog({
                    type: 'lockdown',
                    group: groupJid,
                    reason:
                        `${recentHighRisk.length} high-risk incidents`
                });

                try {
                    await sock.sendMessage(
                        groupJid,
                        {
                            text:
                                `🛡️ *GROUP SECURITY LOCKDOWN*\n\n` +
                                `Multiple high-risk incidents were detected.\n\n` +
                                `🔒 Protection mode activated for ` +
                                `${config.lockdownMinutes} minutes.\n\n` +
                                `Normal members may be temporarily restricted ` +
                                `depending on the group's configured security policies.`
                        }
                    );
                } catch {}
            }
        }

        /*
         * During lockdown, lower-risk activity
         * receives additional risk.
         */
        if (
            isLockdownActive(groupJid)
        ) {
            analysis.score += 2;
            analysis.flags.push(
                'lockdown-active'
            );
            analysis.reasons.push(
                'group currently in lockdown'
            );
        }

        /*
         * Only act when the risk score reaches
         * the configured threshold.
         *
         * This reduces false positives.
         */
        if (
            analysis.score <
            Number(config.riskThreshold)
        ) {
            writeLog({
                type: 'low-risk',
                group: groupJid,
                user: sender,
                score: analysis.score,
                flags: analysis.flags,
                reasons: analysis.reasons
            });

            return false;
        }

        const result =
            await punish(
                sock,
                m,
                config,
                analysis,
                admins
            );

        /*
         * Send a concise warning only when
         * an action actually happened.
         */
        if (
            result.action === 'block' ||
            result.action === 'kick'
        ) {
            let text =
                `🛡️ *GROUP SECURITY*\n\n` +
                `⚠️ Suspicious activity blocked.\n` +
                `📊 Risk score: ${analysis.score}\n` +
                `🔎 ${analysis.flags.join(', ')}`;

            if (
                result.warnings
            ) {
                text +=
                    `\n⚠️ Strike: ${result.warnings}/${config.strikeLimit}`;
            }

            if (
                result.action === 'kick'
            ) {
                text +=
                    `\n🚫 User removed from the group.`;
            }

            await sock.sendMessage(
                groupJid,
                {
                    text
                }
            ).catch(() => {});
        }

        return true;

    } catch (error) {
        console.error(
            '[GROUP SECURITY ERROR]',
            error.message
        );

        return false;
    }
}

/* ============================================================
 * COMMAND
 * ========================================================== */

function isGroupAdminFromMessage(
    sock,
    m
) {
    return getGroupAdmins(
        sock,
        m.chat
    ).then(({ admins }) =>
        admins.has(
            senderOf(m)
        )
    );
}

async function command(
    sock,
    m,
    args = []
) {
    try {
        if (!m?.isGroup) {
            return sock.sendMessage(
                m.chat,
                {
                    text:
                        '❌ This command only works in groups.'
                },
                {
                    quoted: m
                }
            );
        }

        const admin =
            await isGroupAdminFromMessage(
                sock,
                m
            );

        if (!admin) {
            return sock.sendMessage(
                m.chat,
                {
                    text:
                        '❌ Group admins only.'
                },
                {
                    quoted: m
                }
            );
        }

        const action =
            String(args[0] || 'status')
                .toLowerCase();

        const groupJid =
            m.chat;

        const config =
            getConfig(groupJid);

        if (
            action === 'on' ||
            action === 'enable'
        ) {
            setConfig(
                groupJid,
                {
                    enabled: true
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        '🛡️ *Advanced Group Security enabled.*\n\n' +
                        'Risk-based protection is now active.'
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'off' ||
            action === 'disable'
        ) {
            setConfig(
                groupJid,
                {
                    enabled: false
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        '🛡️ *Advanced Group Security disabled.*'
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'mode'
        ) {
            const mode =
                String(args[1] || '')
                    .toLowerCase();

            if (
                ![
                    'monitor',
                    'active',
                    'strict'
                ].includes(mode)
            ) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            `Current mode: *${config.mode}*\n\n` +
                            `Available:\n` +
                            `• monitor\n` +
                            `• active\n` +
                            `• strict`
                    },
                    {
                        quoted: m
                    }
                );
            }

            setConfig(
                groupJid,
                {
                    mode
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `🛡️ Security mode changed to *${mode}*.`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'threshold'
        ) {
            const value =
                Number(args[1]);

            if (
                !Number.isInteger(value) ||
                value < 1 ||
                value > 30
            ) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            `Usage: .groupsecurity threshold 1-30\n` +
                            `Current: ${config.riskThreshold}`
                    },
                    {
                        quoted: m
                    }
                );
            }

            setConfig(
                groupJid,
                {
                    riskThreshold: value
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `📊 Risk threshold set to *${value}*.`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'strikes' ||
            action === 'strike'
        ) {
            const value =
                Number(args[1]);

            if (
                !Number.isInteger(value) ||
                value < 1 ||
                value > 20
            ) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            `Usage: .groupsecurity strikes 1-20\n` +
                            `Current: ${config.strikeLimit}`
                    },
                    {
                        quoted: m
                    }
                );
            }

            setConfig(
                groupJid,
                {
                    strikeLimit: value
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `⚠️ Strike limit set to *${value}*.`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'lockdown'
        ) {
            const sub =
                String(args[1] || '')
                    .toLowerCase();

            if (
                sub === 'on'
            ) {
                setConfig(
                    groupJid,
                    {
                        autoLockdown: true
                    }
                );

                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            '🔒 Automatic lockdown is now *ON*.'
                    },
                    {
                        quoted: m
                    }
                );
            }

            if (
                sub === 'off'
            ) {
                setConfig(
                    groupJid,
                    {
                        autoLockdown: false
                    }
                );

                clearLockdown(
                    groupJid
                );

                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            '🔓 Automatic lockdown is now *OFF*.'
                    },
                    {
                        quoted: m
                    }
                );
            }

            if (
                sub === 'clear'
            ) {
                clearLockdown(
                    groupJid
                );

                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            '🔓 Current lockdown cleared.'
                    },
                    {
                        quoted: m
                    }
                );
            }

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `Auto-lockdown: *${config.autoLockdown ? 'ON' : 'OFF'}*\n` +
                        `Active: *${isLockdownActive(groupJid) ? 'YES' : 'NO'}*\n\n` +
                        `Usage:\n` +
                        `.groupsecurity lockdown on\n` +
                        `.groupsecurity lockdown off\n` +
                        `.groupsecurity lockdown clear`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'allow'
        ) {
            const domain =
                normalizeDomain(
                    args[1]
                );

            if (!domain) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            'Usage: .groupsecurity allow example.com'
                    },
                    {
                        quoted: m
                    }
                );
            }

            const domains = [
                ...(config.allowDomains || [])
            ];

            if (!domains.includes(domain)) {
                domains.push(domain);
            }

            setConfig(
                groupJid,
                {
                    allowDomains: domains
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `✅ Added *${domain}* to the trusted-domain list.`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'unallow'
        ) {
            const domain =
                normalizeDomain(
                    args[1]
                );

            const domains =
                (config.allowDomains || [])
                    .filter(
                        d =>
                            normalizeDomain(d) !== domain
                    );

            setConfig(
                groupJid,
                {
                    allowDomains: domains
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `✅ Removed *${domain}* from the trusted-domain list.`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'block'
        ) {
            const domain =
                normalizeDomain(
                    args[1]
                );

            if (!domain) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            'Usage: .groupsecurity block example.com'
                    },
                    {
                        quoted: m
                    }
                );
            }

            const domains = [
                ...(config.blockDomains || [])
            ];

            if (!domains.includes(domain)) {
                domains.push(domain);
            }

            setConfig(
                groupJid,
                {
                    blockDomains: domains
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `🚫 *${domain}* added to the blocked-domain list.`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'unblock'
        ) {
            const domain =
                normalizeDomain(
                    args[1]
                );

            const domains =
                (config.blockDomains || [])
                    .filter(
                        d =>
                            normalizeDomain(d) !== domain
                    );

            setConfig(
                groupJid,
                {
                    blockDomains: domains
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `✅ Removed *${domain}* from the blocked-domain list.`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'trust'
        ) {
            const jid =
                normalizeJid(
                    args[1]
                );

            if (!jid) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            'Usage: .groupsecurity trust 234xxxxxxxxxx@s.whatsapp.net'
                    },
                    {
                        quoted: m
                    }
                );
            }

            const users = [
                ...(config.trustedUsers || [])
            ];

            if (!users.includes(jid)) {
                users.push(jid);
            }

            setConfig(
                groupJid,
                {
                    trustedUsers: users
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `✅ Trusted user added:\n${jid}`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'untrust'
        ) {
            const jid =
                normalizeJid(
                    args[1]
                );

            const users =
                (config.trustedUsers || [])
                    .filter(
                        user =>
                            normalizeJid(user) !== jid
                    );

            setConfig(
                groupJid,
                {
                    trustedUsers: users
                }
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `✅ Trusted user removed:\n${jid}`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'warncount'
        ) {
            const jid =
                normalizeJid(
                    args[1]
                );

            if (!jid) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            'Usage: .groupsecurity warncount JID'
                    },
                    {
                        quoted: m
                    }
                );
            }

            const count =
                getWarns(
                    groupJid,
                    jid
                );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `⚠️ *Security strikes*\n\n` +
                        `User: ${jid}\n` +
                        `Strikes: *${count}/${config.strikeLimit}*`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'resetwarn'
        ) {
            const jid =
                normalizeJid(
                    args[1]
                );

            if (!jid) {
                return sock.sendMessage(
                    groupJid,
                    {
                        text:
                            'Usage: .groupsecurity resetwarn JID'
                    },
                    {
                        quoted: m
                    }
                );
            }

            resetWarns(
                groupJid,
                jid
            );

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `✅ Security strikes reset for:\n${jid}`
                },
                {
                    quoted: m
                }
            );
        }

        if (
            action === 'status'
        ) {
            const state =
                getRuntime(groupJid);

            const lockdown =
                isLockdownActive(
                    groupJid
                );

            const remaining =
                lockdown
                    ? Math.ceil(
                        (
                            state.lockdownUntil -
                            Date.now()
                        ) / 1000
                    )
                    : 0;

            return sock.sendMessage(
                groupJid,
                {
                    text:
                        `🛡️ *XADON GROUP SECURITY*\n\n` +
                        `Status: *${config.enabled ? 'ON' : 'OFF'}*\n` +
                        `Mode: *${config.mode}*\n` +
                        `Risk threshold: *${config.riskThreshold}*\n` +
                        `Strike limit: *${config.strikeLimit}*\n` +
                        `Auto-lockdown: *${config.autoLockdown ? 'ON' : 'OFF'}*\n` +
                        `Lockdown: *${lockdown ? `ACTIVE (${remaining}s)` : 'OFF'}*\n\n` +
                        `Flood: ${config.floodDetection ? 'ON' : 'OFF'}\n` +
                        `Burst: ${config.burstDetection ? 'ON' : 'OFF'}\n` +
                        `Repeat: ${config.repeatDetection ? 'ON' : 'OFF'}\n` +
                        `Mentions: ${config.mentionDetection ? 'ON' : 'OFF'}\n` +
                        `Links: ${config.linkDetection ? 'ON' : 'OFF'}\n` +
                        `Invites: ${config.inviteDetection ? 'ON' : 'OFF'}\n` +
                        `Files: ${config.fileDetection ? 'ON' : 'OFF'}\n` +
                        `Unicode: ${config.unicodeDetection ? 'ON' : 'OFF'}\n` +
                        `Oversize: ${config.oversizeDetection ? 'ON' : 'OFF'}\n\n` +
                        `Tracked users: *${state.messages.size}*`
                },
                {
                    quoted: m
                }
            );
        }

        return sock.sendMessage(
            groupJid,
            {
                text:
                    `🛡️ *GROUP SECURITY COMMANDS*\n\n` +
                    `.groupsecurity on\n` +
                    `.groupsecurity off\n` +
                    `.groupsecurity status\n` +
                    `.groupsecurity mode monitor|active|strict\n` +
                    `.groupsecurity threshold 6\n` +
                    `.groupsecurity strikes 3\n` +
                    `.groupsecurity lockdown on|off|clear\n` +
                    `.groupsecurity allow example.com\n` +
                    `.groupsecurity unallow example.com\n` +
                    `.groupsecurity block example.com\n` +
                    `.groupsecurity unblock example.com\n` +
                    `.groupsecurity trust JID\n` +
                    `.groupsecurity untrust JID\n` +
                    `.groupsecurity warncount JID\n` +
                    `.groupsecurity resetwarn JID`
            },
            {
                quoted: m
            }
        );

    } catch (error) {
        console.error(
            '[GROUP SECURITY COMMAND]',
            error.message
        );
    }
}

/* ============================================================
 * EXPORTS
 * ========================================================== */

module.exports = {
    name: 'groupsecurity',
    alias: [
        'gsecurity',
        'security',
        'groupguard'
    ],
    category: 'Premium Antis',
    description:
        'Advanced risk-based group security and automatic protection.',
    usage:
        '.groupsecurity <on|off|status|mode|threshold|strikes|lockdown|allow|block|trust|warncount|resetwarn>',

    execute: command,

    handleGroupSecurity
};