const chatbot = require('../Core/❚.js');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'chatbot',
    alias: ['cb'],
    category: 'AI',
    desc: 'Control AI chatbot: on/off, mode, train, personality, global/private, image generation',
    usage: '.chatbot <command>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const subcmd = args[0]?.toLowerCase();
        const mode = args[1]?.toLowerCase();
        const text = args.slice(1).join(' ').trim();

        // GLOBAL ON/OFF
        if (subcmd === 'on' && mode === 'all') {
            chatbot.setGlobalPrivateEnabled(true);
            return reply(`✓ ֎ Global chatbot ENABLED for all DMs`);
        }
        if (subcmd === 'off' && mode === 'all') {
            chatbot.setGlobalPrivateEnabled(false);
            return reply(`✗ ֎ Global chatbot DISABLED`);
        }

        // CHAT ON/OFF
        if (subcmd === 'on' &&!mode) {
            chatbot.setEnabled(jid, true);
            chatbot.setMode(jid, 'all');
            return reply(`✓ ֎ Chatbot ON for this chat`);
        }
        if (subcmd === 'off' &&!mode) {
            chatbot.setEnabled(jid, false);
            return reply(`✗ ֎ Chatbot OFF for this chat`);
        }

        // MODE
        if (subcmd === 'mode') {
            if (!chatbot.isEnabled(jid) &&!chatbot.isGlobalPrivateEnabled()) {
                return reply(`_*ⓘ Chatbot is off. Use.chatbot on first.*_`);
            }
            if (mode === 'all') {
                chatbot.setMode(jid, 'all');
                return reply(`✐ ֎ Mode ALL - Bot replies to all messages`);
            }
            if (mode === 'tag') {
                chatbot.setMode(jid, 'tag');
                return reply(`⎔ ֎ Mode TAG - Bot replies when tagged`);
            }
            return reply(`_*ⓘ Usage:.chatbot mode all or.chatbot mode tag*_`);
        }

        // TRAINING
        if (subcmd === 'train') {
            if (mode === 'chat') {
                const trainText = args.slice(2).join(' ').trim();
                if (!trainText) {
                    const chatTrain = chatbot.getTraining(jid);
                    return reply(chatTrain? `⎙ Current chat training:\n"${chatTrain}"\n\nUse.chatbot train chat <text> to replace.` : `_*ಠ_ಠ No chat training set. Use.chatbot train chat <text>*_`);
                }
                chatbot.setTraining(jid, trainText, false);
                return reply(`☞ Training saved for this chat:\n"${trainText.slice(0,96)}${trainText.length > 96? '...' : ''}"`);
            } else {
                const trainText = text;
                if (!trainText) {
                    const globalTrain = chatbot.getTrainingGlobal();
                    return reply(globalTrain? `⎙ Current global training:\n"${globalTrain}"\n\nUse.chatbot train <text> to replace.` : `_*ಠ_ಠ No global training set. Use.chatbot train <text>*_`);
                }
                chatbot.setTraining(jid, trainText, true);
                return reply(`☞ Global training saved:\n"${trainText.slice(0,96)}${trainText.length > 96? '...' : ''}"`);
            }
        }

        // PERSONALITY
        if (subcmd === 'personality') {
            if (mode === 'chat') {
                const persText = args.slice(2).join(' ').trim();
                if (!persText) {
                    const chatPers = chatbot.getPersonality(jid);
                    return reply(chatPers? `ಥ Chat personality:\n"${chatPers}"` : `_*𓅓 No chat personality set. Use.chatbot personality chat <text>*_`);
                }
                chatbot.setPersonality(persText, jid);
                return reply(`⚉ Chat personality set:\n"${persText.slice(0,96)}${persText.length > 96? '...' : ''}"`);
            } else {
                const persText = text;
                if (!persText) {
                    const globalPers = chatbot.getDefaultPersonality();
                    return reply(globalPers? `ಥ Global personality:\n"${globalPers}"` : `_*𓅓 No global personality set. Use.chatbot personality <text>*_`);
                }
                chatbot.setPersonality(persText);
                return reply(`⚉ Global personality set:\n"${persText.slice(0,96)}${persText.length > 96? '...' : ''}"`);
            }
        }

        // CLEAR MEMORY
        if (subcmd === 'clear') {
            chatbot.clearHistory(jid);
            return reply(`_*✦ memory wiped*_`);
        }

        // IMAGE GENERATION
        if (subcmd === 'img' || subcmd === 'image') {
            const style = mode || 'realistic';
            const imgPrompt = args.slice(2).join(' ').trim();
            if (!imgPrompt) return reply(`_*✘ Usage:.chatbot img [horror|realistic|scifi] <prompt>*_`);
            try {
                const imgUrl = await chatbot.generateImage(style, imgPrompt);
                await sock.sendMessage(jid, {
                    image: { url: imgUrl },
                    caption: `🎨 *AI Generated (${style})*\n📝 ${imgPrompt}`
                }, { quoted: m });
                return;
            } catch {
                return reply(`_*𓄄 Failed to generate image*_`);
            }
        }

        // STATUS
        const isEnabled = chatbot.isEnabled(jid);
        const isGlobal = chatbot.isGlobalPrivateEnabled();
        const chatMode = chatbot.getMode(jid);
        const globalMode = isGlobal &&!m.isGroup;
        const enabled = globalMode || isEnabled;
        const memory = chatbot.getHistory(jid)?.length || 0;
        const globalTrain = chatbot.getTrainingGlobal();
        const chatTrain = chatbot.getTraining(jid);
        const globalPers = chatbot.getDefaultPersonality();
        const chatPers = chatbot.getPersonality(jid);

        let status = `ಠ_ಠ *CHATBOT STATUS*\n\n`;
        status += `❏◦ This chat: ${enabled? 'ON' : 'OFF'}\n`;
        status += `❏◦ Mode: *${chatMode.toUpperCase()}*\n`;
        status += `❏◦ Global private: ${isGlobal? 'ENABLED' : 'DISABLED'}\n`;
        status += `❏◦ Memory: ${memory} messages\n`;

        if (globalTrain) status += `❏◦ Global training: ✓ set\n`;
        if (chatTrain) status += `❏◦ Chat training: ✓ set (overrides global)\n`;
        if (globalPers && globalPers!== chatbot.getDefaultPersonality()) status += `❏◦ Global personality: ✓ set\n`;
        if (chatPers) status += `❏◦ Chat personality: ✓ set (overrides global)\n`;

        status += `\n*Commands:*\n`;
        status += `.chatbot on / off (this chat)\n`;
        status += `.chatbot on all / off all (global private)\n`;
        status += `.chatbot mode all / tag\n`;
        status += `.chatbot train <text> (global)\n`;
        status += `.chatbot train chat <text> (this chat only)\n`;
        status += `.chatbot personality <text> (global)\n`;
        status += `.chatbot personality chat <text> (this chat only)\n`;
        status += `.chatbot clear\n`;
        status += `.chatbot img [horror|realistic|scifi] <prompt> (quick generate)\n`;
        status += `\n*Auto image detect:* horror, realistic, sci-fi keywords trigger generation.`;

        reply(status);
    }
};