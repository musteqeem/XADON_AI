'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                 XADON AI ANTIVIRUS CORE                    ║
 * ║                                                              ║
 * ║  Group-side WhatsApp Message Firewall                       ║
 * ║  - URL protection                                            ║
 * ║  - Suspicious file detection                                 ║
 * ║  - MIME detection                                            ║
 * ║  - Unicode/control-character anomaly detection               ║
 * ║  - Oversized message detection                               ║
 * ║  - Suspicious filename detection                             ║
 * ║  - Domain blacklist / whitelist                              ║
 * ║  - Delete / Warn / Kick                                      ║
 * ║  - Persistent JSON databases                                 ║
 * ║                                                              ║
 * ║  IMPORTANT: This protects messages handled by the bot.       ║
 * ║  It cannot patch WhatsApp itself or protect a phone from     ║
 *  ║  vulnerabilities that execute before the bot receives data. ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(
    process.cwd(),
    'database',
    'antivirus.json'
);

const WARN_DB_PATH = path.join(
    process.cwd(),
    'database',
    'antivirus_warns.json'
);

const MAX_TEXT_LENGTH = 12000;
const MAX_REPEATED_RUN = 180;
const MAX_CONTROL_RATIO = 0.18;
const WARN_LIMIT = 3;

/* ──────────────────────────────────────────────────────────────
 * DATABASE
 * ──────────────────────────────────────────────────────────────
 */

function loadDB() {
    if (!fs.existsSync(DB_PATH)) return {};

    try {
        return JSON.parse(
            fs.readFileSync(DB_PATH, 'utf8')
        );
    } catch (error) {
        console.error(
            '[ANTIVIRUS DB READ]',
            error.message
        );
        return {};
    }
}

function saveDB(data) {
    fs.mkdirSync(
        path.dirname(DB_PATH),
        { recursive: true }
    );

    fs.writeFileSync(
        DB_PATH,
        JSON.stringify(data, null, 2)
    );
}

function loadWarns() {
    if (!fs.existsSync(WARN_DB_PATH)) return {};

    try {
        return JSON.parse(
            fs.readFileSync(WARN_DB_PATH, 'utf8')
        );
    } catch (error) {
        console.error(
            '[ANTIVIRUS WARN DB READ]',
            error.message
        );
        return {};
    }
}

function saveWarns(data) {
    fs.mkdirSync(
        path.dirname(WARN_DB_PATH),
        { recursive: true }
    );

    fs.writeFileSync(
        WARN_DB_PATH,
        JSON.stringify(data, null, 2)
    );
}

/* ──────────────────────────────────────────────────────────────
 * JID
 * ──────────────────────────────────────────────────────────────
 */

function normJid(jid) {
    if (!jid) return '';
    return String(jid).replace(/:\d+@/, '@');
}

/* ──────────────────────────────────────────────────────────────
 * GROUP CONFIG
 * ──────────────────────────────────────────────────────────────
 */

function ensureGroupConfig(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',

            /*
             * Suspicious URL protection
             */
            blockLinks: true,
            blockInvites: true,

            /*
             * File protection
             */
            blockSuspiciousFiles: true,

            /*
             * Message anomaly protection
             */
            blockOversized: true,
            blockUnicodeAnomaly: true,
            blockRepeatedPayload: true,

            /*
             * Lists
             */
            whitelistDomains: [],
            blacklistDomains: [],

            /*
             * Custom filename rules
             */
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
                '.bin',
                '.dll',
                '.hta'
            ],

            /*
             * Suspicious MIME types.
             *
             * These are intentionally conservative.
             */
            blockedMimes: [
                'application/x-msdownload',
                'application/x-msdos-program',
                'application/x-executable',
                'application/x-sh',
                'application/x-shellscript',
                'application/x-bat',
                'application/vnd.microsoft.portable-executable'
            ]
        };
    } else {
        const defaults = ensureGroupConfig({}, group)[group];

        for (const [key, value] of Object.entries(defaults)) {
            if (db[group][key] === undefined) {
                db[group][key] = Array.isArray(value)
                    ? [...value]
                    : value;
            }
        }
    }

    return db[group];
}

/* ──────────────────────────────────────────────────────────────
 * MESSAGE EXTRACTION
 * ──────────────────────────────────────────────────────────────
 */

