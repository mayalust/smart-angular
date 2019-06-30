const psFile = require("ps-file");
const workPath = process.cwd();
const pathLib = require("path");
const {
  isArray
} = require("ps-ultility");
class FileStates {
  constructor() {
    this.filesMap = new Map();
  }
  set(id, file) {
    let st = this.filesMap.get(id);
    if (st == null) {
      this.filesMap.set(id, new State(id, file));
      st = this.filesMap.get(id);
    }
    st.setModifyTime(file.modifytime - 0)
  }
  clear() {
    this.filesMap = new Map();
  }
  findFile(factory, path, file) {
    let id = pathLib.resolve(workPath, `./${factory}/${path}/${file}.${path}`),
      data = this.filesMap.get(id);
    return this.filesMap.get(data);
  }
  setGroup(files) {
    files.forEach(file => {
      this.set(file.path, file);
    });
  }
  get(id) {
    return this.filesMap.get(id);
  }
  isModified(ids) {
    ids = isArray(ids) ? ids : [ids];
    return ids.some(id => {
      let st = this.get(id);
      return st.isModified;
    });
  }
}
class State {
  constructor(id, file) {
    this.id = id;
    this.file = file;
    this.oldModifyTime = this.modifyTime = null;
  }
  setModifyTime(modifyTime) {
    this.oldModifyTime = this.modifyTime;
    this.modifyTime = modifyTime;
  }
}
Object.defineProperty(State.prototype, "isModified", {
  get() {
    if (this.modifyTime) {
      return this.oldModifyTime != this.modifyTime;
    }
    return false;
  }
});

function getFileStateInstance() {
  let instance;
  return function () {
    if (instance == null) {
      instance = new FileStates();
    }
    return instance;
  };
}
module.exports = getFileStateInstance();