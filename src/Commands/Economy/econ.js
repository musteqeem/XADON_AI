const axios = require('axios');
const config = require('../../../settings/config');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const ECO_API = process.env.ECO_API_URL || config.api?.economy || 'https://econ.crysnovax.link';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function eco(endpoint, phone, body = {}) {
    const method = endpoint.startsWith('GET') ? 'get' : 'post';
    const url = ECO_API + endpoint.replace(/^(GET|POST) /, '');
    const options = { headers: { 'X-User-Phone': phone }, timeout: 15000 };
    try {
        if (method === 'post') {
            const res = await axios.post(url, body, options);
            return res;
        }
        return await axios.get(url, options);
    } catch (e) {
        throw e;
    }
}

async function sendTable(sock, chat, header, title, rows, footer) {
    await sock.sendMessage(chat, {
        text: `${header}\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n*֎ • ${title}*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n` +
              rows.map(r => `❏ ${r[0]} : ${r[1]}`).join('\n') +
              `\n╰─────────────────────────╯\n${footer || ''}\n💡 Powered by ${BOT_NAME}`
    });
}

function myPhone(m) {
    return (m.sender || '').split('@')[0].replace(/[^0-9]/g, '');
}

// Check if someone did something TO this bot's owner
async function checkNotifications(sock) {
    try {
        const botNumber = (sock.user?.id || '').split(':')[0].replace(/[^0-9]/g, '');
        if (!botNumber) return;
        const res = await eco('GET /check-notifications', botNumber);
        const notifs = res.data.notifications || [];
        for (const notif of notifs) {
            await sleep(400);
            const botJid = botNumber + '@s.whatsapp.net';
            await sock.sendMessage(botJid, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ECONOMY ALERT!*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *NOTIFICATION*\n│ ❏ ${notif.message}\n╰─────────────────────────╯\n💡 Use .alerts to view all.\n💡 Powered by ${BOT_NAME}`
            }).catch(() => {});
        }
    } catch (e) {}
}

const cmds = [];

// ==================== ACTIVATE ====================
cmds.push({
    name: 'economy', alias: ['ecoactivate'], category: 'Economy',
    desc: 'Activate your economy account', usage: `.economy activate <phone>`,
    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase();
        if (sub !== 'activate') {
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ECONOMY ACTIVATION*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HELP*\n│ ❏ Usage : ${prefix}economy activate <phone>\n│ ❏ Example : ${prefix}economy activate 2347079056039\n│ ❏ Note : Required before using commands\n╰─────────────────────────╯`
            );
        }
        const phone = (args[1] || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 7) return reply(`*✗ Phone number required*`);
        await sock.sendMessage(m.chat, { react: { text: '💰', key: m.key } });
        await sleep(300);
        try {
            await eco('POST /activate', phone);
            await sendTable(sock, m.chat,
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ECONOMY ACTIVATED!*`,
                'Welcome',
                [
                    ['📱 Phone', phone],
                    ['🪙 Starting Balance', '1,000 coins'],
                    ['🏦 Bank', '0 coins'],
                    ['💡 Commands', '.balance | .work | .fish | .rob | .pay']
                ],
                '💡 Use .help economy for all commands'
            );
            await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
        } catch (err) {
            await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            reply(`*✗ ${err.response?.data?.error || 'Activation failed'}*`);
        }
    }
});

// ==================== BALANCE ====================
cmds.push({
    name: 'balance', alias: ['bal', 'wallet'], category: 'Economy',
    desc: 'Check your wallet and bank balance', usage: `.balance`,
    reactions: { start: '💰', success: '💡', error: '✗' },
    execute: async (sock, m, { reply }) => {
        const phone = myPhone(m);
        await sock.sendMessage(m.chat, { react: { text: '💰', key: m.key } });
        await sleep(300);
        try {
            const res = await eco('GET /balance', phone);
            const { balance, bank, total, level, xp } = res.data;
            await sendTable(sock, m.chat,
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *${phone}'s WALLET*`,
                'Balance',
                [
                    ['💰 Wallet', `${balance.toLocaleString()} coins`],
                    ['🏦 Bank', `${bank.toLocaleString()} coins`],
                    ['💎 Total', `${(total || balance + bank).toLocaleString()} coins`],
                    ['⭐ Level', `Level ${level}`],
                    ['✨ XP', `${xp || 0} XP`]
                ],
                '🔒 Bank money is SAFE from robbery! | .deposit | .withdraw'
            );
            await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
        } catch (err) {
            await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            if (err.response?.status === 404 || err.response?.data?.error?.includes('not')) {
                return reply(`*✗ Economy not activated! Use .economy activate <phone>*`);
            }
            reply(`*✗ ${err.response?.data?.error || 'Failed to fetch balance'}*`);
        }
    }
});