function getMessageText(m) {
    const msg = m?.message || {};

    return [
        m?.text,
        m?.body,
        msg.conversation,
        msg.extendedTextMessage?.text,
        msg.extendedTextMessage?.matchedText,
        msg.imageMessage?.caption,
        msg.videoMessage?.caption,
        msg.documentMessage?.caption,
        msg.audioMessage?.caption
    ]
        .filter(
            value =>
                typeof value === 'string' &&
                value.trim()
        )
        .join(' ')
        .trim();
}

/* ──────────────────────────────────────────────────────────────
 * URL EXTRACTION
 * ──────────────────────────────────────────────────────────────
 */

function extractUrls(text) {
    if (!text) return [];

    const matches = text.match(
        /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi
    );

    return matches || [];
}

function cleanDomain(domain) {
    return String(domain || '')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .split('?')[0]
        .split('#')[0]
        .replace(/\.$/, '');
}

function extractDomains(urls) {
    const result = [];

    for (const url of urls) {
        try {
            let value = String(url).trim();

            if (!/^https?:\/\//i.test(value)) {
                value = 'http://' + value;
            }

            const parsed = new URL(value);
            const domain = cleanDomain(parsed.hostname);

            if (domain) result.push(domain);
        } catch {
            /*
             * Ignore malformed URL.
             */
        }
    }

    return result;
}

function isTrustedDomain(domain, whitelist) {
    if (!domain || !Array.isArray(whitelist)) {
        return false;
    }

    return whitelist.some(item => {
        const allowed = cleanDomain(item);

        return (
            domain === allowed ||
            domain.endsWith('.' + allowed)
        );
    });
}

function isBlockedDomain(domain, blacklist) {
    if (!domain || !Array.isArray(blacklist)) {
        return false;
    }

    return blacklist.some(item => {
        const blocked = cleanDomain(item);

        return (
            domain === blocked ||
            domain.endsWith('.' + blocked)
        );
    });
}

/* ──────────────────────────────────────────────────────────────
 * WHATSAPP INVITE DETECTION
 * ──────────────────────────────────────────────────────────────
 */

function containsWhatsAppInvite(text) {
    return /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9_-]+/i
        .test(text);
}

/* ──────────────────────────────────────────────────────────────
 * FILE INFORMATION
 * ──────────────────────────────────────────────────────────────
 */

function getFileInfo(m) {
    const msg = m?.message || {};

    const document = msg.documentMessage;

    if (document) {
        return {
            filename: String(
                document.fileName || ''
            ),
            mimetype: String(
                document.mimetype || ''
            ),
            fileLength: Number(
                document.fileLength || 0
            )
        };
    }

    if (msg.stickerMessage) {
        return {
            filename: '',
            mimetype: 'image/webp',
            fileLength: Number(
                msg.stickerMessage.fileLength || 0
            )
        };
    }

    if (msg.imageMessage) {
        return {
            filename: '',
            mimetype: String(
                msg.imageMessage.mimetype || 'image/*'
            ),
            fileLength: Number(
                msg.imageMessage.fileLength || 0
            )
        };
    }

    if (msg.videoMessage) {
        return {
            filename: '',
            mimetype: String(
                msg.videoMessage.mimetype || 'video/*'
            ),
            fileLength: Number(
                msg.videoMessage.fileLength || 0
            )
        };
    }

    if (msg.audioMessage) {
        return {
            filename: '',
            mimetype: String(
                msg.audioMessage.mimetype || 'audio/*'
            ),
            fileLength: Number(
                msg.audioMessage.fileLength || 0
            )
        };
    }

    return null;
}

/* ──────────────────────────────────────────────────────────────
 * SUSPICIOUS FILE DETECTION
 * ──────────────────────────────────────────────────────────────
 */

function hasBlockedExtension(filename, extensions) {
    if (!filename) return false;

    const lower = filename.toLowerCase();

    return extensions.some(ext =>
        lower.endsWith(
            String(ext).toLowerCase()
        )
    );
}

function hasSuspiciousDoubleExtension(filename) {
    if (!filename) return false;

    const lower = filename.toLowerCase();

    /*
     * Examples of suspicious naming patterns:
     *
     * photo.jpg.exe
     * document.pdf.js
     * video.mp4.apk
     *
     * We only inspect the filename.
     */
    return /\.(jpg|jpeg|png|gif|webp|mp4|mp3|pdf|doc|docx|xls|xlsx|zip|rar)\.(apk|exe|js|jse|vbs|bat|cmd|scr|msi|jar|ps1)$/i
        .test(lower);
}

