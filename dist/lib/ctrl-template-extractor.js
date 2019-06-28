const {
  getFileName,
  unCamelhill
} = require("ps-ultility"),
  getFileStateInstance = require("./file-state.js"),
  log = require('proudsmart-log')(true), dics = {
    dir: "directive",
    ser: "service"
  },
  extsDics = {
    directive: "js|css",
    service: "js"
  }

function makeParam(str) {
  let arr = str.split("/").filter(d => d);
  return arr.length > 0 ? `/${ arr.join("/") }` : "";
}

function splitName(str) {
  if (typeof str === "undefined") {
    return;
  }
  let a = str.split("."),
    name = a[0],
    type = dics[a[1]] || a[1] || "directive",
    ext = extsDics[type];
  return `${type}/${unCamelhill( name )}.${ext}`
}
class MakeDeps {
  constructor(source) {
    this.source = source;
    this.fileState = getFileStateInstance();
    this.deps = new Set;
  }
  getDeps(source) {
    let configBlock = selectBlock(source, "config"),
      config = configBlock.attributes,
      deps = config.deps.filter(d => {
        if (this.deps.has(d)) {
          return;
        }
        this.deps.add(d);
        return true;
      });
    return deps;
  }
  init(callback) {
    let depsMap = this.deps,
      gen = loadFile(this.getDeps(this.source)),
      readFile = depsName => {
        let depName = splitName(depsName),
          fd = this.fileState.findFile(depName);
        if (fd) {
          fd.read().then(d => {
            gen.next(this.getDeps(d));
          })
        } else {
          console.error(`${depName} is not found`);
          gen.next();
        }
      }

    function* loadFile(queue) {
      let item;
      while (item = queue.shift()) {
        [].push.apply(queue, yield readFile(item))
      }
      callback(Array.from(depsMap));
    }
  }
}

function getConfig(source) {
  let {
    resourceQuery
  } = this, callback = this.async(),
    query = parse(resourceQuery.slice(1)), {
      pack
    } = query,
    name = getFileName(this.resourcePath),
    param = makeParam(config.params || config.param || ""),
    makeDeps = new MakeDeps(source);
  makeDeps.init(d => {
    callback(null, `export default function(){
      return {
        type : "router",
        loaderpath : ["${d.join("\",\"")}"],
        router : "/${ name }${ param }",
        ctrlname : "${ name }"
      }
    }`)
  })
}
module.exports = getConfig;