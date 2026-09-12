const util = require('util');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage, proto } = require('@musteqeem/baileys');

const DB_DIR = path.resolve('./database');
const DB_PATH = path.join(DB_DIR, 'pack.json');

// Auto create database/pack.json
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}');

global.__packDB = global.__packDB || new Map(Object.entries(JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))));

const saveDB = () => fs.writeFileSync(DB_PATH, JSON.stringify(Object.fromEntries(global.__packDB), null, 2));

const downloadBuffer = async (quoted) => {
    const type = Object.keys(quoted.message)[0];
    const msgType = type.replace('Message','').toLowerCase().replace('v2','');
    const stream = await downloadContentFromMessage(quoted.message[type], msgType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return { buffer, mimetype: quoted.message[type].mimetype || 'application/octet-stream' };
}

const box = (title, content) => {
    const line = '─'.repeat(Math.min(title.length + 2, 40));
    return `┌➫─⏚ ${title} ${line}\n${content}\n└${'─'.repeat(42)}`;
};

module.exports = {
    name: 'epack',
    alias: ['peclone', 'elistpack', 'edelpack', 'gen4'], // added gen4
    desc: 'Reverse engineer any msg/media to eval code. Auto saves to database/pack.json',
    category: 'Owner',
    ownerOnly: true,

    execute: async (sock, m, { args, reply, text, prefix, command, isOwner }) => {

        // LIST PACKED ITEMS
        if (command === 'elistpack') {
            if (global.__packDB.size === 0) return reply('✦ No packed items yet');
            let list = [...global.__packDB.entries()].map(([k,v]) => `❏ ${k} | ${v.type}`).join('\n');
            return reply(box(`📦 PACKED ITEMS: ${global.__packDB.size}`, list));
        }

        // DELETE PACKED ITEM
        if (command === 'edelpack') {
            const id = args[0];
            if (!id) return reply(`✦ Usage: ${prefix}edelpack <id>`);
            if (!global.__packDB.has(id)) return reply('✘ ID not found');
            global.__packDB.delete(id);
            saveDB();
            return reply(`✅ Deleted ${id}`);
        }

        // PACK COMMAND
        if (!m.quoted) return reply(`✦ Reply to any msg/media\n✦ Usage: \`${prefix}epack\` or \`${prefix}gen4\``);

        const quoted = m.quoted;
        let type = Object.keys(quoted.message)[0];

        // Handle rich messages / gen4
        if(type === 'viewOnceMessageV2') type = 'viewOnceMessage';
        if(type === 'viewOnceMessageV2Extension') type = 'viewOnceMessage';
        if(type === 'interactiveMessage') type = 'interactiveMessage';
        if(type === 'productMessage') type = 'productMessage';
        if(type === 'templateMessage') type = 'templateMessage';

        let code = '';
        let title = '';
        const id = 'pack_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);

        try {
            // 1. TEXT
            if (type === 'conversation' || type === 'extendedTextMessage') {
                const txt = quoted.message.conversation || quoted.message.extendedTextMessage?.text || '';
                const mentions = quoted.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                code = `await sendText(${JSON.stringify(txt)})`;
                if (mentions.length) code += `\n// Mentions: ${mentions.join(', ')}`;
                title = 'TEXT';
            }

            // 2. IMAGE / IMAGE V2
            else if (type === 'imageMessage' || type === 'imageMessageV2') {
                const { buffer, mimetype } = await downloadBuffer(quoted);
                const caption = quoted.message.imageMessage?.caption || quoted.message.imageMessageV2?.caption || '';
                global.__packDB.set(id, { type: 'image', buffer: buffer.toString('base64'), mimetype, caption });
                saveDB();
                code = `let d=global.__packDB.get('${id}');await sendImage(Buffer.from(d.buffer,'base64'),d.caption)`;
                title = 'IMAGE';
            }

            // 3. VIDEO
            else if (type === 'videoMessage' || type === 'videoMessageV2') {
                const { buffer, mimetype } = await downloadBuffer(quoted);
                const caption = quoted.message.videoMessage?.caption || quoted.message.videoMessageV2?.caption || '';
                global.__packDB.set(id, { type: 'video', buffer: buffer.toString('base64'), mimetype, caption });
                saveDB();
                code = `let d=global.__packDB.get('${id}');await sendVideo(Buffer.from(d.buffer,'base64'),d.caption)`;
                title = 'VIDEO';
            }

            // 4. AUDIO / PTT
            else if (type === 'audioMessage') {
                const { buffer, mimetype } = await downloadBuffer(quoted);
                const ptt = quoted.message.audioMessage.ptt || false;
                global.__packDB.set(id, { type: 'audio', buffer: buffer.toString('base64'), mimetype, ptt });
                saveDB();
                code = `let d=global.__packDB.get('${id}');await sendAudio(Buffer.from(d.buffer,'base64'),d.ptt)`;
                title = 'AUDIO';
            }

            // 5. STICKER
            else if (type === 'stickerMessage') {
                const { buffer } = await downloadBuffer(quoted);
                global.__packDB.set(id, { type: 'sticker', buffer: buffer.toString('base64') });
                saveDB();
                code = `let d=global.__packDB.get('${id}');await sendSticker(Buffer.from(d.buffer,'base64'))`;
                title = 'STICKER';
            }

            // 6. DOCUMENT
            else if (type === 'documentMessage') {
                const { buffer } = await downloadBuffer(quoted);
                const filename = quoted.message.documentMessage.fileName || 'file';
                global.__packDB.set(id, { type: 'document', buffer: buffer.toString('base64'), filename });
                saveDB();
                code = `let d=global.__packDB.get('${id}');await sendFile(Buffer.from(d.buffer,'base64'),d.filename)`;
                title = 'DOCUMENT';
            }

            // 7. CONTACT
            else if (type === 'contactMessage') {
                const v = quoted.message.contactMessage;
                const num = v.vcard.match(/waid=(\d+)/)?.[1] || '';
                code = `await sendContact(${JSON.stringify(v.displayName)}, '${num}')`;
                title = 'CONTACT';
            }

            // 8. LOCATION
            else if (type === 'locationMessage') {
                const l = quoted.message.locationMessage;
                code = `await sendLocation(${l.degreesLatitude}, ${l.degreesLongitude}, ${JSON.stringify(l.name || 'Location')})`;
                title = 'LOCATION';
            }

            // 9. BUTTONS
            else if (type === 'buttonsMessage') {
                const b = quoted.message.buttonsMessage;
                const btns = b.buttons?.map(btn => btn.buttonText.displayText) || [];
                code = `await sendButtons(${JSON.stringify(b.contentText)}, ${JSON.stringify(btns)})`;
                title = 'BUTTONS';
            }

            // 10. LIST
            else if (type === 'listMessage') {
                const l = quoted.message.listMessage;
                const sections = l.sections?.map(s => ({title:s.title,rows:s.rows.map(r=>({title:r.title,description:r.description||'',rowId:r.rowId}))})) || [];
                code = `await sendList(${JSON.stringify(l.description)}, ${JSON.stringify(sections)})`;
                title = 'LIST';
            }

            // 11. REACTION
            else if (type === 'reactionMessage') {
                const r = quoted.message.reactionMessage;
                code = `await sock.sendMessage('${m.chat}',{react:{text:'${r.text}',key:{id:'${quoted.key.id}',remoteJid:'${quoted.key.remoteJid}'}}})`;
                title = 'REACTION';
            }

            // 12. POLL
            else if (type === 'pollCreationMessage') {
                const p = quoted.message.pollCreationMessage;
                code = `await sock.sendMessage('${m.chat}',{poll:{name:${JSON.stringify(p.name)},values:${JSON.stringify(p.options.map(o=>o.optionName))},selectableCount:${p.selectableOptionsCount}}})`;
                title = 'POLL';
            }

            // 13. VIEWONCE GEN4
            else if (type === 'viewOnceMessage') {
                const vmsg = quoted.message.viewOnceMessage.message;
                const vtype = Object.keys(vmsg)[0];
                if(vtype.includes('image')){
                    const { buffer } = await downloadBuffer({message:vmsg});
                    global.__packDB.set(id, { type: 'viewonce', buffer: buffer.toString('base64') });
                    saveDB();
                    code = `let d=global.__packDB.get('${id}');await sendImage(Buffer.from(d.buffer,'base64'),'Unlocked ViewOnce')`;
                    title = 'VIEWONCE IMAGE';
                }
            }

            // 14. INTERACTIVE MESSAGE - GEN4 RICH CARDS
            else if (type === 'interactiveMessage') {
                const i = quoted.message.interactiveMessage;
                const body = i.body?.text || 'Interactive Message';
                const footer = i.footer?.text || '';
                const header = i.header?.title || '';
                code = `await sock.sendMessage('${m.chat}', { interactive: ${JSON.stringify(i)} })`;
                title = 'INTERACTIVE/GEN4';
            }

            // 15. PRODUCT MESSAGE
            else if (type === 'productMessage') {
                const p = quoted.message.productMessage;
                code = `await sock.sendMessage('${m.chat}', { product: ${JSON.stringify(p)} })`;
                title = 'PRODUCT';
            }

            // 16. TEMPLATE MESSAGE
            else if (type === 'templateMessage') {
                const t = quoted.message.templateMessage;
                code = `await sock.sendMessage('${m.chat}', { template: ${JSON.stringify(t)} })`;
                title = 'TEMPLATE';
            }

            else return reply(`✘ Type \`${type}\` not supported yet\nTry sending me the msg type and I will add it`);

            const finalCode = `// XADON PACK | ID: ${id} | GEN4 SUPPORT\n// Saved in database/pack.json\n${code}`;

            return reply(box(`✅ PACKED ${title}`, `\`\`js\n${finalCode}\n\`\n\nID: \`${id}\`\nRun: ${prefix}eval <paste>`));

        } catch (e) {
            console.log(e)
            return reply(box(`✘ PACK ERROR`, `\`\n${e.message}\n\`\n\nType: ${type}`));
        }
    }
};