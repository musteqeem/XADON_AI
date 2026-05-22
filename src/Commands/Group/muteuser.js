const fs = require('fs');
const path = require('path');

const MUTE_FILE = path.join(__dirname,'../../database/mutedUsers.json');

const initDb = () => {
   const dir = path.dirname(MUTE_FILE);
   if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
   if(!fs.existsSync(MUTE_FILE)) fs.writeFileSync(MUTE_FILE,'{}');
};

const getMutedDb = () => {
   initDb();
   try{ return JSON.parse(fs.readFileSync(MUTE_FILE,'utf8')); }
   catch{ return {}; }
};

const saveMutedDb = data => {
   fs.writeFileSync(MUTE_FILE,JSON.stringify(data,null,2));
};

const parseTime = str => {
   const match = str?.match(/^(\d+)(s|m|h|d|w|mo)$/i);
   if(!match) return null;
   const num=parseInt(match[1]);
   const unit=match[2].toLowerCase();
   const map={ s:1000, m:60000, h:3600000, d:86400000, w:604800000, mo:2592000000 };
   return num * map[unit];
};

const formatTime = ms => {
   if(ms<=0) return 'Expired';
   const s=Math.floor(ms/1000);
   const m=Math.floor(s/60);
   const h=Math.floor(m/60);
   const d=Math.floor(h/24);
   if(d>0) return `${d}d ${h%24}h`;
   if(h>0) return `${h}h ${m%60}m`;
   if(m>0) return `${m}m ${s%60}s`;
   return `${s}s`;
};

const getUserName = (sock,jid)=>{
   try{
       const contact=sock.store?.contacts?.get?.(jid);
       if(contact?.notify) return contact.notify;
       if(contact?.name) return contact.name;
       if(contact?.verifiedName) return contact.verifiedName;
   }catch{}
   return jid.split('@')[0];
};

const ensureGroupConfig = (db, group) => {
   if (!db[group]) db[group] = {};
   return db[group];
};

