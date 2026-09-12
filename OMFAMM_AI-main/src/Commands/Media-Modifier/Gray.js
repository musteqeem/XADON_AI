const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'gray',alias:[],category:'Media-Modifier',desc:'Convert an image to grayscale',usage:'.gray (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .gray');
    let image=sharp(input);
    image=image.grayscale();
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ gray complete'},{quoted:m});
  }catch(e){console.error('[gray]',e);return reply(`Image processing failed: ${e.message}`)}
}};
