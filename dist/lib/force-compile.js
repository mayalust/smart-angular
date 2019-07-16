class ForceCompile {
  constructor() {
    this.forceCompile = false;
    this.developMode = "development";
  }
  turnOn() {
    this.forceCompile = true;
  }
  turnOff() {
    this.forceCompile = false;
  }
  value() {
    return this.forceCompile;
  }
  setMode(mode) {
    this.developMode = mode;
  }
  getDevelopMode() {
    return this.developMode;
  }
}

function ForceCompileIns() {
  let instance;
  return function () {
    if (instance == null) {
      instance = new ForceCompile();
    }
    return instance;
  };
}
module.exports = ForceCompileIns();