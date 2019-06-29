class Asset {
  constructor() {
    this.assetsMap = new Map();
  }
  add(id, dt) {
    this.assetsMap.set(id, dt);
  }
  get(id) {
    return this.assetsMap.get(id)
  }
}

function getAssetInstance() {
  let instance;
  return function () {
    if (instance == null) {
      instance = new Asset();
    }
    return instance;
  };
}
module.exports = getAssetInstance();