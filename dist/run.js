#!/usr/bin/env node
const fn = require(`./index`);
function getString(str){
  let stringExp = /\"?(\w+)\"?/g,
    match = stringExp.exec(str);
  return match ? match[1] : null;
}
let arguments = process.argv.slice(2),
  command = getString(arguments[0]) || `pack`,
  name = getString(arguments[1]) ||  `core`;
  console.log(command, name);
fn(command, name);