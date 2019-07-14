#!/usr/bin/env node

const {
  pack
} = require(`./index`),
  initHandler = require(`./lib/init`), {
    init,
    controller,
    directive,
    service
  } = initHandler;
let arguments = process.argv.slice(2),
  command = arguments.shift(),
  fns = {
    pack() {
      pack.apply(null, arguments);
    },
    init() {
      init.apply(null, arguments);
    },
    controller() {
      controller.apply(null, arguments);
    },
    directive() {
      directive.apply(null, arguments);
    },
    service() {
      service.apply(null, arguments);
    }
  },
  fn = fns[command];
typeof fn === "function" ? fn.apply(null, arguments) : null;