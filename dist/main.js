(function (graph) {
    function require(module) {
        function localRequire(relativePath) {
            return require(graph[module].dependencies[relativePath])
        }
        var exports = {};
        (function (require, exports, code) {
            eval(code)
        })(localRequire, exports, graph[module].code)
        return exports;
    }
    require('./src/index.js')
})({
    "./src/index.js": {
        "dependencies": {
            "./expo.js": "./src\\expo.js"
        },
        "code": "\"use strict\";\n\nvar _expo = require(\"./expo.js\");\n\nconsole.log('hello webpack');\nvar res = (0, _expo.add)(1, 2);\nconsole.log(res);"
    },
    "./src\\expo.js": {
        "dependencies": {},
        "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.minus = exports.add = void 0;\n\nvar add = function add(a, b) {\n  return a + b;\n};\n\nexports.add = add;\n\nvar minus = function minus(a, b) {\n  return a - b;\n};\n\nexports.minus = minus;"
    }
})