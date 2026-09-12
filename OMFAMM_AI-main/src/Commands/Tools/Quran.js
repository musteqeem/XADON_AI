const axios = require('axios');

module.exports = {
    name: 'quran',
    alias: ['koran', 'surah', 'ayah', 'ayat', 'alkareem'],
    desc: 'Get Quran verses in premium format',
    category: 'Search',
    usage: '.quran <surah:verse> |.quran list',
    reactions: { start: '☪️', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const text = args.join(' ').trim().toLowerCase();
        
        if (!text) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • AL QURAN •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}quran <surah:verse>
│
│ ❏ *Examples*
│ • ${prefix}quran 1:1
│ • ${prefix}quran 36:1
│ • ${prefix}quran 112:1
│ • ${prefix}quran 2:255
│ • ${prefix}quran list
│
│ ❏ Al-Quran Al-Kareem
╰─────────────────────────╯`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '☪️', key: m.key } });

        try {
            if (text === 'list') {
                const res = await axios.get('https://api.alquran.cloud/v1/surah', {
                    timeout: 10000,
                    headers: { 'Accept': 'application/json' }
                });

                const surahs = res.data?.data;
                if (!surahs) throw new Error('No data');

                const tableData = [['#', 'Surah', 'English', 'Arabic', 'Ayahs']];
                
                for (const s of surahs.slice(0, 20)) {
                    tableData.push([
                        s.number,
                        s.englishName,
                        s.englishNameTranslation.slice(0, 18),
                        s.name.slice(0, 12),
                        s.numberOfAyahs
                    ]);
                }

                await sock.sendMessage(m.chat, {
                    headerText: `## ◈ Surahs of Al-Quran (1-20)`,
                    contentText: '---',
                    title: '◈ 114 Surahs Total',
                    table: tableData,
                    footerText: `💡 Use ${prefix}quran <number:verse> for verse`
                }, { quoted: m });

                const remaining = surahs.slice(20);
                if (remaining.length) {
                    const table2 = [['#', 'Surah', 'English', 'Arabic', 'Ayahs']];
                    for (const s of remaining.slice(0, 20)) {
                        table2.push([s.number, s.englishName, s.englishNameTranslation.slice(0, 18), s.name.slice(0, 12), s.numberOfAyahs]);
                    }
                    await sock.sendMessage(m.chat, {
                        headerText: `## ◈ Surahs (21-40)`,
                        contentText: '---',
                        table: table2,
                        footerText: 'Use command with number for more'
                    });
                }

                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
                return;
            }

            const parts = text.split(':');
            if (parts.length < 2) return reply('✘ Format: surah:verse e.g. 1:1, 36:1, 112:1');

            const surah = parseInt(parts[0]);
            const verse = parseInt(parts[1]);

            if (!surah ||!verse || surah < 1 || surah > 114) {
                return reply('✘ Invalid surah 1-114');
            }

            const [arabicRes, englishRes, surahRes] = await Promise.all([
                axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/ar.asad`, { timeout: 10000 }),
                axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/en.sahih`, { timeout: 10000 }),
                axios.get(`https://api.alquran.cloud/v1/surah/${surah}`, { timeout: 10000 })
            ]);

            const arabic = arabicRes.data?.data?.text || '';
            const english = englishRes.data?.data?.text || '';
            const surahInfo = surahRes.data?.data;

            const tableData = [
                ['Surah', surahInfo?.englishName || `Surah ${surah}`],
                ['Arabic Name', surahInfo?.name || ''],
                ['Meaning', surahInfo?.englishNameTranslation || ''],
                ['Revelation', surahInfo?.revelationType === 'Meccan'? 'Meccan' : 'Medinan'],
                ['Total Ayahs', String(surahInfo?.numberOfAyahs || '')],
                ['Arabic', arabic],
                ['English', english]
            ];

            await sock.sendMessage(m.chat, {
                headerText: `## ◈ ${surahInfo?.englishName || 'Surah'} (${surah}:${verse})`,
                contentText: '---',
                title: '◈ Al-Quran Al-Kareem',
                table: tableData,
                footerText: `💡 ${prefix}quran list for all surahs`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[QURAN ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply('✘ Failed to fetch verse. Try again');
        }
    }
};