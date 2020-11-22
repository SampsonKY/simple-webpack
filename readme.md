## 什么是 webpack ?

> 本质上,webpack 是一个现代 JavaScript 应用程序的**静态模块打包器**(module bundler)。当 webpack 处理应用程序时,它会**递归地**构建一个**依赖关系图**(dependency graph)，其中包含应用程序需要的每个模块,然后将所有这些模块打包成一个或多个 bundle。
>
> webpack 就像一条生产线,要经过一系列处理流程后才能将源文件转换成输出结果。 这条生产线上的每个处理流程的职责都是单一的，多个流程之间有存在依赖关系，只有完成当前处理后才能交给下一个流程去处理。 插件就像是一个插入到生产线中的一个功能,在特定的时机对生产线上的资源做处理。
> webpack 通过 Tapable 来组织这条复杂的生产线。 webpack 在运行过程中会广播事件，插件只需要监听它所关心的事件，就能加入到这条生产线中，去改变生产线的运作。 webpack 的事件流机制保证了插件的有序性,使得整个系统扩展性很好。 
>
> ----- 深入浅出 webpack 吴浩麟

![webpack](https://user-gold-cdn.xitu.io/2020/1/5/16f741d40eaf5b45?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

## webpack 核心概念

### Entry 

入口起点(entry point)指示 webpack 应该使用哪个模块,来作为构建其内部依赖图的开始。

进入入口起点后,webpack 会找出有哪些模块和库是入口起点（直接和间接）依赖的。

每个依赖项随即被处理,最后输出到称之为 bundles 的文件中。

### Output 

output 属性告诉 webpack 在哪里输出它所创建的 bundles,以及如何命名这些文件,默认值为 ./dist。

基本上,整个应用程序结构,都会被编译到你指定的输出路径的文件夹中。

### Module 

模块,在 Webpack 里一切皆模块,一个模块对应着一个文件。Webpack 会从配置的 Entry 开始递归找出所有依赖的模块。

### Chunk 

代码块,一个 Chunk 由多个模块组合而成,用于代码合并与分割。

### Loader 

loader 让 webpack 能够去处理那些非 JavaScript 文件（webpack 自身只理解 JavaScript）。

loader 可以将所有类型的文件转换为 webpack 能够处理的有效模块,然后你就可以利用 webpack 的打包能力,对它们进行处理。

本质上,webpack loader 将所有类型的文件,转换为应用程序的依赖图（和最终的 bundle）可以直接引用的模块。

### Plugin 

loader 被用于转换某些类型的模块,而插件则可以用于执行范围更广的任务。

插件的范围包括,从打包优化和压缩,一直到重新定义环境中的变量。插件接口功能极其强大,可以用来处理各种各样的任务。

## webpack 构建流程

Webpack 的运行流程是一个串行的过程,从启动到结束会依次执行以下流程 :

1. 初始化参数：从配置文件和 Shell 语句中读取与合并参数,得出最终的参数。
2. 开始编译：用上一步得到的参数初始化 Compiler 对象,加载所有配置的插件,执行对象的 run 方法开始执行编译。
3. 确定入口：根据配置中的 entry 找出所有的入口文件。
4. 编译模块：从入口文件出发,调用所有配置的 Loader 对模块进行翻译,再找出该模块依赖的模块,再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理。
5. 完成模块编译：在经过第 4 步使用 Loader 翻译完所有模块后,得到了每个模块被翻译后的最终内容以及它们之间的依赖关系。
6. 输出资源：根据入口和模块之间的依赖关系,组装成一个个包含多个模块的 Chunk,再把每个 Chunk 转换成一个单独的文件加入到输出列表,这步是可以修改输出内容的最后机会。
7. 输出完成：在确定好输出内容后,根据配置确定输出的路径和文件名,把文件内容写入到文件系统。

在以上过程中,Webpack 会在特定的时间点广播出特定的事件,插件在监听到感兴趣的事件后会执行特定的逻辑,并且插件可以调用 Webpack 提供的 API 改变 Webpack 的运行结果。

### 实现一个简易的 webpack

### 1.定义 Complier 类

```js
class Compiler {
    constructor(options){
        //webpack 配置(webpack.config.js文件)
        const {entry, output} = options
        this.entry = entry      //入口
        this.output = output   //出口
        this.modules = [] //模块
    }
    run(){} //构建启动
    parse(){}
    file(){}
}
```

### 2.解析入口文件，获取AST

使用**@babel/parser**，这是 babel7 的工具，来帮助我们分析内部的语法，包括 es6，返回一个 AST 抽象语法树。

```js
parse(entryFile){
    // 获取指定路径模块的内容
    const content = fs.readFileSync(entryFile, 'utf-8') 
    //把内容通过 parse 抽象成ast语法树，便于分析、提取
    const ast = parser.parse(content, {
        sourceType: 'module'
    })
	// ....
}
```

### 3. 找出所有依赖模块

Babel 提供了**@babel/traverse**(遍历)方法维护这 AST 树的整体状态，我们这里使用它来帮我们找出依赖模块。

```js
parse(entryFile){
	//....
    //分析文件所需要的依赖
    const dependencies = {}
    //例子：key为./expo.js，value为./src/expo.js
    traverse(ast,{
        ImportDeclaration({node}){
           //这里要对路径进行处理
           //node.source.value ==> ./expo.js
           // path.dirname(entryFile) ===> ./src
            const newPathName ='./'+ path.join(path.dirname(entryFile),node.source.value)
            dependencies[node.source.value]=newPathName
        }
    })
    //...
}
```

### 4. AST 转换为 code

将 AST 语法树转换为浏览器可执行代码,我们这里使用**@babel/core** 和 **@babel/preset-env**。

```js
parse(entryFile){
	//.....
    //处理内容，转换ast
    const {code} = transformFromAst(ast, null,{
        presets:["@babel/preset-env"]
    })
	//返回一个对象
    return {
        entryFile,
        dependencies,
        code
    }
}
```

### 5. 递归解析所有依赖项，生成依赖关系图

```js
run(){
    //入口文件通过parse解析后的返回值
    const info = this.parse(this.entry)

    //处理其他模块，做一个信息汇总
    this.modules.push(info)
    for(let i=0; i<this.modules.length; i++){
        const item = this.modules[i]
        const {dependencies} = item
        if(dependencies){
            for(let j in dependencies){
                this.modules.push(this.parse(dependencies[j]))
            }
        }
    }
    //数组结构转换
    const graph = {}
    this.modules.forEach((item)=>{
        graph[item.entryFile] = {
            dependencies: item.dependencies,
            code:item.code
        }
    })
    //将最终生成的依赖传给file函数，用来构建bundle
    this.file(graph)
}
```

经过处理后，最终的 `graph`是一个对象。

### 6. 重写 require 函数,输出 bundle

在第4步生成的code中使用了require引入依赖文件，其中的路径为相对路径，需要重写require函数，使其路径引入正确。

```js
file(code){
    //生成bundle.js => ./dist/main.js
    const filePath = path.join(this.output.path,this.output.filename)

    const graph = JSON.stringify(code)
    const bundle = `(function(graph)
        function require(module){
            function localRequire(relativePath){
                return require(graph[module].dependencies[relativePath])
            }
            var exports={};
            (function(require,exports,code){
                eval(code)
            })(localRequire, exports, graph[module].code)
            return exports;
        }
        require('${this.entry}')
    })(${graph})`
    fs.writeFileSync(filePath, bundle, 'utf-8')
}
```

