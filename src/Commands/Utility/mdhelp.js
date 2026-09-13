module.exports = {
    name: 'mdhelp',
    alias: ['syntaxhelp', 'languages'],
    desc: 'Show supported languages for syntax highlighting',
    category: 'Tools',
    usage: '.mdhelp',
    reactions: { start: '📚', success: '👾' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '📚', key: m.key } });

        try {
            await sock.sendMessage(m.chat, {
                headerText: '## 🔖 Supported Languages',
                contentText: '---',
                title: '🎭 Syntax Highlighting Languages',
                table: [
                    ['JavaScript', 'js, javascript'],
                    ['Python', 'py, python'],
                    ['TypeScript', 'ts, typescript'],
                    ['Java', 'java'],
                    ['C / C++', 'c, cpp, c++'],
                    ['HTML', 'html'],
                    ['CSS', 'css'],
                    ['JSON', 'json'],
                    ['Go', 'go'],
                    ['Rust', 'rust'],
                    ['PHP', 'php'],
                    ['Ruby', 'ruby'],
                    ['SQL', 'sql'],
                    ['Swift', 'swift'],
                    ['Kotlin', 'kotlin'],
                    ['Bash', 'bash, sh, shell']
                ],
                footerText: '💡 Use.md <lang> | <code> to create syntax-highlighted code'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '🎭', key: m.key } });

        } catch (err) {
            console.error('[MDHELP ERROR]', err.message);
            reply('✘');
        }
    }
};