const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'invert',alias:[],category:'Media-Modifier',desc:'Invert image colors',usage:'.invert (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .invert');
    let image=sharp(input);
    image=image.negate();
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ invert complete'},{quoted:m});
  }catch(e){console.error('[invert]',e);return reply(`Image processing failed: ${e.message}`)}
}};
