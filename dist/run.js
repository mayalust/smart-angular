#!/usr/bin/env node
const smartAngular = require(`./lib/old/index`),
  initHandler = require(`./lib/old/index`),
  { init, controller, directive, service } = initHandler;
let arguments = process.argv.slice(2),
  command = arguments.shift(),
  fns = {
    pack( ){
      smartAngular.apply( null, arguments );
    },
    init( ){
      init.apply( null, arguments );
    },
    controller( ){
      controller.apply( null, arguments );
    },
    directive( ){
      directive.apply( null, arguments );
    },
    service( ){
      service.apply( null, arguments );
    }
  },
  fn = fns[command];
typeof fn === "function" ? fn.apply( null, arguments ) : null;