const textOf = (args) => (args || []).join(' ').trim();
module.exports = {
    name: "joke",
    alias: [],
    category: 'Games',
    desc: "Get a clean joke",
    usage: '.joke [input]',
    reactions: { start: '🎮', success: '✅', error: '❌' },
    execute: async (sock, m, { args, reply }) => {
        try {
            const input = textOf(args);
            const pick = list => list[Math.floor(Math.random() * list.length)];
            let result;
            if ('joke' === 'coinflip') result = pick(['Heads', 'Tails']);
            else if ('joke' === 'dice') { const count = Math.min(10, Math.max(1, Number(args[0]) || 1)); result = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).join(', '); }
            else if ('joke' === '8ball') result = pick(['Yes', 'No', 'Maybe', 'Ask again later', 'Definitely']);
            else if ('joke' === 'rps') result = 'Bot chose ' + pick(['rock', 'paper', 'scissors']) + '. You chose ' + (args[0] || 'nothing') + '.';
            else if ('joke' === 'guessnumber') result = 'I chose a number from 1 to 100. Your guess: ' + (args[0] || 'none') + '. Try again with another guess.';
            else if ('joke' === 'randomnumber') result = String(Math.floor(Math.random() * 100) + 1);
            else if ('joke' === 'slot') result = [pick(['🍒','🍋','⭐','7️⃣']), pick(['🍒','🍋','⭐','7️⃣']), pick(['🍒','🍋','⭐','7️⃣'])].join(' | ');
            else if ('joke' === 'ship' || 'joke' === 'lovetest') result = 'Compatibility: ' + (Math.floor(Math.random() * 101)) + '%';
            else if ('joke' === 'wordshuffle' || 'joke' === 'anagram') result = [...(input || 'whatsapp')].sort(() => Math.random() - 0.5).join('');
            else if ('joke' === 'countdown') { const n = Math.min(20, Math.max(1, Number(args[0]) || 5)); result = Array.from({ length: n }, (_, i) => n - i).join(' → ') + ' → Go!'; }
            else if ('joke' === 'evenodd') { const n = Number(args[0]); result = Number.isFinite(n) ? (n % 2 === 0 ? 'Even' : 'Odd') : 'Provide a number.'; }
            else if ('joke' === 'colorpick') result = pick(['red','blue','green','yellow','purple','orange']);
            else if ('joke' === 'animal') result = pick(['cat','dog','lion','eagle','dolphin','elephant']);
            else if ('joke' === 'country') result = pick(['Nigeria','Ghana','Kenya','Japan','Brazil','Canada','India']);
            else if ('joke' === 'truth') result = pick(['What is one goal you have not told anyone?','What was your funniest mistake?']);
            else if ('joke' === 'dare') result = pick(['Send a kind message to someone.','Change your status to something funny for ten minutes.']);
            else if ('joke' === 'joke') result = pick(['Why did the developer go broke? Because they used up all their cache.','I told my bot a joke. It needed more processing time.']);
            else if ('joke' === 'compliment') result = pick(['You make difficult things look manageable.','Your curiosity is a powerful skill.']);
            else if ('joke' === 'roast') result = pick(['You are not slow; you are just running in safe mode.','Your Wi-Fi has more direction than your plans.']);
            else if ('joke' === 'fortune') result = pick(['A useful opportunity is closer than you think.','Your next good idea will arrive while solving another problem.']);
            else if ('joke' === 'motivate') result = pick(['Small consistent steps beat occasional heroic effort.','Start before you feel completely ready.']);
            else result = pick(['Would you rather always be early or always be prepared?','Never have I ever forgotten why I opened an app.','Riddle: What has keys but cannot open locks? A keyboard.','Your reaction: 👍']);
            return reply(String(result));
        } catch (error) { console.error('[JOKE ERROR]', error); return reply('Game error: ' + error.message); }
    }
};
