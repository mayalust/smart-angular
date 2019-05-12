const { getFilePath,  getFileName} = require("ps-ultility"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pathLib = require("path"),
  { parse } = require("querystring"),
  { ultils, template } = require("ps-angular-loader"),
  { genRequest, mergeCode } = ultils;
module.exports = function(source){
  let name = getFileName( this.resourcePath )
  template.add(name, source);
  return `export default { "template" : "${name}" }`;
};