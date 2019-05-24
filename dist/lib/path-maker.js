const filePath = process.cwd(),
    {
        isObject
    } = require("ps-ultility"),
    pathLib = require("path");

function toString(obj) {
    if (obj == null) {
        return;
    }
    if (typeof obj == "object") {
        return JSON.stringify(obj);
    }
    return obj + "";
}
class PathMaker {
    constructor(url, query) {
        this.url = pathLib.resolve(filePath, url)
        this.query = query;
    }
    getQueryString() {
        let arr = [],
            {
                query
            } = this;
        for (var i in query) {
            arr.push(`${i}${query[i] != null ? `=${encodeURIComponent(toString(query[i]))}` : ``}`);
        };
        return arr.join("&");
    }
    getPath() {
        return this.url + "?" + this.getQueryString();
    }
}
module.exports = PathMaker;