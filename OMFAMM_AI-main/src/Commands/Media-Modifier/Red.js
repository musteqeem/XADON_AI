const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'red',alias:[],category:'Media-Modifier',desc:'Tint an image red',usage:'.red (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .red');
    let image=sharp(input);
    image=image.tint('#d93025');
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ red complete'},{quoted:m});
  }catch(e){console.error('[red]',e);return reply(`Image processing failed: ${e.message}`)}
}};
