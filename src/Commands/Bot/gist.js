const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // <-- from.env
const sessions = new Map();
const MAX_BYTES = 950 * 1024; // 950KB safe limit

module.exports = {
    name: 'gist',
    alias: ['github', 'paste', 'code'],
    desc: 'Create GitHub Gists from code snippets',
    category: 'Owner',
    usage: '.gist start [filename] |.gist code=<snippet> |.gist push [desc] |.gist cancel |.gist status',
    owner: true,

    execute: async (sock, m, { args, reply, prefix }) => {
        const jid = m.key.remoteJid;
        const userId = m.sender;
        const sessionKey = `${jid}_${userId}`;
        const sub = args[0]?.toLowerCase();

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        if (!GITHUB_TOKEN) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Missing Token\n❏ Add GITHUB_TOKEN=your_token to.env`);
        }

        // ── HELP ──
        if (!sub || sub === 'help') {
            await sock.sendMessage(jid, { react: { text: "❏", key: m.key } });
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} GIST •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Usage : Create secret GitHub gists

╭─֎ *COMMANDS*
│ ❏${prefix}gist start [file] : New session
│ ❏${prefix}gist code=<code> : Add snippet
│ ❏${prefix}gist push [desc] : Upload
│ ❏${prefix}gist status : Check session
│ ❏${prefix}gist cancel : Abort session
╰─────────────────────────╯
❏ Workflow : start -> code= -> push`
            );
        }

        // ── START SESSION ──
        if (sub === 'start') {
            if (sessions.has(sessionKey)) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Session Active\n❏ Use.gist push or.gist cancel first`);
            }
            const filename = args[1] || `snippet_${Date.now()}.txt`;
            sessions.set(sessionKey, { filename, code: [], startedAt: Date.now(), size: 0 });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(
                `✓ ֎ Gist Session Started\n❏ File : ${filename}\n❏ Next :.gist code=<your code>`
            );
        }

        // ── ADD CODE ──
        if (args[0]?.startsWith('code=')) {
            const session = sessions.get(sessionKey);
            if (!session) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ No Session\n❏ Run.gist start first`);
            }

            const snippet = args.join(' ').replace(/^code=/i, '').trim();
            if (!snippet) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Empty Code\n❏ Usage :.gist code=<your code>`);
            }

            const newSize = session.size + Buffer.byteLength(snippet, 'utf8');
            if (newSize > MAX_BYTES) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Size Limit Exceeded\n❏ Limit : 950KB\n❏ Current : ${(newSize/1024).toFixed(1)}KB`);
            }

            session.code.push(snippet);
            session.size = newSize;
            await sock.sendMessage(jid, { react: { text: "➕", key: m.key } });
            return reply(
                `➕ ֎ Snippet Added\n❏ Total : ${session.code.length} snippets\n❏ Size : ${(newSize/1024).toFixed(1)}KB`
            );
        }

        // ── STATUS ──
        if (sub === 'status') {
            const session = sessions.get(sessionKey);
            if (!session) {
                await sock.sendMessage(jid, { react: { text: "❏", key: m.key } });
                return reply(`❏ ֎ No Active Session`);
            }
            await sock.sendMessage(jid, { react: { text: "❏", key: m.key } });
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • GIST SESSION •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ File : ${session.filename}
❏ Snippets : ${session.code.length}
❏ Size : ${(session.size/1024).toFixed(1)}KB
❏ Active : ${Math.floor((Date.now() - session.startedAt)/60000)} min`
            );
        }

        // ── CANCEL ──
        if (sub === 'cancel') {
            if (!sessions.has(sessionKey)) {
                await sock.sendMessage(jid, { react: { text: "❏", key: m.key } });
                return reply(`❏ ֎ No Session To Cancel`);
            }
            sessions.delete(sessionKey);
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(`✓ ֎ Session Cancelled\n❏ All unsaved code cleared`);
        }

        // ── PUSH ──
        if (sub === 'push') {
            const session = sessions.get(sessionKey);
            if (!session) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ No Session\n❏ Run.gist start first`);
            }
            if (!session.code.length) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Nothing To Push\n❏ Add code with.gist code= first`);
            }

            await sock.sendMessage(jid, { react: { text: '🚀', key: m.key } });
            await sock.sendPresenceUpdate('composing', jid);

            const fullCode = session.code.join('\n\n// ── Next Snippet ──\n\n');
            const description = args.slice(1).join(' ') || `${BOT_NAME} - ${session.filename}`;
            const filename = session.filename.includes('.')? session.filename : `${session.filename}.txt`;

            try {
                const { data } = await axios.post('https://api.github.com/gists', {
                    description,
                    public: false,
                    files: { [filename]: { content: fullCode } }
                }, {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': `${BOT_NAME}-Bot`
                    },
                    timeout: 20000
                });

                sessions.delete(sessionKey);
                await sock.sendPresenceUpdate('available', jid);
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

                return reply(
                    `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • GIST CREATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
✓ Status : Uploaded Successfully
❏ File : ${filename}
❏ Desc : ${description}
❏ URL : ${data.html_url}
❏ Raw : ${data.files[filename].raw_url}`
                );
            } catch (err) {
                await sock.sendPresenceUpdate('available', jid);
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                console.error('[GIST PUSH ERROR]', err.response?.data || err.message);
                return reply(`✘ ֎ Upload Failed\n❏ Error : ${err.response?.data?.message || err.message}`);
            }
        }

        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        return reply(`✘ ֎ Unknown subcommand\n❏ Use.gist help`);
    }
};