function hasBlockedMime(mimetype, blockedMimes) {
    if (!mimetype) return false;

    const lower = mimetype.toLowerCase();

    return blockedMimes.some(mime =>
        lower === String(mime).toLowerCase()
    );
}

/* ──────────────────────────────────────────────────────────────
 * MESSAGE ANOMALY DETECTION
 * ──────────────────────────────────────────────────────────────
 */

function hasOversizedText(text) {
    return Boolean(
        text &&
        text.length > MAX_TEXT_LENGTH
    );
}

function hasRepeatedPayload(text) {
    if (!text) return false;

    /*
     * Long repeated characters can create very noisy,
     * abusive or resource-heavy messages.
     */
    return new RegExp(
        `(.)\\1{${MAX_REPEATED_RUN},}`,
        'u'
    ).test(text);
}

function unicodeControlRatio(text) {
    if (!text) return 0;

    let controls = 0;

    for (const char of text) {
        const code = char.codePointAt(0);

        /*
         * Ignore normal whitespace.
         */
        if (
            code !== 9 &&
            code !== 10 &&
            code !== 13 &&
            (
                (code >= 0 && code <= 8) ||
                (code >= 14 && code <= 31) ||
                code === 127
            )
        ) {
            controls++;
        }
    }

    return controls / Math.max(text.length, 1);
}

function hasUnicodeAnomaly(text) {
    if (!text) return false;

    return (
        unicodeControlRatio(text) >
        MAX_CONTROL_RATIO
    );
}

/* ──────────────────────────────────────────────────────────────
 * SECURITY ANALYSIS
 * ──────────────────────────────────────────────────────────────
 */

function inspectMessage(m, cfg) {
    const text = getMessageText(m);
    const urls = extractUrls(text);
    const domains = extractDomains(urls);
    const file = getFileInfo(m);

    /*
     * 1. Block explicitly blacklisted domains.
     */
    for (const domain of domains) {
        if (
            isBlockedDomain(
                domain,
                cfg.blacklistDomains
            )
        ) {
            return {
                detected: true,
                type: 'BLACKLISTED DOMAIN',
                reason: `Blocked domain: ${domain}`
            };
        }
    }

    /*
     * 2. Link protection.
     */
    if (
        cfg.blockLinks &&
        urls.length
    ) {
        const allTrusted =
            domains.length > 0 &&
            domains.every(domain =>
                isTrustedDomain(
                    domain,
                    cfg.whitelistDomains
                )
            );

        if (!allTrusted) {
            return {
                detected: true,
                type: 'SUSPICIOUS LINK',
                reason: 'Untrusted URL detected'
            };
        }
    }

    /*
     * 3. WhatsApp invite protection.
     */
    if (
        cfg.blockInvites &&
        containsWhatsAppInvite(text)
    ) {
        return {
            detected: true,
            type: 'GROUP INVITE',
            reason: 'WhatsApp group invitation detected'
        };
    }

    /*
     * 4. File inspection.
     *
     * No file is downloaded here.
     */
    if (
        cfg.blockSuspiciousFiles &&
        file
    ) {
        if (
            hasBlockedExtension(
                file.filename,
                cfg.blockedExtensions
            )
        ) {
            return {
                detected: true,
                type: 'SUSPICIOUS FILE',
                reason:
                    `Blocked file type: ${file.filename || file.mimetype}`
            };
        }

        if (
            hasSuspiciousDoubleExtension(
                file.filename
            )
        ) {
            return {
                detected: true,
                type: 'DOUBLE EXTENSION',
                reason:
                    `Suspicious filename: ${file.filename}`
            };
        }

        if (
            hasBlockedMime(
                file.mimetype,
                cfg.blockedMimes
            )
        ) {
            return {
                detected: true,
                type: 'SUSPICIOUS MIME',
                reason:
                    `Blocked MIME type: ${file.mimetype}`
            };
        }
    }

    /*
     * 5. Oversized text.
     */
    if (
        cfg.blockOversized &&
        hasOversizedText(text)
    ) {
        return {
            detected: true,
            type: 'OVERSIZED MESSAGE',
            reason:
                `Message exceeds ${MAX_TEXT_LENGTH} characters`
        };
    }

    /*
     * 6. Repeated payload.
     */
    if (
        cfg.blockRepeatedPayload &&
        hasRepeatedPayload(text)
    ) {
        return {
            detected: true,
            type: 'REPEATED PAYLOAD',
            reason:
                'Abnormally long repeated character sequence'
        };
    }

    /*
     * 7. Control-character anomaly.
     */
    if (
        cfg.blockUnicodeAnomaly &&
        hasUnicodeAnomaly(text)
    ) {
        return {
            detected: true,
            type: 'UNICODE ANOMALY',
            reason:
                'Abnormal control-character ratio detected'
        };
    }

    return {
        detected: false
    };
}

