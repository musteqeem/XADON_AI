/**
 * ╔══════════╗
 * ║ - OMFAMM WA BOT AKA XADON AI V2.0 ║
 * ║ XADON AI V2 Message Routing Engine
 * ║ This is a property of XADON AI/OMFAMM AI all rights reserved
 * ╚══════════════════╝
 */

const chalk = require('chalk');
const { setupStatusHandler } = require('./src/Plugin/statusHandler');
const { getVar } = require('./src/Plugin/configManager');

const styles = require("./src/Commands/Core/'.js");
const botFont = require('./src/Commands/Bot/botfont.js');

const { translate } = require('./src/Commands/Core/✐.js');
const { getLang } = require('./src/Commands/Bot/botlang.js');
const { generateMessageID } = require('@musteqeem/baileys');

const MARKER = '\u200E';

const translationCache = new Map();
const CACHE_TTL = 3600000;

// Message TTL: 48 hours in milliseconds
const MESSAGE_TTL = 48 * 60 * 60 * 1000;

const ignoredErrors = [
    'Socket connection timeout', 'EKEYTYPE', 'item-not-found',
    'rate-overlimit', 'Connection Closed', 'Timed Out', 'Value not found',
    'Bad MAC', 'decrypt error', 'Socket closed', 'Session closed',
    'Connection terminated', 'read ECONNRESET', 'write ECONNRESET',
    'ECONNREFUSED', 'connect ETIMEDOUT', 'network timeout'
];