module.exports = {
   name:'muteuser',
   alias:['silence','shutup','unmuteuser','mute'],
   category:'Group',
   desc:'Mute system with XDN defense core',
   reactions: { start: '🔇', success: '֎' },

   execute: async(sock,m,{args,prefix,reply,isGroup,isAdmin,isBotAdmin,sender,mentionedJid})=>{
       if(!isGroup) return reply('֎ Group only command');

       const db=getMutedDb();
       const chatId=m.chat;
       const groupData=ensureGroupConfig(db, chatId);

       const sub=args[0]?.toLowerCase();
       const textLower=(m.text||'').toLowerCase();
       const isUnmute=textLower.startsWith(prefix+'unmute');

       // Status panel
       if(!sub || sub==='status'){
           const mutedCount=Object.keys(groupData).length;
           return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • MUTE SYSTEM STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ACTIVE
│ ❏ Muted Users : ${mutedCount}
│ ❏ Mode : MESSAGE BLOCK
╰─────────────────────────╯

Commands:
֎.muteuser @user 30m reason → Mute
֎.unmuteuser @user → Unmute
֎.muteuser list → Show muted list
֎.muteuser clear → Clear all mutes
֎.muteuser info @user → Check mute
֎.muteuser extend @user 1h → Extend time
֎.muteuser reduce @user 10m → Reduce time
֎.muteuser reason @user new reason → Update reason
֎.muteuser silent on/off → Silent delete
֎.muteuser notify on/off → Notify on delete
֎.muteuser log on/off → Log actions`
           );
       }

       // Target detection
       let targetJid=null;
       if(mentionedJid?.length) targetJid=mentionedJid[0];
       else if(m.quoted?.sender) targetJid=m.quoted.sender;
       else{
           const match=(m.text||'').match(/@(\d+)/);
           if(match) targetJid=match[1]+'@s.whatsapp.net';
       }
       if(!targetJid && /^\d+$/.test(args[1])) targetJid=args[1]+'@s.whatsapp.net';

       if(!targetJid &&!['list','clear','silent','notify','log'].includes(sub)){
           return reply(`֎ Specify user\nExample:\n${prefix}muteuser @user 30s reason`);
       }

       const meta=await sock.groupMetadata(chatId);
       const targetParticipant=meta.participants.find(p=>p.id===targetJid);
       const isTargetAdmin=targetParticipant?.admin==='admin' || targetParticipant?.admin==='superadmin';
       let targetName=targetJid? getUserName(sock,targetJid) : '';

       // UNMUTE
       if(isUnmute || sub==='unmute'){
           if(!groupData[targetJid]) return reply(`֎ ${targetName} is not muted`);
           delete groupData[targetJid];
           saveMutedDb(db);
           await sock.sendMessage(chatId,{
               text:`֎ @${targetJid.split('@')[0]} unmuted`,
               mentions:[targetJid]
           },{quoted:m});
           return;
       }

       // LIST
       if(sub==='list'){
           const list=Object.keys(groupData);
           if(!list.length) return reply('֎ No users are muted.');
           let text=`֎ *Muted Users*\n`;
           list.forEach((jid,i)=>{
               const info=groupData[jid];
               const timeLeft=formatTime(info.until-Date.now());
               text+=`${i+1}. @${jid.split('@')[0]} - ${timeLeft}\n`;
           });
           return reply(text,{mentions:list});
       }

       // CLEAR
       if(sub==='clear'){
           db[chatId]={};
           saveMutedDb(db);
           return reply('֎ All mutes cleared.');
       }

       // INFO
       if(sub==='info'){
           if(!groupData[targetJid]) return reply(`֎ ${targetName} is not muted.`);
           const info=groupData[targetJid];
           return reply(
`֎ *Mute Info*
❏ User : @${targetJid.split('@')[0]}
❏ Reason : ${info.reason}
❏ Time Left : ${formatTime(info.until-Date.now())}
❏ Muted By : @${info.mutedBy.split('@')[0]}`,
               {mentions:[targetJid,info.mutedBy]}
           );
       }

       // EXTEND
       if(sub==='extend'){
           if(!groupData[targetJid]) return reply('֎ User not muted.');
           const extraTime=parseTime(args[2]);
           if(!extraTime) return reply('֎ Usage:.muteuser extend @user 1h');
           groupData[targetJid].until+=extraTime;
           groupData[targetJid].duration+=extraTime;
           saveMutedDb(db);
           return reply(`֎ Extended mute for @${targetJid.split('@')[0]} by ${formatTime(extraTime)}`,{mentions:[targetJid]});
       }

       // REDUCE
       if(sub==='reduce'){
           if(!groupData[targetJid]) return reply('֎ User not muted.');
           const reduceTime=parseTime(args[2]);
           if(!reduceTime) return reply('֎ Usage:.muteuser reduce @user 10m');
           groupData[targetJid].until=Math.max(Date.now(),groupData[targetJid].until-reduceTime);
           groupData[targetJid].duration=Math.max(0,groupData[targetJid].duration-reduceTime);
           saveMutedDb(db);
           return reply(`֎ Reduced mute for @${targetJid.split('@')[0]} by ${formatTime(reduceTime)}`,{mentions:[targetJid]});
       }

       // REASON UPDATE
       if(sub==='reason'){
           if(!groupData[targetJid]) return reply('֎ User not muted.');
           const newReason=args.slice(2).join(' ')||'No reason';
           groupData[targetJid].reason=newReason;
           saveMutedDb(db);
           return reply(`֎ Updated reason for @${targetJid.split('@')[0]} to: ${newReason}`,{mentions:[targetJid]});
       }

       // SILENT MODE
       if(sub==='silent'){
           const mode=args[1]?.toLowerCase();
           if(!db[chatId].settings) db[chatId].settings={};
           db[chatId].settings.silent=mode==='on';
           saveMutedDb(db);
           return reply(`֎ Silent delete ${mode.toUpperCase()}.`);
       }

       // NOTIFY MODE
       if(sub==='notify'){
           const mode=args[1]?.toLowerCase();
           if(!db[chatId].settings) db[chatId].settings={};
           db[chatId].settings.notify=mode==='on';
           saveMutedDb(db);
           return reply(`֎ Notify on delete ${mode.toUpperCase()}.`);
       }

       // LOG MODE
       if(sub==='log'){
           const mode=args[1]?.toLowerCase();
           if(!db[chatId].settings) db[chatId].settings={};
           db[chatId].settings.log=mode==='on';
           saveMutedDb(db);
           return reply(`֎ Log system ${mode.toUpperCase()}.`);
       }

       // VALIDATION
       if(targetJid===sender) return reply('֎ Cannot mute yourself');
       if(targetJid===meta.owner) return reply('֎ Cannot mute group owner');
       if(isTargetAdmin &&!isBotAdmin) return reply('֎ Cannot mute admin');
       if(isTargetAdmin &&!isAdmin) return reply('֎ Only admins can mute admins');

       // TIME & REASON
       let timeMs=null;
       const timeArg=args.find(a=>/^\d+(s|m|h|d|w|mo)$/i.test(a));
       if(timeArg) timeMs=parseTime(timeArg);
       if(!timeMs) timeMs=isAdmin?3600000:600000;

       const reason=args.filter(a=>!a.includes('@') &&!a.match(/^\d+(s|m|h|d|w|mo)$/i)).join(' ')||'No reason';
       const until=Date.now()+timeMs;

       groupData[targetJid]={
           mutedBy:sender,
           reason,
           time:Date.now(),
           until,
           duration:timeMs
       };
       saveMutedDb(db);

       // AUTO UNMUTE
       setTimeout(async()=>{
           const db=getMutedDb();
           if(db[chatId]?.[targetJid]){
               delete db[chatId][targetJid];
               saveMutedDb(db);
               await sock.sendMessage(chatId,{
                   text:`֎ @${targetJid.split('@')[0]} auto unmuted`,
                   mentions:[targetJid]
               }).catch(()=>{});
           }
       },timeMs);

       // SUCCESS
       await sock.sendMessage(chatId,{
           text:`_*֎ USER MUTED*_\n\n✦ Target: @${targetJid.split('@')[0]}\n✐ Reason: ${reason}\nⓘ Duration: ${formatTime(timeMs)}`,
           mentions:[targetJid]
       },{quoted:m});
   }
};

/* ================= MESSAGE DELETE HANDLER ================= */
module.exports.handleMutedMessage=async(sock,m,isGroup)=>{
   if(!isGroup) return false;

   const db=getMutedDb();
   const chatId=m.chat;
   const sender=m.sender;
   const groupData=db[chatId];

   if(!groupData?.[sender]) return false;

   const muteInfo=groupData[sender];
   if(Date.now()>muteInfo.until){
       delete groupData[sender];
       saveMutedDb(db);
       return false;
   }

   try{
       await sock.sendMessage(chatId,{delete:m.key}).catch(()=>{});

       const settings=groupData.settings||{};
       if(settings.notify &&!settings.silent){
           await sock.sendMessage(chatId,{
               text:`֎ @${sender.split('@')[0]} message deleted. Still muted.`,
               mentions:[sender]
           }).catch(()=>{});
       }

       if(settings.log){
           console.log(`[XDN MUTE] Deleted message from ${sender}`);
       }

       return true;
   }catch(err){
       console.log('[MUTE DELETE ERROR]',err.message);
       return false;
   }
};

module.exports.isMuted=(chatId,userId)=>{
   const db=getMutedDb();
   return!!db[chatId]?.[userId];
};

module.exports.getMuteInfo=(chatId,userId)=>{
   const db=getMutedDb();
   return db[chatId]?.[userId]||null;
};