/* ──────────────────────────────────────────────────────────────
 * WARNING SYSTEM
 * ──────────────────────────────────────────────────────────────
 */

function addWarning(group, sender, reason) {
    const warns = loadWarns();

    const key = `${group}_${sender}`;

    if (!warns[key]) {
        warns[key] = {
            user: sender,
            count: 0,
            reasons: [],
            updatedAt: Date.now()
        };
    }

    warns[key].count += 1;

    if (!Array.isArray(warns[key].reasons)) {
        warns[key].reasons = [];
    }

    warns[key].reasons.push({
        reason,
        timestamp: Date.now()
    });

    /*
     * Keep the database reasonably small.
     */
    warns[key].reasons =
        warns[key].reasons.slice(-10);

    warns[key].updatedAt = Date.now();

    saveWarns(warns);

    return warns[key].count;
}

/* ──────────────────────────────────────────────────────────────
 * ADMIN CHECK
 * ──────────────────────────────────────────────────────────────
 */

async function getAdminState(sock, group, sender) {
    const meta = await sock
        .groupMetadata(group)
        .catch(() => null);

    if (!meta) {
        return {
            meta: null,
            isAdmin: false
        };
    }

    const target = normJid(sender);

    const admin = meta.participants?.some(
        participant =>
            normJid(participant.id) === target &&
            (
                participant.admin === 'admin' ||
                participant.admin === 'superadmin'
            )
    );

    return {
        meta,
        isAdmin: Boolean(admin)
    };
}

/* ──────────────────────────────────────────────────────────────
 * DELETE
 * ──────────────────────────────────────────────────────────────
 */

async function deleteMessage(sock, m) {
    if (!m?.key) return false;

    try {
        await sock.sendMessage(
            m.chat,
            { delete: m.key }
        );

        return true;
    } catch (error) {
        console.error(
            '[ANTIVIRUS DELETE]',
            error.message
        );

        return false;
    }
}

/* ──────────────────────────────────────────────────────────────
 * COMMAND
 * ──────────────────────────────────────────────────────────────
 */

