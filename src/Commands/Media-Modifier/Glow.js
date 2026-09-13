const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'glow',alias:[],category:'Media-Modifier',desc:'Apply a soft glow effect',usage:'.glow (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .glow');
    let image=sharp(input);
    image=image.blur(2).composite([{input:await image.clone().modulate({brightness:1.12}).png().toBuffer(),blend:'screen'}]);
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ glow complete'},{quoted:m});
  }catch(e){console.error('[glow]',e);return reply(`Image processing failed: ${e.message}`)}
}};
