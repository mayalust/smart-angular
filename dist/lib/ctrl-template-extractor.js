const { getFilePath,  getFileName} = require("ps-ultility"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pathLib = require("path"),
  { parse } = require("querystring"),
  { ultils, template } = require("ps-angular-loader"),
  { selectBlock } = require("ps-angular-loader/lib/select"),
  { genRequest, mergeCode } = ultils;
module.exports = function(source){
  function replaceAllReturn(str){
    const dics = "nrtf\"\'";
    let regex = [];
    for(let i = 0; i < dics.length; i++){
      regex.push("\\" + dics.charAt(i));
    }
    return str.replace(new RegExp(`((?:${regex.join(")|(?:")}))`, 'g'), str => {
      var inx = regex.findIndex( d => new RegExp(`^${d}$`).test(str));
      return `\\${dics[inx]}`;
    });
  }
  let name = getFileName( this.resourcePath ),
    config = selectBlock( source, "config" ),
    template = selectBlock( source, "template"),
    script = `export default function(){
    return {
      type : "router",
      template : "${ replaceAllReturn(template.innerHTML) }",
      loaderpath : "${`./ps-${"core"}/build/controller/${"core"}.${name}`}",
      router : "/${name}${ config.param ? "/" + config.param : "" }",
      ctrlname : "${name}"
    }
  }`;
  return script;
};