module.exports = {
    name: 'antivirus',
    alias: [
        'av',
        'virusguard',
        'msgfirewall'
    ],

    desc:
        'Advanced group message antivirus and security firewall',

    category: 'Admin',

    groupOnly: true,
    adminOnly: true,

    reactions: {
        start: '🛡️',
        success: '✅'
    },

    execute: async (
        sock,
        m,
        { args, reply }
    ) => {
        try {
            if (!m.isGroup) {
                return reply(
                    '_*🛡️ Antivirus is group-only*_'
                );
            }

            const db = loadDB();
            const group = m.chat;
            const cfg = ensureGroupConfig(
                db,
                group
            );

            saveDB(db);

            const sub =
                String(args?.[0] || '')
                    .toLowerCase();

            if (!sub) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • ANTIVIRUS PRO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─🛡️ *SECURITY FIREWALL*
│ ❏ Status : ${cfg.enabled ? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${cfg.action.toUpperCase()}
│ ❏ Links : ${cfg.blockLinks ? 'ON' : 'OFF'}
│ ❏ Invites : ${cfg.blockInvites ? 'ON' : 'OFF'}
│ ❏ Files : ${cfg.blockSuspiciousFiles ? 'ON' : 'OFF'}
│ ❏ Unicode : ${cfg.blockUnicodeAnomaly ? 'ON' : 'OFF'}
│ ❏ Oversize : ${cfg.blockOversized ? 'ON' : 'OFF'}
│ ❏ Repetition : ${cfg.blockRepeatedPayload ? 'ON' : 'OFF'}
│
│ ❏ antivirus on/off
│ ❏ antivirus delete/warn/kick
│ ❏ antivirus links on/off
│ ❏ antivirus invites on/off
│ ❏ antivirus files on/off
│ ❏ antivirus unicode on/off
│ ❏ antivirus oversize on/off
│ ❏ antivirus repeat on/off
│
│ ❏ antivirus allow <domain>
│ ❏ antivirus unallow <domain>
│ ❏ antivirus block <domain>
│ ❏ antivirus unblock <domain>
│
│ ❏ antivirus allowlist
│ ❏ antivirus blocklist
│ ❏ antivirus scan
│ ❏ antivirus warncount @user
│ ❏ antivirus listwarns
│ ❏ antivirus resetwarn @user
│ ❏ antivirus resetall
│ ❏ antivirus stats
│ ❏ antivirus clear
╰─────────────────────────╯`
                );
            }

            /* ──────────────────────────────────────────
             * ON / OFF
             * ──────────────────────────────────────────
             */

            if (sub === 'on') {
                cfg.enabled = true;
                saveDB(db);

                return reply(
                    `_*🛡️ ANTIVIRUS ACTIVE*_\n` +
                    `❏ Action : ${cfg.action.toUpperCase()}`
                );
            }

            if (sub === 'off') {
                cfg.enabled = false;
                saveDB(db);

                return reply(
                    '_*🛡️ ANTIVIRUS INACTIVE*_'
                );
            }

            /* ──────────────────────────────────────────
             * ACTION
             * ──────────────────────────────────────────
             */

            if (
                ['delete', 'warn', 'kick']
                    .includes(sub)
            ) {
                cfg.action = sub;
                saveDB(db);

                return reply(
                    `_*◉ Antivirus Action SET*_\n` +
                    `❏ Mode : ${sub.toUpperCase()}`
                );
            }

            /* ──────────────────────────────────────────
             * FEATURE TOGGLES
             * ──────────────────────────────────────────
             */

            const featureMap = {
                links: 'blockLinks',
                invites: 'blockInvites',
                files: 'blockSuspiciousFiles',
                unicode: 'blockUnicodeAnomaly',
                oversize: 'blockOversized',
                repeat: 'blockRepeatedPayload'
            };

            if (featureMap[sub]) {
                const mode =
                    String(args?.[1] || '')
                        .toLowerCase();

                if (!['on', 'off'].includes(mode)) {
                    return reply(
                        `_*✐ Usage*_ : antivirus ${sub} on/off`
                    );
                }

                cfg[featureMap[sub]] =
                    mode === 'on';

                saveDB(db);

                return reply(
                    `_*🛡️ ${sub.toUpperCase()} ${mode === 'on' ? 'ENABLED' : 'DISABLED'}*_`
                );
            }

            /* ──────────────────────────────────────────
             * DOMAIN WHITELIST
             * ──────────────────────────────────────────
             */

            if (sub === 'allow') {
                const domain =
                    cleanDomain(args?.[1]);

                if (!domain) {
                    return reply(
                        '_*✐ Usage*_ : antivirus allow <domain>'
                    );
                }

                if (
                    cfg.whitelistDomains
                        .includes(domain)
                ) {
                    return reply(
                        '_*❏ Domain Already Allowed*_'
                    );
                }

                cfg.whitelistDomains.push(domain);
                saveDB(db);

                return reply(
                    `_*✓ Trusted Domain Added*_\n` +
                    `❏ ${domain}`
                );
            }

            if (sub === 'unallow') {
                const domain =
                    cleanDomain(args?.[1]);

                if (!domain) {
                    return reply(
                        '_*✐ Usage*_ : antivirus unallow <domain>'
                    );
                }

                const index =
                    cfg.whitelistDomains
                        .indexOf(domain);

                if (index === -1) {
                    return reply(
                        '_*❏ Domain Not Found*_'
                    );
                }

                cfg.whitelistDomains
                    .splice(index, 1);

                saveDB(db);

                return reply(
                    `_*✓ Trusted Domain Removed*_\n` +
                    `❏ ${domain}`
                );
            }

            /* ──────────────────────────────────────────
             * DOMAIN BLACKLIST
             * ──────────────────────────────────────────
             */

            if (sub === 'block') {
                const domain =
                    cleanDomain(args?.[1]);

                if (!domain) {
                    return reply(
                        '_*✐ Usage*_ : antivirus block <domain>'
                    );
                }

                if (
                    cfg.blacklistDomains
                        .includes(domain)
                ) {
                    return reply(
                        '_*❏ Domain Already Blocked*_'
                    );
                }

                cfg.blacklistDomains.push(domain);
                saveDB(db);

                return reply(
                    `_*✓ Blocked Domain Added*_\n` +
                    `❏ ${domain}`
                );
            }

            if (sub === 'unblock') {
                const domain =
                    cleanDomain(args?.[1]);

                if (!domain) {
                    return reply(
                        '_*✐ Usage*_ : antivirus unblock <domain>'
                    );
                }

                const index =
                    cfg.blacklistDomains
                        .indexOf(domain);

                if (index === -1) {
                    return reply(
                        '_*❏ Blocked Domain Not Found*_'
                    );
                }

                cfg.blacklistDomains
                    .splice(index, 1);

                saveDB(db);

                return reply(
                    `_*✓ Blocked Domain Removed*_\n` +
                    `❏ ${domain}`
                );
            }

            /* ──────────────────────────────────────────
             * LISTS
             * ──────────────────────────────────────────
             */

            if (sub === 'allowlist') {
                if (
                    !cfg.whitelistDomains.length
                ) {
                    return reply(
                        '_*❏ No Trusted Domains*_'
                    );
                }

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • TRUSTED DOMAINS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

${cfg.whitelistDomains
    .map((x, i) => `${i + 1}. ${x}`)
    .join('\n')}`
                );
            }

            if (sub === 'blocklist') {
                if (
                    !cfg.blacklistDomains.length
                ) {
                    return reply(
                        '_*❏ No Blocked Domains*_'
                    );
                }

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • BLOCKED DOMAINS •
✦ ───── ⋅☆⋅⋆ ───── ✦

${cfg.blacklistDomains
    .map((x, i) => `${i + 1}. ${x}`)
    .join('\n')}`
                );
            }

            /* ──────────────────────────────────────────
             * SCAN CURRENT MESSAGE
             * ──────────────────────────────────────────
             */

            if (sub === 'scan') {
                const result =
                    inspectMessage(m, cfg);

                if (!result.detected) {
                    return reply(
                        `_*🟢 SCAN CLEAN*_\n\n` +
                        `No configured security indicator was detected.`
                    );
                }

                return reply(
                    `_*🔴 SECURITY INDICATOR*_\n\n` +
                    `❏ Type : ${result.type}\n` +
                    `❏ Reason : ${result.reason}`
                );
            }

            /* ──────────────────────────────────────────
             * WARN COUNT
             * ──────────────────────────────────────────
             */

            if (sub === 'warncount') {
                let target =
                    m.mentionedJid?.[0] ||
                    m.quoted?.sender;

                if (!target && args?.[1]) {
                    const number =
                        String(args[1])
                            .replace(/[^0-9]/g, '');

                    if (number) {
                        target =
                            `${number}@s.whatsapp.net`;
                    }
                }

                if (!target) {
                    return reply(
                        '_*✐ Usage*_ : antivirus warncount @user/reply/number'
                    );
                }

                target = normJid(target);

                const warns = loadWarns();
                const key =
                    `${group}_${target}`;

                const count =
                    warns[key]?.count || 0;

                return reply(
                    `_*❏ Antivirus Warning Status*_\n` +
                    `◉ User : @${target.split('@')[0]}\n` +
                    `◉ Count : ${count}/${WARN_LIMIT}`,
                    {
                        mentions: [target]
                    }
                );
            }

            /* ──────────────────────────────────────────
             * LIST WARNINGS
             * ──────────────────────────────────────────
             */

            if (sub === 'listwarns') {
                const warns = loadWarns();

                const records =
                    Object.entries(warns)
                        .filter(
                            ([key]) =>
                                key.startsWith(
                                    group + '_'
                                )
                        )
                        .sort(
                            (a, b) =>
                                (b[1].count || 0) -
                                (a[1].count || 0)
                        )
                        .slice(0, 10);

                if (!records.length) {
                    return reply(
                        '_*❏ No Active Antivirus Warnings*_'
                    );
                }

                const mentions = [];

                let text =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • ANTIVIRUS WARNS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─🛡️ *TOP OFFENDERS*
`;

                records.forEach(
                    ([, value], index) => {
                        const user = value.user;

                        mentions.push(user);

                        text +=
                            `│ ${index + 1}. @${user.split('@')[0]} - ${value.count}/${WARN_LIMIT}\n`;
                    }
                );

                text +=
                    '╰─────────────────────────╯';

                return reply(
                    text,
                    { mentions }
                );
            }

            /* ──────────────────────────────────────────
             * RESET USER
             * ──────────────────────────────────────────
             */

            if (sub === 'resetwarn') {
                let target =
                    m.mentionedJid?.[0] ||
                    m.quoted?.sender;

                if (!target && args?.[1]) {
                    const number =
                        String(args[1])
                            .replace(/[^0-9]/g, '');

                    if (number) {
                        target =
                            `${number}@s.whatsapp.net`;
                    }
                }

                if (!target) {
                    return reply(
                        '_*✐ Usage*_ : antivirus resetwarn @user/reply/number'
                    );
                }

                target = normJid(target);

                const warns = loadWarns();
                const key =
                    `${group}_${target}`;

                if (!warns[key]) {
                    return reply(
                        '_*❏ No Warnings Found*_'
                    );
                }

                delete warns[key];
                saveWarns(warns);

                return reply(
                    `_*✓ Antivirus Warnings Reset*_\n` +
                    `◉ User : @${target.split('@')[0]}`,
                    {
                        mentions: [target]
                    }
                );
            }

            /* ──────────────────────────────────────────
             * RESET ALL
             * ──────────────────────────────────────────
             */

            if (sub === 'resetall') {
                const warns = loadWarns();

                let cleared = 0;

                for (
                    const key of Object.keys(warns)
                ) {
                    if (
                        key.startsWith(
                            group + '_'
                        )
                    ) {
                        delete warns[key];
                        cleared++;
                    }
                }

                saveWarns(warns);

                return reply(
                    `_*✓ Antivirus Reset Complete*_\n` +
                    `❏ Cleared : ${cleared} warning records`
                );
            }

            /* ──────────────────────────────────────────
             * STATS
             * ──────────────────────────────────────────
             */

            if (sub === 'stats') {
                const warns = loadWarns();

                const groupWarns =
                    Object.keys(warns)
                        .filter(
                            key =>
                                key.startsWith(
                                    group + '_'
                                )
                        );

                const total =
                    groupWarns.reduce(
                        (sum, key) =>
                            sum +
                            Number(
                                warns[key]?.count || 0
                            ),
                        0
                    );

                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • ANTIVIRUS STATS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─🛡️ *SECURITY FIREWALL*
│ ❏ Status : ${cfg.enabled ? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${cfg.action.toUpperCase()}
│ ❏ Links : ${cfg.blockLinks ? 'ON' : 'OFF'}
│ ❏ Invites : ${cfg.blockInvites ? 'ON' : 'OFF'}
│ ❏ Files : ${cfg.blockSuspiciousFiles ? 'ON' : 'OFF'}
│ ❏ Unicode : ${cfg.blockUnicodeAnomaly ? 'ON' : 'OFF'}
│ ❏ Oversize : ${cfg.blockOversized ? 'ON' : 'OFF'}
│ ❏ Repeat : ${cfg.blockRepeatedPayload ? 'ON' : 'OFF'}
│ ❏ Trusted Domains : ${cfg.whitelistDomains.length}
│ ❏ Blocked Domains : ${cfg.blacklistDomains.length}
│ ❏ Users Warned : ${groupWarns.length}
│ ❏ Total Warnings : ${total}
╰─────────────────────────╯`
                );
            }

            /* ──────────────────────────────────────────
             * CLEAR CONFIG
             * ──────────────────────────────────────────
             */

            if (sub === 'clear') {
                db[group] = {
                    enabled: false,
                    action: 'delete',
                    blockLinks: true,
                    blockInvites: true,
                    blockSuspiciousFiles: true,
                    blockOversized: true,
                    blockUnicodeAnomaly: true,
                    blockRepeatedPayload: true,
                    whitelistDomains: [],
                    blacklistDomains: [],
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
                        '.bin',
                        '.dll',
                        '.hta'
                    ],
                    blockedMimes: [
                        'application/x-msdownload',
                        'application/x-msdos-program',
                        'application/x-executable',
                        'application/x-sh',
                        'application/x-shellscript',
                        'application/x-bat',
                        'application/vnd.microsoft.portable-executable'
                    ]
                };

                saveDB(db);

                return reply(
                    `_*✓ Antivirus Settings Cleared*_\n` +
                    `❏ Status : OFF\n` +
                    `❏ Security lists : CLEARED\n` +
                    `❏ Default protections : RESTORED`
                );
            }

            return reply(
                '_*✐ Usage*_ : antivirus on/off/delete/warn/kick/links/invites/files/unicode/oversize/repeat/allow/unallow/block/unblock/allowlist/blocklist/scan/warncount/listwarns/resetwarn/resetall/stats/clear'
            );

        } catch (error) {
            console.error(
                '[ANTIVIRUS COMMAND ERROR]',
                error
            );

            return reply(
                `❌ Antivirus error: ${error.message}`
            );
        }
    }
};

/* ══════════════════════════════════════════════════════════════
 * MESSAGE HANDLER
 * ══════════════════════════════════════════════════════════════
 */

module.exports.handleAntivirus = async function(
    sock,
    m
) {
    try {
        if (!m?.isGroup) return;
        if (m.key?.fromMe) return;

        const db = loadDB();
        const group = m.chat;

        if (!db[group]) return;

        const cfg = db[group];

        if (!cfg.enabled) return;

        /*
         * Get sender.
         */
        const sender =
            normJid(
                m.sender ||
                m.key?.participant ||
                m.key?.remoteJid
            );

        if (!sender) return;

        /*
         * Never moderate administrators.
         */
        const {
            meta,
            isAdmin
        } = await getAdminState(
            sock,
            group,
            sender
        );

        if (!meta) return;

        if (isAdmin) return;

        /*
         * Analyze without downloading
         * the attached file.
         */
        const result =
            inspectMessage(
                m,
                cfg
            );

        if (!result.detected) return;

        const action =
            cfg.action || 'delete';

        /*
         * Always remove the offending message
         * before applying escalation.
         */
        await deleteMessage(
            sock,
            m
        );

        /* ─────────────────────────────────────────────
         * DELETE
         * ─────────────────────────────────────────────
         */

        if (action === 'delete') {
            await sock.sendMessage(
                group,
                {
                    text:
                        `_*🛡️ SECURITY BLOCK*_\n\n` +
                        `◉ User : @${sender.split('@')[0]}\n` +
                        `◉ Threat : ${result.type}\n` +
                        `◉ Reason : ${result.reason}\n` +
                        `◉ Action : MESSAGE DELETED`,
                    mentions: [sender]
                }
            ).catch(() => {});

            console.log(
                `[XADON AI ANTIVIRUS] DELETE → ` +
                `${sender.split('@')[0]} | ` +
                `${result.type}`
            );

            return;
        }

        /* ─────────────────────────────────────────────
         * WARN
         * ─────────────────────────────────────────────
         */

        if (action === 'warn') {
            const count =
                addWarning(
                    group,
                    sender,
                    result.reason
                );

            if (count >= WARN_LIMIT) {
                const warns =
                    loadWarns();

                delete warns[
                    `${group}_${sender}`
                ];

                saveWarns(warns);

                await sock.sendMessage(
                    group,
                    {
                        text:
                            `_*🛡️ SECURITY USER REMOVED*_\n\n` +
                            `❏ Target : @${sender.split('@')[0]}\n` +
                            `❏ Threat : ${result.type}\n` +
                            `❏ Reason : ${result.reason}\n` +
                            `❏ Warnings : ${WARN_LIMIT}/${WARN_LIMIT}`,
                        mentions: [sender]
                    }
                ).catch(() => {});

                await sock
                    .groupParticipantsUpdate(
                        group,
                        [sender],
                        'remove'
                    )
                    .catch(() => {});

                console.log(
                    `[XADON AI ANTIVIRUS] KICK → ` +
                    `${sender.split('@')[0]} | ` +
                    `${result.type}`
                );

                return;
            }

            await sock.sendMessage(
                group,
                {
                    text:
                        `_*⚠️ SECURITY WARNING*_\n\n` +
                        `◉ User : @${sender.split('@')[0]}\n` +
                        `◉ Threat : ${result.type}\n` +
                        `◉ Reason : ${result.reason}\n` +
                        `◉ Warnings : ${count}/${WARN_LIMIT}\n` +
                        `◉ Remaining : ${WARN_LIMIT - count}`,
                    mentions: [sender]
                }
            ).catch(() => {});

            return;
        }

        /* ─────────────────────────────────────────────
         * KICK
         * ─────────────────────────────────────────────
         */

        if (action === 'kick') {
            await sock.sendMessage(
                group,
                {
                    text:
                        `_*🛡️ SECURITY USER REMOVED*_\n\n` +
                        `❏ Target : @${sender.split('@')[0]}\n` +
                        `❏ Threat : ${result.type}\n` +
                        `❏ Reason : ${result.reason}`,
                    mentions: [sender]
                }
            ).catch(() => {});

            await sock
                .groupParticipantsUpdate(
                    group,
                    [sender],
                    'remove'
                )
                .catch(() => {});

            console.log(
                `[XADON AI ANTIVIRUS] KICK → ` +
                `${sender.split('@')[0]} | ` +
                `${result.type}`
            );

            return;
        }

    } catch (error) {
        console.error(
            '[XADON AI ANTIVIRUS ERROR]',
            error.message
        );
    }
};