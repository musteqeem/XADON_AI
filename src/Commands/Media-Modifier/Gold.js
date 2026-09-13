const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'gold',alias:[],category:'Media-Modifier',desc:'Apply a warm gold tint',usage:'.gold (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .gold');
    let image=sharp(input);
    image=image.tint('#d4af37');
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ gold complete'},{quoted:m});
  }catch(e){console.error('[gold]',e);return reply(`Image processing failed: ${e.message}`)}
}};
