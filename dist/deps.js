var deps = {};
deps["name"] = "core"
deps["tools"] = {}
deps["tools"]["component"] = [];
deps["tools"]["component"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/components/c-test.component"));
deps["tools"]["controller"] = [];
deps["tools"]["controller"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/controllers/index.controller"));
deps["tools"]["directive"] = [];
deps["tools"]["directive"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/directives/f-test.directive"));
deps["tools"]["directive"].push(require("/Users/leonlin/Linjingbin/smart-angular/ps-core/directives/free-board.directive"));
deps["tools"]["service"] = [];
deps["tools"]["filter"] = [];
deps["tools"]["style"] = [];
deps["comptree"] = {
    "name": "components",
    "abspath": "/Users/leonlin/Linjingbin/smart-angular/ps-core/components",
    "ext": "",
    "children": [{
        "name": "c-test",
        "abspath": "/Users/leonlin/Linjingbin/smart-angular/ps-core/components/c-test.component",
        "ext": ".component"
    }, {
        "name": "common",
        "abspath": "/Users/leonlin/Linjingbin/smart-angular/ps-core/components/common",
        "ext": ""
    }]
}
module.exports = deps;