// ==================== DEPOSIT ====================
cmds.push({
    name: 'deposit', alias: ['dep'], category: 'Economy',
    desc: 'Deposit money into your bank', usage: `.deposit <amount>`,
    reactions: { start: '🏦', success: '✨', error: '✗' },
    execute: async (sock, m, { args, reply }) => {
        const phone = myPhone(m);
        const amount = parseInt(args[0]);
        if (!amount || amount <= 0) return reply(`*✗ .deposit <amount>*`);
        await sock.sendMessage(m.chat, { react: { text: '🏦', key: m.key } });
        await sleep(300);
        try {
            const res = await eco('POST /deposit', phone, { amount });
            await sendTable(sock, m.chat,
                '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *DEPOSIT SUCCESSFUL*',
                'Funds Secured',
                [
                    ['💰 Amount', `${amount.toLocaleString()} coins`],
                    ['👝 Wallet', `${res.data.balance.toLocaleString()} coins`],
                    ['🏦 Bank', `${res.data.bank.toLocaleString()} coins`]
                ],
                '🔒 Money in bank CANNOT be stolen'
            );
            await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
        } catch (err) {
            await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            reply(`*✗ ${err.response?.data?.error || 'Deposit failed'}*`);
        }
    }
});

// ==================== WITHDRAW ====================
cmds.push({
    name: 'withdraw', alias: ['with', 'wdraw'], category: 'Economy',
    desc: 'Withdraw money from your bank', usage: `.withdraw <amount>`,
    reactions: { start: '🏦', success: '✨', error: '✗' },
    execute: async (sock, m, { args, reply }) => {
        const phone = myPhone(m);
        const amount = parseInt(args[0]);
        if (!amount || amount <= 0) return reply(`*✗ .withdraw <amount>*`);
        await sock.sendMessage(m.chat, { react: { text: '🏦', key: m.key } });
        await sleep(300);
        try {
            const res = await eco('POST /withdraw', phone, { amount });
            await sendTable(sock, m.chat,
                '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *WITHDRAWAL SUCCESSFUL*',
                'Funds Released',
                [
                    ['💰 Amount', `${amount.toLocaleString()} coins`],
                    ['👛 Wallet', `${res.data.balance.toLocaleString()} coins`],
                    ['🏦 Bank', `${res.data.bank.toLocaleString()} coins`]
                ],
                '💡 Keep some in the bank for safety'
            );
            await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
        } catch (err) {
            await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            reply(`*✗ ${err.response?.data?.error || 'Withdrawal failed'}*`);
        }
    }
});

