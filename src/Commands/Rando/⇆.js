const axios=require('axios');
const ENDPOINTS={dog:'dog',car:'car',animesfw:'anhsfw'};
module.exports=Object.entries(ENDPOINTS).map(([name,endpoint])=>({
  name, alias:name==='dog'?['doggo']:name==='car'?['auto']:['asfw'],
  category:'Rando', desc:`Get a random ${name} image`, usage:`.${name}`,
  execute:async(sock,m,{reply})=>{
    try{
      const {data,headers}=await axios.get(`https://api.zenzxz.my.id/image/${endpoint}`,{responseType:'arraybuffer',timeout:20000});
      if(!data?.length||!(headers['content-type']||'').includes('image')) return reply('Image service returned an invalid response.');
      return sock.sendMessage(m.chat,{image:Buffer.from(data),caption:`🎲 Random ${name} image`},{quoted:m});
    }catch(e){return reply(`Random image failed: ${e.message}`)}
  }
}));
