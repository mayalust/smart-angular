#!/usr/bin/env node
const smartAngular = require(`./index`),
{ init } = require(`./index`);
let arguments = process.argv.slice(2),
  command = arguments.shift(),
  fns = {
    pack( ){
      smartAngular.apply( null, arguments );
    },
    init( ){
      init.apply( null, arguments )
    }
  },
  fn = fns[command];
typeof fn === "function" ? fn.apply( null, arguments ) : null;
//fns["pack"]("test", "production");