// ==================== ROB ====================
cmds.push({
    name: 'rob', alias: ['extort', 'mug'], category: 'Economy',
    desc: 'Attempt to rob someone', usage: `.rob <phone>`,
    reactions: { start: '😈', success: '✨', error: '✗' },
    execute: async (sock, m, { args, reply }) => {
        await checkNotifications(sock);
        const robberPhone = myPhone(m);
        const targetPhone = (args[0] || '').replace(/[^0-9]/g, '');
        if (!targetPhone) return reply(`*✗ .rob <phone>*`);
        if (targetPhone === robberPhone) return reply(`*✗ Cannot rob yourself*`);
        await sock.sendMessage(m.chat, { react: { text: '😈', key: m.key } });
        await sleep(500);
        try {
            const res = await eco('POST /rob', robberPhone, { target: targetPhone });
            const d = res.data;
            if (d.success) {
                await sendTable(sock, m.chat,
                    '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ROBBERY SUCCESSFUL!*',
                    'Stolen',
                    [
                        ['🪙 Stolen', `${d.stolen.toLocaleString()} coins`],
                        ['👤 From', targetPhone],
                        ['💰 Your Balance', `${d.balance.toLocaleString()} coins`]
                    ],
                    '💡 Victim will be notified'
                );
                await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
            } else {
                await sendTable(sock, m.chat,
                    '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ROBBERY FAILED!*',
                    'Caught',
                    [
                        ['📝 Result', d.message],
                        ['💰 Your Balance', `${d.balance?.toLocaleString() || '?'} coins`]
                    ],
                    '🔒 Target\'s bank money is protected'
                );
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            }
        } catch (err) {
            await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            reply(`*✗ ${err.response?.data?.error || 'Robbery failed'}*`);
        }
    }
});

// ==================== WORK ====================
cmds.push({
    name: 'work', alias: ['job', 'earn'], category: 'Economy',
    desc: 'Work a random job to earn coins and XP', usage: `.work`,
    reactions: { start: '💼', success: '✨', error: '✗' },
    execute: async (sock, m, { reply }) => {
        const phone = myPhone(m);
        await sock.sendMessage(m.chat, { react: { text: '💼', key: m.key } });
        await sleep(300);
        try {
            const res = await eco('POST /work', phone);
            const d = res.data;
            const rows = [
                ['👔 Job', d.job || 'Worker'],
                ['🪙 Earned', `${d.earnings.toLocaleString()} coins`],
                ['✨ XP', `+${d.xpGain || '?'} XP`],
                ['⭐ Level', `Level ${d.level}`],
                ['💰 Balance', `${d.newBalance.toLocaleString()} coins`]
            ];
            if (d.levelUp) rows.push(['🎉 LEVEL UP!', `Now Level ${d.level}`]);
            await sendTable(sock, m.chat,
                '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *WORK COMPLETE!*',
                'Earnings',
                rows,
                d.levelUp ? '🎉 LEVEL UP! Keep grinding' : '💡 Work more to level up. 2 min cooldown'
            );
            await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
        } catch (err) {
            await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
            reply(`*✗ ${err.response?.data?.error || 'Work failed'}*`);
        }
    }
});

// ==================== ECOPROFILE ====================
cmds.push({
    name: 'ecoprofile', alias: ['eprofile', 'estats'], category: 'Economy',
    desc: 'View your full economy profile', usage: `.ecoprofile`,
    execute: async (sock, m, { reply }) => {
        const phone = myPhone(m);
        await sleep(300);
        try {
            const res = await eco('GET /profile', phone);
            const d = res.data;
            await sendTable(sock, m.chat,
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *${phone}'s PROFILE*`,
                'Economy Stats',
                [
                    ['💰 Wallet', `${d.balance.toLocaleString()} coins`],
                    ['🏦 Bank', `${d.bank.toLocaleString()} coins`],
                    ['💎 Total', `${d.total.toLocaleString()} coins`],
                    ['⭐ Level', `Level ${d.level}`],
                    ['✨ XP', `\( {d.xp}/ \){d.xpNeeded} XP`],
                    ['💪 Strength', d.stats?.strength || 0],
                    ['🍀 Luck', d.stats?.luck || 0],
                    ['🧠 Intelligence', d.stats?.intelligence || 0],
                    ['🎯 Faction', d.faction || 'None'],
                    ['🎒 Items', `${d.inventory || 0} items`],
                    ['📈 Investments', `${d.investments || 0} active`],
                    ['💳 Loan', d.loan ? `${d.loan.toLocaleString()} coins` : 'None'],
                    ['🔥 Daily Streak', `${d.dailyStreak || 0} days`],
                    ['🔔 Alerts', `${d.alerts || 0} unread`]
                ],
                '💡 Use .alerts to check notifications'
            );
        } catch (err) {
            reply(`*✗ ${err.response?.data?.error || 'Failed'}*`);
        }
    }
});

