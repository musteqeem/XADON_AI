const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'green',alias:[],category:'Media-Modifier',desc:'Tint an image green',usage:'.green (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .green');
    let image=sharp(input);
    image=image.tint('#39a852');
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ green complete'},{quoted:m});
  }catch(e){console.error('[green]',e);return reply(`Image processing failed: ${e.message}`)}
}};
