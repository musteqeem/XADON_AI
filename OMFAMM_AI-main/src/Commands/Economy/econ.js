const commands=['bank','daily','market','product','crypto','currency'];
module.exports={name:'econ',alias:['economy'],category:'Economy',desc:'Show the economy command hub and available tools',usage:'.econ',execute:async(sock,m,{reply})=>reply(`💰 *ECONOMY HUB*\\n\\n${commands.map((x,i)=>`${i+1}. .${x}`).join('\\n')}\\n\\nUse .bank/.daily/.market/.product/.crypto/.currency for details.`)};