// ==================== ALERTS ====================
cmds.push({
    name: 'alerts', alias: ['notifications', 'notifs'], category: 'Economy',
    desc: 'View your transaction alerts', usage: `.alerts`,
    execute: async (sock, m, { reply }) => {
        const phone = myPhone(m);
        await sleep(300);
        try {
            const res = await eco('GET /alerts', phone);
            const alerts = res.data.alerts || [];
            if (!alerts.length) return reply(`*🔔 No alerts! You're all clear*`);
            const typeIcons = {
                'payment_sent': '💸', 'payment_received': '📥',
                'robbery_success': '😈', 'robbery_victim': '😱', 'robbery_failed': '👮',
                'attack_victory': '⚔️', 'attack_defeat': '💀', 'attack_failed': '😵'
            };
            const rows = [];
            alerts.slice(-10).reverse().forEach(a => {
                const time = new Date(a.time).toLocaleString();
                const icon = typeIcons[a.type] || '📢';
                rows.push([time, `${icon} ${a.message}`]);
            });
            await sendTable(sock, m.chat,
                '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *TRANSACTION HISTORY*',
                `${res.data.unreadCount || alerts.length} entries`,
                rows,
                '💡 Both parties get alerts for every transaction'
            );
        } catch (err) {
            reply(`*✗ ${err.response?.data?.error || 'Failed'}*`);
        }
    }
});

// ==================== LEADERBOARD ====================
cmds.push({
    name: 'leaderboard', alias: ['lb', 'top', 'richlist'], category: 'Economy',
    desc: 'View the richest players', usage: `.leaderboard`,
    execute: async (sock, m, { reply }) => {
        await sleep(300);
        try {
            const res = await eco('GET /admin/stats', '0');
            const users = (res.data.users || []).sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank)).slice(0, 10);
            if (!users.length) return reply(`*📊 No users yet*`);
            const rows = [];
            users.forEach((u, i) => {
                rows.push([`#${i + 1} \( {u.phone}`, ` \){(u.balance + u.bank).toLocaleString()} coins`]);
            });
            await sendTable(sock, m.chat,
                '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *RICHEST PLAYERS*',
                'Top 10',
                rows,
                '💡 Work hard to climb the ranks'
            );
        } catch (err) {
            reply(`*✗ Failed to load leaderboard*`);
        }
    }
});

