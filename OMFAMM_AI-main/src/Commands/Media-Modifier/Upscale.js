const sharp=require('sharp');
const { downloadMediaMessage }=require('@musteqeem/baileys');
async function getImage(m){
  const msg=m?.message?.imageMessage || m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  if(!msg) return null;
  return downloadMediaMessage({message:{imageMessage:msg}},'buffer',{}, {logger:console});
}
module.exports={name:'upscale',alias:[],category:'Media-Modifier',desc:'Upscale an image with high-quality interpolation',usage:'.upscale (reply to an image)',execute:async(sock,m,{reply})=>{
  try{
    const input=await getImage(m);
    if(!input)return reply('🖼️ Reply to an image with .upscale');
    let image=sharp(input);
    {const meta=await image.metadata();image=image.resize({width:Math.min(2048,Math.max(meta.width||512,1024)),height:undefined,fit:'inside',withoutEnlargement:false,kernel:'lanczos3'});}
    const out=await image.jpeg({quality:90}).toBuffer();
    return sock.sendMessage(m.chat,{image:out,caption:'✨ upscale complete'},{quoted:m});
  }catch(e){console.error('[upscale]',e);return reply(`Image processing failed: ${e.message}`)}
}};
