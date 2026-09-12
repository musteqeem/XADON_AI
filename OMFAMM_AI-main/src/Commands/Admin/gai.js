const { getGroqClient, rotateKey } = require('../Core/+');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

module.exports = {
    name: 'groupaictrl',
    alias: ['gai', 'aictrl'],
    desc: `${BOT_NAME} AI-assisted group administration`,
    category: 'Admin',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    usage: '.gai lock this group | .gai kick the mentioned user | .gai group info',
    reactions: { start: '🧠', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply, isAdmin }) => {
        if (!isAdmin) return reply('❌ Group admins only.');

        const input = args.join(' ').trim();
        if (!input) return reply(`Usage: .gai <request>`);

        const meta = await sock.groupMetadata(m.chat).catch(() => null);
        if (!meta) return reply('❌ Group metadata is unavailable.');

        const target = normalizeJid(m.mentionedJid?.[0] || m.quoted?.sender || '');
        const plan = await askPlanner(input, meta.subject || 'WhatsApp group');

        if (!plan) return reply('❌ I could not understand that group request.');

        try {
            const result = await executeAction(sock, m, plan.action, target);
            return reply(`🧠 ${plan.say || result}`, plan.actionTarget ? { mentions: [plan.actionTarget] } : {});
        } catch (error) {
            console.error('[GROUP AI ACTION ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};

async function askPlanner(input, groupName) {
    const system = `You are a WhatsApp group administration planner for "${groupName}".
Return JSON only: {"action":"...","say":"..."}.
Allowed actions: lock, unlock, ginfo, grouplink, setname, setdesc, kick, promote, demote.
Never invent a target JID. For kick/promote/demote, the caller must provide a mentioned or replied user.
For ordinary conversation, use action "none".`;

    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const client = getGroqClient();
            const response = await client.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: input }
                ],
                temperature: 0.1,
                max_tokens: 250
            });

            const raw = response.choices?.[0]?.message?.content || '';
            const json = raw.match(/\{[\s\S]*\}/)?.[0];
            if (!json) throw new Error('AI returned invalid JSON.');

            const plan = JSON.parse(json);
            if (!['lock', 'unlock', 'ginfo', 'grouplink', 'setname', 'setdesc', 'kick', 'promote', 'demote', 'none'].includes(plan.action)) {
                throw new Error('AI returned an unsupported action.');
            }
            return plan;
        } catch (error) {
            lastError = error;
            if (attempt === 0) {
                try { rotateKey(); } catch {}
            }
        }
    }

    throw new Error(lastError?.message || 'AI planner unavailable. Configure GROQ_API_KEY.');
}

async function executeAction(sock, m, action, target) {
    switch (action) {
        case 'none':
            return 'Tell me what group action you want me to perform.';
        case 'lock':
            await sock.groupSettingUpdate(m.chat, 'announcement');
            return 'Group locked: only admins can send messages.';
        case 'unlock':
            await sock.groupSettingUpdate(m.chat, 'not_announcement');
            return 'Group unlocked: members can send messages.';
        case 'ginfo': {
            const meta = await sock.groupMetadata(m.chat);
            return `Group: ${meta.subject}\nMembers: ${meta.participants?.length || 0}`;
        }
        case 'grouplink': {
            const code = await sock.groupInviteCode(m.chat);
            return `https://chat.whatsapp.com/${code}`;
        }
        case 'setname':
            throw new Error('Use .setsubject for an explicit group-name change.');
        case 'setdesc':
            throw new Error('Use .setdesc for an explicit group-description change.');
        case 'kick':
        case 'promote':
        case 'demote':
            if (!target) throw new Error(`Mention or reply to a user for ${action}.`);
            await sock.groupParticipantsUpdate(m.chat, [target], action === 'kick' ? 'remove' : action);
            return `${action === 'kick' ? 'Removed' : action === 'promote' ? 'Promoted' : 'Demoted'} @${target.split('@')[0]}.`;
        default:
            throw new Error('Unsupported group action.');
    }
}

function normalizeJid(jid) {
    return String(jid || '').replace(/:\d+(?=@)/, '').toLowerCase();
}
