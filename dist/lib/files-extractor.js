const { ultils, explainers, template } = require("ps-angular-loader"),
  { isArray, isFunction, getFilePath } = require("ps-ultility"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  loaderUtils = require('loader-utils'),
  { parse } = require("querystring"),
  pathLib = require("path"),
  filetree = require("ps-filetree"),
  isPlainObj = obj => typeof obj === "object" && obj !== null,
  { genRequest, mergeCode } = ultils;
module.exports = d => d;
module.exports.pitch = function(remainRequest){
  let callback = this.async(),
    { resourceQuery } = this,
    { exclude } = loaderUtils.getOptions(this),
    query = parse(resourceQuery.slice(1)),
    { smartangular, type, pack, name } = query,
    keys = explainers.keys(),
    output = [`import { render } from "-!${remainRequest}"`],
    ins = filetree(pathLib.resolve(workpath, "./ps-core"));
  function recersive(node, callback){
    let item, queue = isPlainObj(node) ? [node] : [];
    while( item = queue.shift() ){
      isFunction(callback) && callback(item);
      if(isArray(item.children)){
        [].push.apply(queue, item.children)
      }
    }
  }
  function getFileName(path) {
    let match = /(?:\\|\/)([^\\\/\.]+)\.(?:[^\.]+)$/.exec(path);
    return match ? match[1] : ""
  }
  function isStyle( str ){
    return /(?:less)|(?:css)|(?:sass)|(?:scss)/.test(str);
  }
  output.push(`let handlers = []`);
  ins.on("start", root => {
    let node = root.children.find( d => {
      return new RegExp( type + "s?", "g").test( d.path );
    });
    recersive(node, node => {
      if( exclude.some( d => d.test(node.abspath)) ){ return; }
      let __type = node.ext.slice(1), filename = getFileName(node.abspath);
      if( type === "style") {
        if ( isStyle( __type ) ){
          output.push(`require(${genRequest.call( this, [ node.abspath ], null, false )})`);
        }
      } else if( type === __type ){
        if( type === "template" ) {
          output.push(`require(${genRequest.call( this, [ pathLib.resolve(filepath, './template-extractor'), node.abspath ], null, true )})`)
        } else {
          output.push(`handlers.push(require(${genRequest.call( this, [ node.abspath ], null, false )}).default)`);
        }
      }
    });
    if(type !== "template" && type !== "style"){
      output.push(`let renderAll = render(handlers)`);
      output.push(`window["ps-${pack}"] = window["ps-${pack}"] || {}`);
      output.push(`window["ps-${pack}"]["${type}"] = renderAll`);
    };
    callback(null, output.join(";\n"));
  });
}