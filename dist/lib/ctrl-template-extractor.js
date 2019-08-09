const {
  getFileName,
  unCamelhill
} = require("ps-ultility"), {
    parse
  } = require("querystring"), {
    selectBlock
  } = require("ps-angular-loader/lib/select"),
  getFileStateInstance = require("./file-state.js"),
  loadFiles = loadFilesIns(),
  log = require("proudsmart-log")(true),
  pathLib = require("path"),
  dics = {
    dir: "directive",
    ser: "service"
  },
  psfile = require("ps-file"),
  extsDics = {
    directive: "js|css",
    service: "js"
  };

function makeParam(str) {
  let arr = str.split("/").filter(d => d);
  return arr.length > 0 ? `/${arr.join("/")}` : "";
}

function splitName(str) {
  if (typeof str === "undefined") {
    return;
  }
  let a = str.split("."),
    name = a[0],
    type = dics[a[1]] || a[1] || "directive",
    ext = extsDics[type];
  return {
    path: type,
    file: unCamelhill(name),
    ext: ext
  };
}

function loadFilesIns() {
  let files = {};
  return function (factory) {
    files[factory] =
      files[factory] ||
      psfile(pathLib.resolve(factory)).children(node => {
        return node.ext === "directive" || node.ext === "service";
      });
    return files[factory];
  };
}
class MakeDeps {
  constructor(factory, source) {
    this.factory = factory;
    this.source = source;
    this.fileState = getFileStateInstance();
    this.deps = new Set();
    this.loadFiles = loadFiles(this.factory);
  }
  getDeps(source) {
    let configBlock = selectBlock(source, "config"),
      config = configBlock && configBlock.attributes,
      deps =
      config &&
      config.deps &&
      config.deps.split(",").filter(d => {
        if (this.deps.has(d)) {
          return;
        }
        return true;
      });
    return typeof deps == "object" ? deps : null;
  }
  init(callback) {
    this.loadFiles.then(files => {
      let depsMap = this.deps,
        gen = loadFile(this.getDeps(this.source)),
        readFile = depsName => {
          let {
            path,
            file
          } = splitName(depsName),
            fd = files.find(f => {
              return f.path.indexOf(`${file}.${path}`) != -1;
            });
          if (depsMap.has(`./${path}/${file}.js|css`)) {
            console.error(`${depsName} is duplicated, should be negelect!`);
            setTimeout(() => {
              gen.next();
            });
            return;
          }
          if (!fd) {
            console.error(`${depsName} is not found!`);
            setTimeout(() => {
              gen.next();
            });
            return;
          }
          depsMap.add(`./${path}/${file}.js|css`);
          //depsMap.add("./" + this.factory + "/" + fd.path.split(this.factory + "/")[1]);
          fd.read().then(d => {
            d = d.toString();
            gen.next(this.getDeps(d));
          });
        };
      gen.next();

      function* loadFile(queue) {
        if (queue == null) {
          callback([]);
          return;
        }
        let item;
        while ((item = queue.shift())) {
          [].push.apply(queue, yield readFile(item));
        }
        callback(Array.from(depsMap));
        return;
      }
    });
  }
}

function getConfig(source) {
  let {
    resourceQuery
  } = this,
  callback = this.async(),
    query = parse(resourceQuery.slice(1)),
    name = getFileName(this.resourcePath),
    configBlock = selectBlock(source, "config"),
    config = configBlock.attributes,
    param = makeParam(config.params || config.param || ""),
    makeDeps = new MakeDeps(query.factory, source),
    current = [`${query.path}/${query.file}.js|css`];
  makeDeps.init(d => {
    let obj = `export default function(){
      return {
        type : "router",
        loaderpath : ["${current.concat(d).join('","')}"],
        router : "/${name}${param}",
        ctrlname : "${name}"
      }
    }`;
    callback(null, obj);
  });
}
module.exports = getConfig;