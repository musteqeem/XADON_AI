/**
 *.esports — Live & upcoming eSports matches in your timezone
 */

const { getUserTimezone, getTimeData } = require('../Core/®-utils');
const { getTimezone } = require('../Core/®.js');

// Mock eSports schedule (replace with real API: PandaScore, Abios, etc.)
const ESPORTS_SCHEDULE = [
    { game: 'League of Legends', event: 'Worlds 2024', match: 'T1 vs Gen.G', time: '2024-11-02T14:00:00Z', timezone: 'UTC' },
    { game: 'CS2', event: 'BLAST Premier', match: 'FaZe vs NAVI', time: '2024-11-02T18:30:00Z', timezone: 'UTC' },
    { game: 'Dota 2', event: 'The International', match: 'Team Spirit vs Gaimin', time: '2024-11-03T10:00:00Z', timezone: 'UTC' },
    { game: 'Valorant', event: 'Champions', match: 'Sentinels vs PRX', time: '2024-11-03T16:00:00Z', timezone: 'UTC' },
    { game: 'Overwatch 2', event: 'World Cup', match: 'USA vs Korea', time: '2024-11-02T20:00:00Z', timezone: 'UTC' }
];

const formatMatchTime = (matchTime, userTimezone) => {
    const date = new Date(matchTime);
    const userDate = new Date(date.toLocaleString('en-US', { timeZone: userTimezone }));

    const now = new Date();
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));

    const diffMs = userDate - userNow;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let status;
    if (diffMs < 0) {
        status = '🔴 LIVE';
    } else if (diffHrs < 1) {
        status = `🟡 ${diffMins}m`;
    } else if (diffHrs < 24) {
        status = `🟢 ${diffHrs}h ${diffMins}m`;
    } else {
        const days = Math.floor(diffHrs / 24);
        status = `⚪ ${days}d`;
    }

    const timeStr = userDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const dateStr = userDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    return { timeStr, dateStr, status, isLive: diffMs < 0 };
};

module.exports = {
    name: 'esports',
    alias: ['esport'],
    desc: 'eSports matches in your timezone',
    category: 'Entertainment',
    usage: '.esports [game] (e.g.,.esports,.esports LOL,.esports CS2)',
    reactions: { start: '🎮', success: '✨', live: '🔴', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎮', key: m.key } });

        try {
            const userId = m.sender || m.key?.participant || m.key?.remoteJid;
            const userRegion = getUserTimezone(userId);
            const userTimezone = getTimezone(userRegion) || 'Africa/Lagos';

            const { data } = await getTimeData(userTimezone);
            const now = new Date(data.datetime);

            const requestedGame = args.join(' ').toLowerCase();

            // Filter matches
            let matches = ESPORTS_SCHEDULE;
            if (requestedGame) {
                matches = matches.filter(m =>
                    m.game.toLowerCase().includes(requestedGame) ||
                    m.event.toLowerCase().includes(requestedGame)
                );
            }

            if (matches.length === 0) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • ESPORTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NO MATCHES*
│ ❏ No matches found
│
│ ❏ *TRY*
│ •.esports LOL
│ •.esports CS2
│ •.esports Dota
╰─────────────────────────╯`
                );
            }

            // Sort by time
            matches.sort((a, b) => new Date(a.time) - new Date(b.time));

            let liveCount = 0;
            const tableData = [['Game', 'Match', 'Time', 'Status']];

            for (const match of matches.slice(0, 5)) {
                const { timeStr, dateStr, status, isLive } = formatMatchTime(match.time, userTimezone);
                if (isLive) liveCount++;

                const gameEmoji = {
                    'League of Legends': '⚔️',
                    'CS2': '🔫',
                    'Dota 2': '🐉',
                    'Valorant': '🎯',
                    'Overwatch 2': '🤖'
                }[match.game] || '🎮';

                tableData.push([
                    `${gameEmoji} ${match.game}`,
                    match.match,
                    `${dateStr} ${timeStr}`,
                    status
                ]);
            }

            await sock.sendMessage(m.chat, {
                headerText: `◈ 🎮 ESPORTS SCHEDULE`,
                contentText: `📍 ${userRegion} Time | 🕐 ${now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:true})}`,
                title: `◈ ${liveCount > 0? `${liveCount} LIVE Now` : 'Upcoming Matches'}`,
                table: tableData,
                footerText: `💡 Use:.esports <game> • ⚡ Powered by AI ֎`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: liveCount > 0? '🔴' : '✨', key: m.key } });

        } catch (err) {
            console.error('[ESPORTS ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • ESPORTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to fetch matches
│
│ ❏ *NOTE*
│ • Please try again later
╰─────────────────────────╯`
            );
        }
    }
};