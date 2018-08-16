var deps = {};
deps["name"] = "solution"
deps["tools"] = {}
deps["tools"]["controller"] = [];
deps["tools"]["controller"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/controllers/index.controller"));
deps["tools"]["service"] = [];
deps["tools"]["service"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/services/my-ser.service"));
deps["tools"]["filter"] = [];
deps["tools"]["filter"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/filters/filtersort.filter"));
deps["tools"]["filter"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/filters/my-fil.filter"));
deps["tools"]["directive"] = [];
deps["tools"]["directive"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/directives/my-dir.directive"));
deps["tools"]["directive"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/directives/my-table.directive"));
deps["tools"]["directive"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/directives/ps-input.directive"));
deps["tools"]["style"] = [];
deps["tools"]["style"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-solution/styles/index.less"));
module.exports = deps;