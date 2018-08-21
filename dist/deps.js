var deps = {};
deps["name"] = "core"
deps["tools"] = {}
deps["tools"]["controller"] = [];
deps["tools"]["controller"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/controllers/index.controller"));
deps["tools"]["directive"] = [];
deps["tools"]["directive"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/directives/my-dir.directive"));
deps["tools"]["directive"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/directives/my-table.directive"));
deps["tools"]["service"] = [];
deps["tools"]["service"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/services/my-ser.service"));
deps["tools"]["filter"] = [];
deps["tools"]["filter"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/filters/filtersort.filter"));
deps["tools"]["filter"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/filters/my-fil.filter"));
module.exports = deps;