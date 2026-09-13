module.exports = {
    name: 'md',
    alias: ['markdown', 'syntax', 'code'],
    desc: 'Send syntax-highlighted code block',
    category: 'Tools',
    usage: '.md <language> | <code>',
    reactions: { start: '💻', success: '👾', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const input = args.join(' ').trim();

        if (!input) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • CODE BLOCK •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SYNTAX HIGHLIGHTER*
│ ❏ Usage : ${prefix}md <language> | <code>
│ ❏ Example : ${prefix}md javascript | console.log('Hello!')
│ ❏ Example : ${prefix}md python | print("Hello World")
│ ❏ Languages : js, py, java, cpp, html, css, etc.
╰─────────────────────────╯`
            );
        }

        const separatorIndex = input.indexOf('|');
        let language, code;

        if (separatorIndex!== -1) {
            language = input.slice(0, separatorIndex).trim().toLowerCase();
            code = input.slice(separatorIndex + 1).trim();
        } else {
            language = 'javascript';
            code = input;
        }

        const languageAliases = {
            'js': 'javascript', 'javascript': 'javascript',
            'py': 'python', 'python': 'python',
            'java': 'java', 'cpp': 'cpp', 'c++': 'cpp', 'c': 'c',
            'html': 'html', 'css': 'css', 'json': 'json',
            'ts': 'typescript', 'typescript': 'typescript',
            'go': 'go', 'rust': 'rust', 'php': 'php',
            'ruby': 'ruby', 'swift': 'swift', 'kotlin': 'kotlin',
            'sql': 'sql', 'shell': 'bash', 'bash': 'bash', 'sh': 'bash'
        };

        const lang = languageAliases[language] || language;

        await sock.sendMessage(m.chat, { react: { text: '💻', key: m.key } });

        try {
            await sock.sendMessage(m.chat, {
                headerText: `## 📝 ${lang.charAt(0).toUpperCase() + lang.slice(1)} Code`,
                contentText: '---',
                code: code,
                language: lang,
                footerText: '💻 Syntax • Verified'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '👾', key: m.key } });
        } catch (err) {
            console.error('[MD ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '🙊', key: m.key } });
            reply(`\`\`\`${lang}\n${code}\n\`\``);
        }
    }
};