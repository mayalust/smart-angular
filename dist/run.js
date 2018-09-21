#!/usr/bin/env node
const smartAngular = require(`./index`);
let sangular = smartAngular.run;
sangular.use = smartAngular.use;
function getString(str){
  let stringExp = /\"?(\w+)\"?/g,
    match = stringExp.exec(str);
  return match ? match[1] : null;
}
let arguments = process.argv.slice(2),
  command = getString(arguments[0]) || `pack`,
  name = getString(arguments[1]) ||  `core`;
smartAngular.run(command, name);
return sangular;