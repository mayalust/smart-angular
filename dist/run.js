#!/usr/bin/env node
const fn = require("./index");
let arguments = process.argv.slice(2),
  command = arguments[0] || "pack",
  name = arguments[1] || "core";
fn(command, name);