// ==================== QUICK COMMANDS ====================
const quick = [
    { n: 'fish', a: ['fishing'], u: '.fish', d: 'Go fishing',
        f: async (s, m, p) => {
            const r = await eco('POST /fish', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FISHING*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || `🎣 * \){r.data.item}*`}\n│ ❏ +${r.data.reward.toLocaleString()} coins\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'mine', a: ['mining'], u: '.mine', d: 'Mine for ores',
        f: async (s, m, p) => {
            const r = await eco('POST /mine', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *MINING*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || `⛏️ * \){r.data.ore}*`}\n│ ❏ +${r.data.reward.toLocaleString()} coins\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'hunt', a: ['hunting'], u: '.hunt', d: 'Hunt animals',
        f: async (s, m, p) => {
            const r = await eco('POST /hunt', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *HUNTING*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || `🏹 * \){r.data.animal}*`}\n│ ❏ +${r.data.reward.toLocaleString()} coins\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'beg', a: ['plead'], u: '.beg', d: 'Beg for coins',
        f: async (s, m, p) => {
            const r = await eco('POST /beg', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *BEGGING*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || `🥺 Someone gave you * \){r.data.reward} coins*`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'crime', u: '.crime', d: 'Commit a crime',
        f: async (s, m, p) => {
            const r = await eco('POST /crime', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *CRIME*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || (r.data.success ? `🔫 Success! + \){r.data.reward} coins` : `🚔 Busted!`)}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'drugs', u: '.drugs', d: 'Deal drugs',
        f: async (s, m, p) => {
            const r = await eco('POST /drugs', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *DEAL*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || (r.data.success ? `💊 Profit! + \){r.data.profit} coins` : `🚨 Busted!`)}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'gamble', u: '.gamble <amount>', d: 'Gamble coins',
        f: async (s, m, p, a) => {
            const amt = parseInt(a[0]);
            if (!amt || amt <= 0) return s.sendMessage(m.chat, { text: `*✗ .gamble <amount>*` });
            const r = await eco('POST /gamble', p, { amount: amt });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *GAMBLING*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ ${r.data.message || (r.data.win ? `🎰 Won ${r.data.won} coins` : `🎰 Lost ${r.data.lost} coins`)}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'invest', u: '.invest <symbol> <amount>', d: 'Invest in stocks',
        f: async (s, m, p, a) => {
            const symbol = a[0]?.toUpperCase();
            const amt = parseInt(a[1]);
            if (!symbol || !amt) return s.sendMessage(m.chat, { text: `*✗ .invest <CRYP|TECH|OIL|GOLD|FOOD> <amount>*` });
            const r = await eco('POST /invest', p, { symbol, amount: amt });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *INVESTMENT*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ ${r.data.message || `📈 Invested ${amt} in ${symbol}`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'sellinvest', a: ['sellstocks', 'cashout'], u: '.sellinvest', d: 'Sell stocks',
        f: async (s, m, p) => {
            const r = await eco('POST /sell-investments', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *SELL INVESTMENTS*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ ${r.data.message || `📊 Sold! Return: ${r.data.totalReturn.toLocaleString()} coins`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'daily', u: '.daily', d: 'Daily reward',
        f: async (s, m, p) => {
            const r = await eco('POST /daily', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *DAILY REWARD*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || `📅 Daily: + \){r.data.reward.toLocaleString()} coins`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'weekly', u: '.weekly', d: 'Weekly bonus',
        f: async (s, m, p) => {
            const r = await eco('POST /weekly', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *WEEKLY BONUS*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || `🎁 Weekly: + \){r.data.reward.toLocaleString()} coins`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'attack', u: '.attack <phone>', d: 'Attack player',
        f: async (s, m, p, a) => {
            await checkNotifications(s);
            const t = (a[0] || '').replace(/[^0-9]/g, '');
            if (!t) return s.sendMessage(m.chat, { text: `*✗ .attack <phone>*` });
            const r = await eco('POST /attack', p, { target: t });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ATTACK*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ \( {r.data.message || (r.data.win ? `⚔️ Victory! + \){r.data.stolen.toLocaleString()} coins` : `💀 Defeat!`)}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'gift', u: '.gift <phone> <amount>', d: 'Gift coins',
        f: async (s, m, p, a) => {
            await checkNotifications(s);
            const t = (a[0] || '').replace(/[^0-9]/g, '');
            const amt = parseInt(a[1]);
            if (!t || !amt) return s.sendMessage(m.chat, { text: `*✗ .gift <phone> <amount>*` });
            await eco('POST /gift', p, { to: t, amount: amt });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *GIFT SENT*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ 🎁 Gift sent! Recipient will be notified\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'pay', a: ['send', 'transfer'], u: '.pay <phone> <amount>', d: 'Pay / transfer coins',
        f: async (s, m, p, a) => {
            await checkNotifications(s);
            const t = (a[0] || '').replace(/[^0-9]/g, '');
            const amt = parseInt(a[1]);
            if (!t || !amt) return s.sendMessage(m.chat, { text: `*✗ .pay <phone> <amount>*` });
            await eco('POST /gift', p, { to: t, amount: amt });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PAYMENT SENT*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ 💸 Payment of ${amt.toLocaleString()} coins sent!\n│ ❏ Recipient will be notified\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'loan', u: '.loan <amount>', d: 'Take loan',
        f: async (s, m, p, a) => {
            const amt = parseInt(a[0]);
            if (!amt) return s.sendMessage(m.chat, { text: `*✗ .loan <amount>*` });
            const r = await eco('POST /loan', p, { amount: amt });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *LOAN*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ ${r.data.message || `💳 Loan: ${r.data.loanAmount.toLocaleString()} coins`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'repayloan', a: ['payloan'], u: '.repayloan', d: 'Repay loan',
        f: async (s, m, p) => {
            const r = await eco('POST /repay-loan', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *REPAY LOAN*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ ${r.data.message || `✅ Loan repaid`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'shop', u: '.shop', d: 'View shop',
        f: async (s, m) => {
            const r = await eco('GET /shop', '0');
            const rows = [];
            r.data.shop.forEach(i => rows.push([i.name, `${i.price.toLocaleString()} coins`]));
            await sendTable(s, m.chat, '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *ECONOMY SHOP*', 'Items', rows, '.buy <item> | Stocks: CRYP TECH OIL GOLD FOOD');
        }
    },
    { n: 'buy', u: '.buy <item>', d: 'Buy item',
        f: async (s, m, p, a) => {
            const item = a.join('_').replace(/\s/g, '_');
            if (!item) return s.sendMessage(m.chat, { text: `*✗ .buy pickaxe*` });
            const r = await eco('POST /buy', p, { item });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *PURCHASE*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ 🛒 ${r.data.message || 'Purchased'}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'sell', u: '.sell <item>', d: 'Sell item',
        f: async (s, m, p, a) => {
            const item = a.join('_').replace(/\s/g, '_');
            if (!item) return s.sendMessage(m.chat, { text: `*✗ .sell pickaxe*` });
            const r = await eco('POST /sell', p, { item });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *SELL*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ 💸 ${r.data.message || 'Sold'}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'inventory', a: ['inv'], u: '.inventory', d: 'View backpack',
        f: async (s, m, p) => {
            const r = await eco('GET /inventory', p);
            const items = r.data.inventory || [];
            if (!items.length) return s.sendMessage(m.chat, { text: `*🎒 Inventory is empty*` });
            const rows = [];
            items.forEach(i => rows.push([i.name, i.quantity]));
            await sendTable(s, m.chat, '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *INVENTORY*', 'Items', rows, '.sell <item>');
        }
    },
    { n: 'training', u: '.training <stat>', d: 'Train stats',
        f: async (s, m, p, a) => {
            const stat = a[0];
            if (!stat) return s.sendMessage(m.chat, { text: `*✗ .training strength|luck|intelligence*` });
            const r = await eco('POST /training', p, { stat });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *TRAINING*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ 💪 ${r.data.message}\n│ ❏ Str: ${r.data.stats?.strength || 0} | Luck: ${r.data.stats?.luck || 0} | Int: ${r.data.stats?.intelligence || 0}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'levelup', u: '.levelup', d: 'Level up',
        f: async (s, m, p) => {
            const r = await eco('POST /levelup', p);
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *LEVEL UP*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ ${r.data.message || `⭐ Level ${r.data.level}`}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'travel', u: '.travel <dest>', d: 'Travel',
        f: async (s, m, p, a) => {
            const dest = a[0];
            if (!dest) return s.sendMessage(m.chat, { text: `*✗ .travel city|forest|ocean|mountains*` });
            const r = await eco('POST /travel', p, { destination: dest });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *TRAVEL*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ ✈️ ${r.data.message || 'Travelled!'}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    },
    { n: 'faction', u: '.faction <join/leave> <name>', d: 'Join faction',
        f: async (s, m, p, a) => {
            const action = a[0], faction = a[1];
            if (!action) return s.sendMessage(m.chat, { text: `*✗ .faction join|leave <thieves|hunters|miners>*` });
            const r = await eco('POST /faction', p, { action, faction });
            await s.sendMessage(m.chat, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *FACTION*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *RESULT*\n│ ❏ 🎯 ${r.data.message || r.data.faction || 'None'}\n╰─────────────────────────╯\n💡 Powered by ${BOT_NAME}` });
        }
    }
];

quick.forEach(q => {
    cmds.push({
        name: q.n, alias: q.a || [], category: 'Economy', desc: q.d, usage: q.u,
        execute: async (sock, m, { args, reply }) => {
            const phone = myPhone(m);
            try {
                await q.f(sock, m, phone, args);
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
                reply(`*✗ ${err.response?.data?.error || 'Failed'}*`);
            }
        }
    });
});

module.exports = cmds;