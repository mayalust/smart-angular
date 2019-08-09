const workPath = getWorkPath(__filename),
  {
    js
  } = require("js-beautify"),
  createModuleMap = require("./moduleMap.js"),
  pathLib = require("path"),
  loaderUtils = require("loader-utils"),
  {
    ultils
  } = require("ps-angular-loader"),
  {
    parse
  } = require("querystring"),
  {
    genRequest
  } = ultils;

function getWorkPath(path) {
  let match = new RegExp("(.*)(?:\\\\|\\/)[^\\/]+$").exec(path);
  if (match == null) {
    throw new Error("__workPath is invalid!");
  }
  return match[1];
}

function loader() {
  let callback = this.async(),
    {
      resourceQuery
    } = this,
    {
      exclude
    } = loaderUtils.getOptions(this),
    query = parse(resourceQuery.slice(1)),
    {
      factory,
      path,
      file
    } = query,
    loader = new LoaderMake(factory, path, file);
  loader.getScript().then(script => {
    callback(null, script);
  });
}
class LoaderMake {
  constructor(factory, path, file) {
    let moduleMap = createModuleMap();
    this.factory = factory;
    this.path = path;
    this.file = file;
    this.moduleLoaded = moduleMap
      .init(factory, path, file)
      .then(moduleList => Promise.resolve(moduleList[0]));
  }
  getDeps() {
    return this.moduleLoaded.then(module => Promise.resolve(module.deps));
  }
  getHead() {
    return [
      `import { render } from ${genRequest.call(
        this,
        [pathLib.resolve(workPath, "./angular-loader.js")],
        {
          id : Math.round(Math.random() * 10000000)
        },
        false
      )}`,
      `var handlers = []`
    ];
  }
  getContent() {
    return this.getBody().then(body => {
      let contents = this.getHead();
      contents = contents.concat(body);
      contents = contents.concat(this.getTail());
      contents = contents.concat(this.getEnd());
      return Promise.resolve(contents);
    });
  }
  getScript() {
    return this.getContent().then(content => {
      return js(content.join("\n"));
    });
  }
  getBody() {
    return this.getDeps().then(deps => {
      let rs = deps.filter(({
        basename,
        ext
      }) => {
        if (this.file == null) {
          return true;
        }
        return this.file == basename;
      }).map(({
        path,
        ext
      }) => {
        if (this.path == "controller.config") {
          return this.renderConfig(path);
        }
        if (this.path == "template") {
          return this.renderTemplate(path);
        }
        if (new RegExp("css|less|scss|sass").test(ext)) {
          return this.renderCss(path);
        }
        /* if (this.file != null) {
          return this.renderSingle(path);
        } */
        return this.renderTxt(path);
      });
      return Promise.resolve(rs);
    });
  }
  getTail() {
    return this.file == null ? [`var renderAll = render(handlers, true)`] : [`var renderAll = handlers[0]`];
  }
  getEnd() {
    return [
      `typeof psdefine === "function" && psdefine(function(){
      return renderAll 
    })`
    ];
  }
  renderTemplate(path) {
    return `require(${genRequest.call(
      this,
      [pathLib.resolve(workPath, "./template-extractor.js"), path],
      null,
      true
    )})`;
  }
  renderTxt(path) {
    return `handlers.push(require(${genRequest.call(
      this,
      [path],
      null,
      false
    )}).default)`;
  }
  renderConfig(path) {
    let arr = path.split(new RegExp("[\\\/]")),
      last = arr.pop(),
      paths = last.split(".");
    return `handlers.push(require(${genRequest.call(
      this,
      [pathLib.resolve(workPath, "./ctrl-template-extractor.js"), path],
      {
        factory: this.factory,
        path: paths[1],
        file: paths[0]
      },
      true
    )}).default)`;
  }
  renderCss(path) {
    return `require(${genRequest.call(this, [path], null, false)})`;
  }
}
module.exports = d => d;
module.exports.pitch = loader;
module.exports.Loader = LoaderMake;