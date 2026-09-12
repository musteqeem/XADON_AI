const target=require('./npmpack');
module.exports={...target,name:'npm',alias:[target.name],usage:'.npm <input>'};
