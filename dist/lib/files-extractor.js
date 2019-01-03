const { ultils, explainers, template } = require("ps-angular-loader"),
  { isArray, isFunction, getFilePath } = require("ps-ultility"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  { parse } = require("querystring"),
  pathLib = require("path"),
  filetree = require("ps-filetree"),
  { genRequest, mergeCode } = ultils;
module.exports = d => d;
module.exports.pitch = function(remainRequest){
  let callback = this.async(),
    { resourceQuery } = this,
    exclude = [/\.test/, /([\\\/])exclude\1/],
    query = parse(resourceQuery.slice(1)),
    { smartangular, type, pack } = query,
    keys = explainers.keys(),
    name = query.pack,
    output = [`import { render } from "-!${remainRequest}"`],
    ins = filetree(pathLib.resolve(workpath, "./ps-core"));
  function recersive(node, callback){
    let item, queue = [node];
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
  output.push(`let handlers = []`);
  ins.on("start", root => {
    recersive(root, node => {
      if( exclude.some( d => d.test(node.abspath)) ){ return; }
      let __type = node.ext.slice(1), filename = getFileName(node.abspath);
      if( type === __type ){
        if( type === "template" ) {
          output.push(`require(${genRequest.call( this, [ pathLib.resolve(filepath, './template-extractor'), node.abspath ], null, true )})`)
        } else {
          output.push(`handlers.push(require(${genRequest.call( this, [ node.abspath ], null, false )}).default)`);
        }
      }
    });
    if(type !== "template"){
      output.push(`let renderAll = render(handlers)`);
      output.push(`window["ps-${pack}"] = window["ps-${pack}"] || {}`);
      output.push(`window["ps-${pack}"]["${type}"] = renderAll`);
    };
    callback(null, output.join(";\n"));
  });
}