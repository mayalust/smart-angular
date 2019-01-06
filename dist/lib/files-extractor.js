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
    keys = explainers.keys(),
    { resourceQuery } = this,
    { exclude } = loaderUtils.getOptions(this),
    query = parse(resourceQuery.slice(1)),
    { smartangular, type, pack, name, separate } = query,
    keys = explainers.keys(),
    output = [`import { render } from "-!${remainRequest}"`],
    ins = filetree(pathLib.resolve(workpath, "./ps-core"));
  function recursive(node, callback){
    let item, queue = isPlainObj(node) ? [node] : [], end;
    while( item = queue.shift() ){
      if( isFunction(callback) && callback(item) === true ) { return };
      isArray(item.children)
        ? [].push.apply(queue, item.children) : null;
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
    let node = root.children.find( d => new RegExp( type + "s?", "g").test( d.path ));
    recursive(node, node => {
      if( exclude.some( d => d.test(node.abspath)) ){ return; }
      let __type = node.ext.slice(1), filename = getFileName(node.abspath);
      if( type === "style") {
        if ( isStyle( __type ) ){
          output.push(`require(${genRequest.call( this, [ node.abspath ], null, false )})`);
        }
      } else if( type === __type ){
        if( type === "template" ) {
          output.push(`require(${genRequest.call( this, [ pathLib.resolve(filepath, './template-extractor'), node.abspath ], null, true )})`)
        } else if( type === "controller") {
          output.push(`handlers.push(require(${genRequest.call( this, [ pathLib.resolve(filepath, './ctrl-template-extractor'), node.abspath ], null, true )}).default)`)
        } else {
          output.push(`handlers.push(require(${genRequest.call( this, [ node.abspath ], null, false )}).default)`);
        }
      }
      return separate === filename;
    });
    if(type !== "template" && type !== "style"){
      output.push(`let renderAll = render(handlers)`);
      output.push(`typeof window !=="undefined" && typeof window["define"] ==="function" && window["define"](function(){ return renderAll })`)
    };
    callback(null, output.join(";\n"));
  });
}