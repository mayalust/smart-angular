#!/usr/bin/env node
const smartAngular = require(`./index`);
function getString(str){
  let stringExp = /\"?(\w+)\"?/g,
    match = stringExp.exec(str);
  return match ? match[1] : null;
}
let arguments = process.argv.slice(2),
  command = getString(arguments[0]) || `pack`,
  name = getString(arguments[1]) ||  `core`,
  fns = {
    pack : function(){
      smartAngular(name);
    }
  },
  fn = fns[command];
typeof fn === "function" ? fn(name) : null;