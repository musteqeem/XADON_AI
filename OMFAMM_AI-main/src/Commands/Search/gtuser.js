const axios = require('axios');

module.exports = {
    name: 'githubinfo',
    alias: ['gituser', 'dev', 'github'],
    desc: 'Get GitHub user profile information',
    category: 'Search',
    usage: '.githubinfo <username>',
    reactions: { start: '🐙', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🐙', key: m.key } });

        const username = args[0]?.trim();

        if (!username) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • GITHUB INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏${prefix}githubinfo <username>
│
│ ❏ *EXAMPLES*
│ •${prefix}githubinfo crysnovax
│ •${prefix}githubinfo itsliaaa
│ •${prefix}githubinfo torvalds
│
│ ❏ *INFO*
│ • GitHub Profile Stats
╰─────────────────────────╯`
            );
        }

        await reply(`❏ Fetching: ${username}...`);

        try {
            const [userRes, reposRes] = await Promise.all([
                axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
                    timeout: 10000,
                    headers: { 'Accept': 'application/json', 'User-Agent': 'XADON-Bot' }
                }),
                axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100`, {
                    timeout: 10000,
                    headers: { 'Accept': 'application/json', 'User-Agent': 'XADON-Bot' }
                })
            ]);

            const user = userRes.data;
            const repos = reposRes.data;

            // Calculate total stars
            const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
            const topLang = repos.map(r => r.language).filter(Boolean);
            const mostUsedLang = topLang.sort((a, b) =>
                topLang.filter(v => v === b).length - topLang.filter(v => v === a).length
            )[0] || 'N/A';

            const tableData = [
                ['Property', 'Value'],
                ['Name', user.name || username],
                ['Username', `@${user.login}`],
                ['Bio', (user.bio || 'No bio').length > 60? user.bio.slice(0, 57) + '...' : (user.bio || 'No bio')],
                ['Public Repos', user.public_repos],
                ['Total Stars', totalStars],
                ['Followers', user.followers],
                ['Following', user.following],
                ['Top Language', mostUsedLang],
                ['Company', user.company || 'N/A'],
                ['Location', user.location || 'N/A'],
                ['Twitter', user.twitter_username || 'N/A'],
                ['Joined', new Date(user.created_at).toLocaleDateString()],
                ['Profile', user.html_url]
            ];

            await sock.sendMessage(m.chat, {
                headerText: `◈ 🐙 ${user.login}`,
                contentText: '---',
                title: '◈ GitHub Profile',
                table: tableData,
                footerText: '⚡ Powered by AI ֎'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[GITHUB ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });

            if (error.response?.status === 404) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • GITHUB INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ User not found: "${username}"
│
│ ❏ *NOTE*
│ • Check spelling and try again
╰─────────────────────────╯`
                );
            } else if (error.response?.status === 403) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • GITHUB INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ GitHub API rate limited
│
│ ❏ *NOTE*
│ • Try again later
╰─────────────────────────╯`
                );
            } else {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • GITHUB INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to fetch GitHub info
╰─────────────────────────╯`
                );
            }
        }
    }
};