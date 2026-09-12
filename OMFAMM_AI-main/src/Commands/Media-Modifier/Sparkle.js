const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'sparkle',alias:[],category:'Media-Modifier',desc:'Add a soft sparkle-like enhancement',usage:'.sparkle (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .sparkle');
    let image=sharp(input);
    image=image.modulate({brightness:1.08,saturation:1.18});
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ sparkle complete'},{quoted:m});
  }catch(e){console.error('[sparkle]',e);return reply(`Image processing failed: ${e.message}`)}
}};
