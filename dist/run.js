#!/usr/bin/env node
const compiler = require("./compiler"),
  developer = require("./developer");
let arguments = process.argv.slice(2),
  command = arguments[0] || "pack",
  name = arguments[1] || "core";
switch(command){
  case "pack":
    compiler.run(name);
    break;
  case "init":
    compiler.init(name);
    break
  case "dev":
    developer();
    break;
  default :
    break;
}