### 7.测试

**编写配置文件 webpack.config.js**

```js
const path = require('path')

module.exports = {
    entry: './src/index.js',
    mode: 'development',
    output:{
        path: path.resolve(__dirname, "./dist"),
        filename: 'main.js'
    }
}
```

**编写入口文件及其依赖文件**

```js
// src/index.js
import {add} from './expo.js'
add(1,2)
console.log('hello webpack')
```

```js
// src/expo.js
export const add = (a,b)=>{
    return a+b
}

export const minus = (a,b)=>{
    return a-b
}
```

**编写文件用于启动项目**

```js
// test.js
const options = require('./webpack.config.js')
const Webpack = require('./lib/webpack.js')

new Webpack(options).run()
```

### 8.输出文件分析

经过上面测试用例，输出结果如下

```js
// dist/main.js
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
```

## 总结

> Webpack 是一个庞大的 Node.js 应用,如果你阅读过它的源码,你会发现实现一个完整的 Webpack 需要编写非常多的代码。 但你无需了解所有的细节,只需了解其整体架构和部分细节即可。
>
> 对 Webpack 的使用者来说,它是一个简单强大的工具； 对 Webpack 的开发者来说,它是一个扩展性的高系统。
>
> Webpack 之所以能成功,在于它把复杂的实现隐藏了起来,给用户暴露出的只是一个简单的工具,让用户能快速达成目的。 同时整体架构设计合理,扩展性高,开发扩展难度不高,通过社区补足了大量缺失的功能,让 Webpack 几乎能胜任任何场景。

**推荐阅读**

- [webpack打包原理 ? 看完这篇你就懂了 !](https://juejin.cn/post/6844904038543130637)

