const workPath = getWorkPath(__filename),
  {
    js
  } = require("js-beautify"),
  createModuleMap = require("./moduleMap.js"),
  pathLib = require("path"),
  loaderUtils = require('loader-utils'),
  {
    ultils
  } = require("ps-angular-loader"),
  {
    genRequest
  } = ultils;

function getWorkPath(path) {
  let match = new RegExp("(.*)(?:\\\\|\\/)[^\\\/]+$").exec(path);
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
    loader = new Loader(factory, path, file);
  return loader.getScript();
}
class LoaderMake {
  constructor(factory, path, file) {
    let moduleMap = createModuleMap();
    this.factory = factory;
    this.path = path;
    this.file = file;
    this.moduleLoaded = moduleMap.init(factory, path, file).then(moduleList => Promise.resolve(moduleList[0]));
  }
  getDeps() {
    return this.moduleLoaded.then(module => Promise.resolve(module.deps));
  }
  getHead() {
    return [`import { render } from ${genRequest.call( this, [ pathLib.resolve(workPath, './angular-loader.js') ], {}, false )}`,
      `var handlers = []`
    ]
  }
  getContent() {
    return this.getBody().then(body => {
      let contents = this.getHead()
      contents = contents.concat(body);
      contents = contents.concat(this.getTail());
      contents = contents.concat(this.getEnd());
      return Promise.resolve(contents);
    })
  }
  getScript() {
    return this.getContent().then(content => {
      return js(content.join("\n"));
    })
  }
  getBody() {
    return this.getDeps().then(deps => {
      let rs = deps.map(({
        path,
        ext
      }) => {
        let text;
        if (new RegExp("css|less|scss|sass").test(ext)) {
          text = this.renderCss(path);
        } else {
          text = this.renderTxt(path);
        }
        return text;
      });
      return Promise.resolve(rs);
    });
  }
  getTail() {
    return [`var renderAll = render(handlers, true)`];
  }
  getEnd() {
    return [`typeof psdefine === "function" && psdefine(function(){
      return renderAll 
    })`]
  }
  renderTxt(path) {
    return `handlers.push(require(${genRequest.call( this, [ path ], null, false )}).default)`;
  }
  renderConfig(path) {
    return `handlers.push(require(${genRequest.call( this, [ pathLib.resolve(filepath, './ctrl-template-extractor.js'), path ], query, true )}).default)`;
  }
  renderCss(path) {
    return `require(${genRequest.call( this, [ path ], null, false )})`;
  }
}
module.exports = loader;
module.exports.Loader = LoaderMake;