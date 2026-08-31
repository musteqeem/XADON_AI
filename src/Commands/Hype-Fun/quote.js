const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const axios = require('axios');

// ── LOCAL QUOTE DATABASE - ADD MORE HERE ──
const LOCAL_QUOTES = [
    '"The only way to do great work is to love what you do." - Steve Jobs',
    '"In the middle of difficulty lies opportunity." - Albert Einstein',
    '"It does not matter how slowly you go as long as you do not stop." - Confucius',
    '"Success is not final, failure is not fatal." - Winston Churchill',
    '"Believe you can and you\'re halfway there." - Theodore Roosevelt',
    '"Your time is limited, don\'t waste it living someone else\'s life." - Steve Jobs',
    '"The future belongs to those who believe in their dreams." - Eleanor Roosevelt',
    '"Everything you\'ve ever wanted is on the other side of fear." - George Addair',
    '"It always seems impossible until it\'s done." - Nelson Mandela',
    '"What you seek is seeking you." - Rumi',
    '"Don\'t watch the clock, do what it does. Keep going." - Sam Levenson',
    '"The way to get started is to quit talking and begin doing." - Walt Disney',
    '"If you can dream it, you can do it." - Walt Disney',
    '"Keep your face always toward the sunshine, and shadows will fall behind you." - Walt Whitman',
    '"You miss 100% of the shots you don\'t take." - Wayne Gretzky',
    '"The best way to predict the future is to create it." - Peter Drucker',
    '"Act as if what you do makes a difference. It does." - William James',
    '"Success is liking yourself, liking what you do, and liking how you do it." - Maya Angelou',
    '"Motivation is what gets you started. Habit is what keeps you going." - Jim Ryun',
    '"We may encounter many defeats but we must not be defeated." - Maya Angelou',
    '"The only limit to our realization of tomorrow is our doubts of today." - FDR',
    '"Do what you can, with what you have, where you are." - Theodore Roosevelt',
    '"Happiness is not by chance, but by choice." - Jim Rohn',
    '"The purpose of our lives is to be happy." - Dalai Lama',
    '"Turn your wounds into wisdom." - Oprah Winfrey',
    '"The only impossible journey is the one you never begin." - Tony Robbins',
    '"Life is 10% what happens to you and 90% how you react to it." - Charles Swindoll',
    '"Your only limit is your mind." - Unknown',
    '"Dream bigger. Do bigger." - Unknown',
    '"Be the change that you wish to see in the world." - Mahatma Gandhi',
    '"You don\'t have to be great to start, but you have to start to be great." - Zig Ziglar',
    '"Either you run the day, or the day runs you." - Jim Rohn',
    '"The harder you work for something, the greater you\'ll feel when you achieve it." - Unknown',
    '"Discipline is choosing between what you want now and what you want most." - Unknown',
    '"Small daily improvements are the key to staggering long-term results." - Unknown',
    '"It\'s not about being the best. It\'s about being better than you were yesterday." - Unknown',
    '"Great things never come from comfort zones." - Unknown',
    '"Don\'t stop when it hurts. Stop when you\'re done." - Unknown',
    '"Wake up with determination. Go to bed with satisfaction." - Unknown',
    '"Do something today that your future self will thank you for." - Unknown',
    '"The key to success is to focus on goals, not obstacles." - Unknown',
    '"You are never too old to set another goal or to dream a new dream." - C.S. Lewis',
    '"Success usually comes to those who are too busy to be looking for it." - Henry Thoreau',
    '"Opportunities don\'t happen. You create them." - Chris Grosser',
    '"Don\'t be pushed around by the fears in your mind. Be led by the dreams in your heart." - Roy T. Bennett',
    '"The man who has confidence in himself gains the confidence of others." - Hasidic Proverb',
    '"Perseverance is failing 19 times and succeeding the 20th." - Julie Andrews',
    '"You just can\'t beat the person who never gives up." - Babe Ruth',
    '"There is no substitute for hard work." - Thomas Edison',
    // ADD 250 MORE QUOTES HERE TO REACH 300
];

module.exports = {
    name: 'quote',
    alias: ['quotes', 'motivation', 'inspire'],
    desc: 'Get a motivational quote. API first, local fallback',
    category: 'Fun',
    usage: '.quote',
    reactions: { start: '💬', success: '✨', error: '❌' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '💬', key: m.key } });

        let quote = null;
        let author = 'Unknown';
        let source = 'local';

        try {
            // 1. Try API first
            const res = await axios.get('https://api.quotable.io/random', {
                timeout: 6000
            });
            if (res.data?.content) {
                quote = res.data.content;
                author = res.data.author;
                source = 'Quotable API';
            }
        } catch {
            // 2. Fallback to local quotes
            const randomQuote = LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];
            const parts = randomQuote.split(' - ');
            quote = parts[0].replace(/"/g, '');
            author = parts[1] || 'Unknown';
            source = `${BOT_NAME} Knowledge Base`;
        }

        await sock.sendMessage(m.chat, {
            text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} QUOTE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DAILY INSPIRATION*
│ ❏ "${quote}"
│
│ ❏ — ${author}
│ ❏ Source : ${source}
╰─────────────────────────╯

_*💡 Need more motivation? Use ${prefix}quote*_`
        }, { quoted: m });

        await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
    }
};