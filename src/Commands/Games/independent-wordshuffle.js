const textOf = (args) => (args || []).join(' ').trim();
module.exports = {
    name: "wordshuffle",
    alias: [],
    category: 'Games',
    desc: "Shuffle a word",
    usage: '.wordshuffle [input]',
    reactions: { start: '🎮', success: '✅', error: '❌' },
    execute: async (sock, m, { args, reply }) => {
        try {
            const input = textOf(args);
            const pick = list => list[Math.floor(Math.random() * list.length)];
            let result;
            if ('wordshuffle' === 'coinflip') result = pick(['Heads', 'Tails']);
            else if ('wordshuffle' === 'dice') { const count = Math.min(10, Math.max(1, Number(args[0]) || 1)); result = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).join(', '); }
            else if ('wordshuffle' === '8ball') result = pick(['Yes', 'No', 'Maybe', 'Ask again later', 'Definitely']);
            else if ('wordshuffle' === 'rps') result = 'Bot chose ' + pick(['rock', 'paper', 'scissors']) + '. You chose ' + (args[0] || 'nothing') + '.';
            else if ('wordshuffle' === 'guessnumber') result = 'I chose a number from 1 to 100. Your guess: ' + (args[0] || 'none') + '. Try again with another guess.';
            else if ('wordshuffle' === 'randomnumber') result = String(Math.floor(Math.random() * 100) + 1);
            else if ('wordshuffle' === 'slot') result = [pick(['🍒','🍋','⭐','7️⃣']), pick(['🍒','🍋','⭐','7️⃣']), pick(['🍒','🍋','⭐','7️⃣'])].join(' | ');
            else if ('wordshuffle' === 'ship' || 'wordshuffle' === 'lovetest') result = 'Compatibility: ' + (Math.floor(Math.random() * 101)) + '%';
            else if ('wordshuffle' === 'wordshuffle' || 'wordshuffle' === 'anagram') result = [...(input || 'whatsapp')].sort(() => Math.random() - 0.5).join('');
            else if ('wordshuffle' === 'countdown') { const n = Math.min(20, Math.max(1, Number(args[0]) || 5)); result = Array.from({ length: n }, (_, i) => n - i).join(' → ') + ' → Go!'; }
            else if ('wordshuffle' === 'evenodd') { const n = Number(args[0]); result = Number.isFinite(n) ? (n % 2 === 0 ? 'Even' : 'Odd') : 'Provide a number.'; }
            else if ('wordshuffle' === 'colorpick') result = pick(['red','blue','green','yellow','purple','orange']);
            else if ('wordshuffle' === 'animal') result = pick(['cat','dog','lion','eagle','dolphin','elephant']);
            else if ('wordshuffle' === 'country') result = pick(['Nigeria','Ghana','Kenya','Japan','Brazil','Canada','India']);
            else if ('wordshuffle' === 'truth') result = pick(['What is one goal you have not told anyone?','What was your funniest mistake?']);
            else if ('wordshuffle' === 'dare') result = pick(['Send a kind message to someone.','Change your status to something funny for ten minutes.']);
            else if ('wordshuffle' === 'joke') result = pick(['Why did the developer go broke? Because they used up all their cache.','I told my bot a joke. It needed more processing time.']);
            else if ('wordshuffle' === 'compliment') result = pick(['You make difficult things look manageable.','Your curiosity is a powerful skill.']);
            else if ('wordshuffle' === 'roast') result = pick(['You are not slow; you are just running in safe mode.','Your Wi-Fi has more direction than your plans.']);
            else if ('wordshuffle' === 'fortune') result = pick(['A useful opportunity is closer than you think.','Your next good idea will arrive while solving another problem.']);
            else if ('wordshuffle' === 'motivate') result = pick(['Small consistent steps beat occasional heroic effort.','Start before you feel completely ready.']);
            else result = pick(['Would you rather always be early or always be prepared?','Never have I ever forgotten why I opened an app.','Riddle: What has keys but cannot open locks? A keyboard.','Your reaction: 👍']);
            return reply(String(result));
        } catch (error) { console.error('[WORDSHUFFLE ERROR]', error); return reply('Game error: ' + error.message); }
    }
};