module.exports = function setupMessageHandler(sock, customStore, handleMessage, smsg, io, config) {

    // @musteqeem 29/08/26. FIX: Auto-initialize message store to prevent "Cannot read properties of undefined"
    if (!customStore) customStore = {};
    if (!customStore.messages) customStore.messages = new Map();

    const originalSend = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content, options = {}) => {
        try {
            if (jid === 'status@broadcast') {
                return originalSend(jid, content, options);
            }

            const processText = async (inputText) => {
                if (!inputText || typeof inputText!== 'string') return inputText;
                let text = inputText;

                const targetLang = getLang(jid);
                if (targetLang && text.trim().length > 0) {
                    const skipPatterns = ['.setlang', '.tr', 'Usage:'];
                    if (!skipPatterns.some(p => text.includes(p))) {
                        const cacheKey = `${text}|${targetLang}`;
                        let translatedText = translationCache.get(cacheKey);
                        if (!translatedText) {
                            try {
                                const result = await translate(text, targetLang);
                                if (result?.translated) {
                                    translatedText = result.translated;
                                    translationCache.set(cacheKey, translatedText);
                                    setTimeout(() => translationCache.delete(cacheKey), CACHE_TTL);
                                }
                            } catch (err) {
                                console.error('[TRANSLATE ERROR]', err.message);
                            }
                        }
                        if (translatedText) text = translatedText;
                    }
                }

                const font = botFont.getFont(jid);
                if (font && styles[font]) {
                    text = styles[font](text);
                }
                return text;
            };

            if (content?.text) {
                content.text = await processText(content.text);
                content.text = (content.text || '') + MARKER;
            }

            if (content?.caption) {
                content.caption = await processText(content.caption);
                content.caption = (content.caption || '') + MARKER;
            }

            const aiEnabled = getVar('AI_BADGE', true);
            let isPrivateChat = false;
            const jidStr = typeof jid === 'string'? jid : (Array.isArray(jid)? jid[0] : '');
            if (jidStr) {
                isPrivateChat = (jidStr.endsWith('@s.whatsapp.net') || jidStr.endsWith('@lid'))
                             &&!jidStr.includes('@g.us');
            }
            if (aiEnabled && isPrivateChat) {
                content.ai = true;
            }
            //@musteqeem 21/08/25 SMSL TOGGLE ON OR OFF 
            content.secureMetaServiceLabel = getVar('SECURE_META_LABEL', true);

            const isMediaMessage =!!(
                content?.image ||
                content?.video ||
                content?.caption
            );

            if (isMediaMessage &&!options.skipVerified) {
                content.contextInfo = {
                   ...(content.contextInfo || {}),
                    forwardingScore: 999,
                    isForwarded: true,
                    participant: "0@s.whatsapp.net",
                    remoteJid: "0@s.whatsapp.net",
                    quotedMessage: {
                        conversation: "```⌘ XAD֎N AI 𓀀```"
                    },
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363423325164241@newsletter',
                        newsletterName: '🔖 𝓂𝓊𝓈𝓉ℯ𝓆ℯ𝓮𝓂 𝓿𝓮𝓻𝓲𝓯𝓲𝓮𝓭 ✓',
                        serverMessageId: 1
                    }
                };

if (!options.quoted) {
    options.quoted = {
        key: {
            remoteJid: "0@s.whatsapp.net",
            fromMe: false,
            participant: "0@s.whatsapp.net",
            id: generateMessageID() //@musteqeem FIX 30/08/26. USE BAILEYS CUSTOM MSG ID INSTEAD OF 3EBO 
        },
                      message: {
                            conversation: "```ஃ☦︎ ֎•𝗔𝗜‎ 🜲```"
                        }
                    };
                }
            }

        } catch (err) {
            console.error('[SEND OVERRIDE ERROR]', err.message);
        }
        return originalSend(jid, content, options);
    };

    setupStatusHandler(sock);

    const { patchGroupEvents } = require('./src/Plugin/groupEventsPatch');
    patchGroupEvents(sock);

    const econ = require('./src/Commands/Economy/econ.js');
    // econ.startNotifChecker(sock);

    try {
        const autonews = require('./src/Commands/Owner/ཽ.js');
        autonews.startAutoNews(sock);
    } catch (err) {
        console.error('[AUTONEWS] Init error:', err.message);
    }

    sock.ev.on('call', async (calls) => {
        try {
            const {
                loadConfig, saveConfig, isWithinSchedule,
                isInBlacklist, isInWhitelist, normalizeJid
            } = require('./src/Plugin/anticallManager');

            const config = loadConfig();
            if (!config.enabled) return;

            if (!config.pendingPhoneReject) config.pendingPhoneReject = [];

            const ownerJid = `${config.owner || process.env.OWNER_NUMBER}@s.whatsapp.net`;

            for (const call of calls) {
                if (call.status!== 'offer') continue;

                const callerJid = call.from;
                const normalizedCaller = normalizeJid(callerJid);
                const phoneMatch = normalizedCaller.match(/^(\d+)@s\.whatsapp\.net$/);
                const callerPhone = phoneMatch? phoneMatch[1] : null;

                if (isInWhitelist(normalizedCaller, config.whitelist)) continue;
                if (isInBlacklist(normalizedCaller, config.blacklist)) {
                    await sock.sendMessage(callerJid, { text: config.reason }).catch(() => {});
                    if (typeof sock.rejectCall === 'function') await sock.rejectCall(call.id, call.from).catch(() => {});
                    continue;
                }

                if (callerPhone && config.pendingPhoneReject.includes(callerPhone)) {
                    config.blacklist = config.blacklist.filter(b => normalizeJid(b)!== `${callerPhone}@s.whatsapp.net`);
                    if (!config.blacklist.includes(normalizedCaller)) config.blacklist.push(normalizedCaller);
                    config.pendingPhoneReject = config.pendingPhoneReject.filter(p => p!== callerPhone);
                    saveConfig(config);
                }

                if (!isWithinSchedule(config.schedule)) continue;

                let reasonToSend = config.reason;
                let isUnknown = false;
                if (!callerPhone ||!config.pendingPhoneReject.includes(callerPhone)) {
                    isUnknown = true;
                    reasonToSend = config.unknownReason || config.reason;
                }

                await sock.sendMessage(callerJid, { text: reasonToSend }).catch(() => {});
                if (typeof sock.rejectCall === 'function') await sock.rejectCall(call.id, call.from).catch(() => {});

                if (isUnknown) {
                    const dmMsg = `📵 *Unknown call blocked*\nCaller JID: \`${normalizedCaller}\`\n\n_To block: *.anticall reject add ${normalizedCaller}*_\n_To whitelist: *.anticall whitelist add ${normalizedCaller}*_`;
                    await sock.sendMessage(ownerJid, { text: dmMsg }).catch(() => {});
                }
            }
        } catch (err) {
            console.error('[ANTICALL ERROR]', err.message);
        }
    });

    try {
        const vv = require('./src/Commands/Converter/view-once.js');
        if (vv?.setup) vv.setup(sock, customStore);
    } catch {}

    try {
        const muteCmd = require('./src/Commands/Admin/mute.js');
        if (muteCmd?.setupMuteSchedules) muteCmd.setupMuteSchedules(sock);
    } catch {}

    try {
        const reminders = require('./src/Commands/Any Idea/remind.js');
        if (reminders?.setupReminders) reminders.setupReminders(sock);
    } catch (error) {
        console.error('[REMINDER SETUP ERROR]', error.message);
    }

    sock.ev.on('presence.update', ({ id, presences }) => {
        if (!global.onlineUsers) global.onlineUsers = new Set();
        for (const [jid, presence] of Object.entries(presences)) {
            if (['available', 'composing', 'recording'].includes(presence.lastKnownPresence)) {
                global.onlineUsers.add(jid);
            } else {
                global.onlineUsers.delete(jid);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            // @musteqeem 03/21/26. FIX: Re-check init inside event
            if (!customStore.messages) customStore.messages = new Map();

            const mek = chatUpdate.messages[0];
            if (!mek ||!mek.message) return;
            if (mek.key?.remoteJid === 'status@broadcast') return;

            if (mek.message.ephemeralMessage) {
                mek.message = mek.message.ephemeralMessage.message;
            }

            const m = await smsg(sock, mek, customStore);
            if (!m) return;

            try {
                const antiedit = require('./src/Commands/Tools/antiedit.js');
                if (antiedit?.cacheOriginal) antiedit.cacheOriginal(mek.key.id, mek.message);
            } catch (err) {}

            if (getVar('AUTO_READ', false)) {
                await sock.readMessages([mek.key]).catch(() => {});
            }

            // @musteqeem 03/25/26. FIX: Guard + remove duplicate.set
            if (mek.key?.remoteJid && mek.key?.id && customStore?.messages) {
                customStore.messages.set(mek.key.remoteJid + ':' + mek.key.id, {
                    message: mek,
                    timestamp: Date.now()
                });
            }

            try {
                const antidelete = require('./src/Commands/Tools/antidelete.js');
                if (antidelete?.cacheMessage) antidelete.cacheMessage(mek);
            } catch {}

            // @musteqeem FIX 23/07/26 CHANGED: Stats → xdnStats
            if (!global.xdnStats) global.xdnStats = { messages: 0 };
            global.xdnStats.messages++;

            io.emit('new-message', {
                from: m.sender,
                chat: m.chat,
                text: m.text || '[Media]',
                isGroup: m.isGroup,
                time: Date.now()
            });

            try {
                const typingMode = getVar('FAKE_TYPING', 'off');
                if (typingMode === 'all') {
                    await sock.sendPresenceUpdate('composing', m.key.remoteJid);
                } else if (typingMode === 'cmd') {
                    const bodyCheck = (mek.message?.conversation || mek.message?.extendedTextMessage?.text || '').trim();
                    const prefixCheck = getVar('PREFIX', '.');
                    if (bodyCheck.startsWith(prefixCheck)) {
                        await sock.sendPresenceUpdate('composing', m.key.remoteJid);
                    }
                }
            } catch {}

            try {
                const autoRecording = getVar('AUTO_RECORDING', config?.mode?.autoRecording?? false);
                if (autoRecording) {
                    await sock.sendPresenceUpdate('recording', m.key.remoteJid);
                }
            } catch {}

            // ── MESSAGE HANDLERS ─────────────────────────────────────────
            // Automatic behavior is implemented by its command module; this
            // router only invokes the exported handler.
            try {
                const greet = require('./src/Commands/Bot/greet.js');
                if (greet?.handleNewContact) {
                    await greet.handleNewContact(sock, m.sender, Boolean(m.isGroup));
                }
                if (greet?.handleGreetButton && await greet.handleGreetButton(sock, m)) return;
            } catch (error) {
                console.error('[GREET HANDLER ERROR]', error.message);
            }

            try {
                const muteUser = require('./src/Commands/Group/muteuser.js');
                if (muteUser?.handleMutedMessage && await muteUser.handleMutedMessage(sock, m, Boolean(m.isGroup))) return;
            } catch (error) {
                console.error('[MUTE HANDLER ERROR]', error.message);
            }

            try {
                const muteSticker = require('./src/Commands/Group/mutesticker.js');
                if (muteSticker?.handleMutedSticker && await muteSticker.handleMutedSticker(sock, m, Boolean(m.isGroup))) return;
            } catch (error) {
                console.error('[STICKER MUTE HANDLER ERROR]', error.message);
            }

            // ── AFK MESSAGE HANDLER ─────────────────────────────────────
            try {
                const afk = require('./src/Commands/Owner/afk.js');
                if (afk?.handleAfkMessage) await afk.handleAfkMessage(sock, m, mek);
            } catch (error) {
                console.error('[AFK HANDLER ERROR]', error.message);
            }
            // ── ADVANCED GROUP SECURITY @musteqeem in still in progress─────────────────────────────
            /**try {
    const groupSecurity = require('./src/Commands/Premium Antis/groupsecurity.js');

    if (groupSecurity?.handleGroupSecurity) {
        const blocked = await groupSecurity.handleGroupSecurity(
            sock,
            m,
            mek
        );

        // If security handled the message, don't continue
        // running normal message processing on it.
        if (blocked) return;
    }
} catch (error) {
    console.error(
        '[GROUP SECURITY HANDLER]',
        error.message
    );
}**/

            // ── DYNAMIC MESSAGE HANDLERS ─────────────────────────────────
            try {
                const antitag = require('./src/Commands/Premium Antis/antitag.js');
                if (antitag?.handleAntiTag) await antitag.handleAntiTag(sock, m);
            } catch {}
            //PREMIUM ANTITAG ENDS
            try {
                const stickerCommands = require('./src/Commands/Owner/setcmd.js');
                await stickerCommands.handleStickerCommand?.(sock, m);
            } catch (error) {
                console.error('[STICKER COMMAND HANDLER ERROR]', error.message);
            }

            try {
                const emojiCommands = require('./src/Commands/Owner/setemoji.js');
                await emojiCommands.handleEmojiCommand?.(sock, m);
            } catch (error) {
                console.error('[EMOJI COMMAND HANDLER ERROR]', error.message);
            }
//antispam
            try {
                const antispam = require('./src/Commands/Premium Antis/antispam.js');
                if (antispam?.handleAntiSpam) await antispam.handleAntiSpam(sock, m);
            } catch (err) { console.error('[ANTISPAM ERROR]', err.message); }
                        //PREMIUM ANTISPAM ENDS
            
            // ── DEFENSE COMMAND HANDLERS ───────────────────────────────
            // All automatic defense logic lives in src/Commands/Defense/*.js.
            // This file only routes incoming messages to those handlers.
            try {
                const defenses = [
                    ['antilink', 'handleOldantiLink'],
                    ['antiinvite', 'handleAntiinvite'],
                    ['antiword', 'handleOldantiWord'],
                    ['antitag', 'handleOldantitag'],
                    ['antispam', 'handleOldantispam'],
                    ['antiflood', 'handleAntiflood'],
                    ['antighost', 'handleAntighost'],
                    ['anticontact', 'handleAnticontact'],
                    ['antiviewonce', 'handleAntiviewonce']
                ];

                for (const [name, handlerName] of defenses) {
                    try {
                        const defense = require(`./src/Commands/Defense/${name}.js`);
                        const handler = defense?.[handlerName];

                        if (typeof handler === 'function') {
                            await handler(sock, m, mek);
                        }
                    } catch (error) {
                        console.error(`[DEFENSE ${name.toUpperCase()} ERROR]`, error.message);
                    }
                }
            } catch (error) {
                console.error('[DEFENSE ROUTER ERROR]', error.message);
            }

            try {
                const mention = require('./src/Commands/Owner/mention.js');
                if (mention?.handleMention) await mention.handleMention(sock, m, mek);
            } catch (error) {
                console.error('[MENTION HANDLER ERROR]', error.message);
            }

            try {
                const { handleShazamReply } = require('./src/Commands/Search/shazam.js');
                const shazamReply = (txt) => sock.sendMessage(m.chat, { text: txt }, { quoted: m });
                const handled = await handleShazamReply(sock, m, shazamReply);
                if (handled) return;
            } catch {}

            try {
                const autoreact = require('./src/Commands/Owner/autoreact.js');
                if (autoreact.isEnabled() &&!m.key.fromMe && m.text) {
                    const randomEmoji = autoreact.getRandomEmoji();
                    await sock.sendMessage(m.chat, { react: { text: randomEmoji, key: m.key } }).catch(() => {});
                }
            } catch (err) { console.error('[AUTOREACT ERROR]', err.message); }
            
            try {
                const antiword = require('./src/Commands/Premium Antis/antiword.js');
                if (antiword?.handleAntiWord) await antiword.handleAntiWord(sock, m, mek);
            } catch (err) { console.error('[ANTIWORD ERROR]', err.message); } 
                        //PREMIUM ANTIWORD ENDS           
            try {
                const sscmd = require('./src/Commands/Owner/⎔.js');
                if (sscmd?.handleSSReply) await sscmd.handleSSReply(sock, m);
            } catch {}

            try {
                const ttt = require('./src/Commands/Games/ttt.js');
                if (ttt?.handleGameReply) {
                    const handled = await ttt.handleGameReply(sock, m);
                    if (handled) return;
                }
            } catch {}

            await handleMessage(sock, m, customStore);

            // okay.js is a command module and does not export the incoming
            // message hook. The hook lives in the readable Core handler.
            const { handleIncomingMessage } = require('./src/Commands/Core/❚.js');
            await handleIncomingMessage(sock, m, mek);
            
            try {
                const xadon = require('./src/Commands/AI/xadon.js');
                const msgText = (m.text || '').toLowerCase().trim();
                if (!(msgText.startsWith('.xadon') || msgText.startsWith('.ai') || msgText.startsWith('.xdn'))) {
                    if (xadon?.onMessage) await xadon.onMessage(sock, m);
                }
            } catch {}

            try {
                const antigm = require('./src/Commands/Admin/antigm.js');
                if (antigm?.handleAntiGM) await antigm.handleAntiGM(sock, m, mek);
            } catch {}

            try {
                const vvcmd = require('./src/Commands/Converter/vvcmd.js');
                if (vvcmd?.handleVVReply) await vvcmd.handleVVReply(sock, m);
            } catch {}
            
            try {
                const anti = require('./src/Commands/Premium Antis/antilink.js');
                if (anti?.handleAntiLink) await anti.handleAntiLink(sock, m);
            } catch {}            
            //PREMIUM ANTILINK ENDS
            try {
    const antivirus = require('./src/Commands/Premium Antis/antivirus.js');
    if (antivirus?.handleAntivirus) {
        await antivirus.handleAntivirus(sock, m);
    }
} catch (error) {
    console.error('[ANTIVIRUS HANDLER]', error.message);
}
//ANTIVIRUS ENDS HERE
            try {
                if (m.isGroup && m.mentionedJid?.length) {
                    const botJid = (sock.user?.id || '').replace(/:\d+@/, '@');
                    const tagged = m.mentionedJid.some(j => j.replace(/:\d+@/, '@') === botJid);
                    if (tagged) {
                        const emoji = getVar('TAG_REACT_EMOJI') || process.env.TAG_REACT_EMOJI || '';
                        if (emoji) await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {});
                    }
                }
            } catch {}

        } catch (err) {
            if (!ignoredErrors.some(e => err.message?.includes(e))) {
                console.log(chalk.red('[MSG ERROR]'), err.message);
            }
        }
    });

    sock.ev.on('messages.update', async (updates) => {
        try {
            const antidelete = require('./src/Commands/Tools/antidelete.js');
            if (antidelete?.onDelete) await antidelete.onDelete(sock, updates, customStore);
        } catch {}
        try {
            const antiedit = require('./src/Commands/Tools/antiedit.js');
            if (antiedit?.onEdit) await antiedit.onEdit(sock, updates, customStore);
        } catch {}
        try {
            const quoted = require('./library/quoted.js');
            if (quoted?.onDelete) await quoted.onDelete(sock, updates, customStore);
        } catch {}
    });

    // FIX: Guard cleanup interval
    setInterval(() => {
        const now = Date.now();
        let cleanedCount = 0;
        if (customStore?.messages) {
            for (const [key, value] of customStore.messages.entries()) {
                if (value.timestamp && (now - value.timestamp) > MESSAGE_TTL) {
                    customStore.messages.delete(key);
                    cleanedCount++;
                } else if (!value.timestamp) {
                    customStore.messages.delete(key);
                    cleanedCount++;
                }
            }
            if (cleanedCount > 0) {
                console.log(`🧹 Cleaned ${cleanedCount} expired messages from store (48h TTL)`);
            }
        }
    }, 60 * 60 * 1000);
};

setInterval(() => {
    try {
        const quoted = require('./library/quoted.js');
        if (quoted?.cleanUp) quoted.cleanUp();
    } catch {}
}, 60000);