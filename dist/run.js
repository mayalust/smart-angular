#!/usr/bin/env node
const smartAngular = require(`./index`),
{ init } = require(`./index`);
function getString(str){
  let stringExp = /\"?(\w+)\"?/g,
    match = stringExp.exec(str);
  return match ? match[1] : null;
}
let arguments = process.argv.slice(2).map(getString),
  command = arguments.shift(),
  name = arguments.shift(),
  fns = {
    pack( ){
      smartAngular.apply( null, arguments );
    },
    init( ){
      init.apply( null, arguments )
    }
  },
  fn = fns[command];
typeof fn === "function" ? fn.apply(null, [ name, ...arguments ]) : null;
//fns["pack"]("test", "test", "controller", "config");