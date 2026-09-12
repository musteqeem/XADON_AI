const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'pixel',alias:[],category:'Media-Modifier',desc:'Pixelate an image',usage:'.pixel (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .pixel');
    let image=sharp(input);
    {const meta=await image.metadata();const w=Math.max(16,Math.floor((meta.width||512)/24));const h=Math.max(16,Math.floor((meta.height||512)/24));image=image.resize(w,h,{kernel:'nearest'}).resize(meta.width||512,meta.height||512,{kernel:'nearest'});}
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ pixel complete'},{quoted:m});
  }catch(e){console.error('[pixel]',e);return reply(`Image processing failed: ${e.message}`)}
}};
