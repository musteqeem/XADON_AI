const yts = require('yt-search');
const axios = require('axios');

module.exports = {
    name: 'play2',
    description: '*Musteqeem MD* :Download songs from YouTube',
    category: 'downloader',
    execute: async (sock, m, {
        args,
        text,
        q,
        quoted,
        mime,
        qmsg,
        isMedia,
        groupMetadata,
        groupName,
        participants,
        groupOwner,
        groupAdmins,
        isBotAdmins,
        isAdmins,
        isGroupOwner,
        isCreator,
        prefix,
        reply,
        config,
        sender
    }) => {
        try {
            if (!text) {
                return await reply("*BOSS .play didnt work?*\n❌ Please provide a song name!\nExample: `.play Lilly Alan Walker`");
            }

            // Add initial reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "🔍", key: m.key } 
            });

            // Search YouTube
            const { videos } = await yts(text);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                return await reply("⚠️ No results found for your query!");
            }

            const video = videos[0];
            
            // Update reaction to downloading
            await sock.sendMessage(m.chat, { 
                react: { text: "⬇️", key: m.key } 
            });

            // Send video info
            await sock.sendMessage(m.chat, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n\n⬇️ Downloading audio...`
            }, { quoted: m });

            // Download audio
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data?.status || !data.audio) {
                await sock.sendMessage(m.chat, { 
                    react: { text: "❌", key: m.key } 
                });
                return await reply("🚫 Download failed. Try again later.");
            }

            // Success reaction
            await sock.sendMessage(m.chat, { 
                react: { text: "✅", key: m.key } 
            });

            // Send audio
            await sock.sendMessage(m.chat, {
                audio: { url: data.audio },
                mimetype: "audio/mpeg",
                fileName: `${data.title || video.title}.mp3`
            }, { quoted: m });

        } catch (error) {
            console.error('Error in play command:', error);
            await sock.sendMessage(m.chat, { 
                react: { text: "❌", key: m.key } 
            });
            await reply("❌ Download failed. Please try again later.");
        }
    }
};