# smart-angular
angularjs version 1.x template
smart-angular是一套基于angularjsv1.x的打包部署工具，主要作用是可以使用类似.vue文件的写法写.controller,.service,.directive文件还有css文件，支持包括less, scss，sass, css的打包和部署工作。

**1.安装**
全局安装 npm i smart-angular@latest -g，通常用于部署打包阶段打包文件。（部署阶段使用）
局部安装 npm i smart-angular@latest 通常用于开发阶段和本地调试。（推荐安装调试使用局部安装）
c)   注意：局部安装之后需要手动在package.json的script下添加smart-angular : “smart-angular”属性，后面可通过npm run smart-angular 加方法来进行调用

2 创建一个项目
在安装目录下执行命令行 
smart-angular init “项目名”(全局安装情况下), 
npm run smart-angular init “项目名”(局部安装情况下)

会得到如下文件目录，这个就是我们的项目：
ps-项目名
— controllers /** controller 文件存放位置 **/
 |— test.controller
— directives /** directive 文件存放位置 **/
 |— test.directive
— services /** service 文件存放位置 **/
 |— test.service
— styles /** css样式 文件存放位置 **/
 | — test.less

3安装所需依赖
npm i angular,requirejs,ps-require,angular-ui-router@latest

4，预览与打包
预览之前需要1）通过smart-angular pack项目名 打包文件，或2）者直接执行smart-angular server启动一个本地环境的服务器来进行浏览。
在本地服务器环境打开 ps-项目名/index.html 可进行预览。

4controllers
controllers主要用于页面路由，每一个.controller文件的文件名都对应一个路由，如test.controller我们可以通过**/ps-leon/index.html#/test访问到，test-service.controller可以通过**/ps-leon/index.html#/testService（驼峰命名）访问到, 并且不区分其是否所属某个文件夹，路由的名称只对应文件名的驼峰命名.


5*,controller, *.service, *.directive文件的使用.
<config injector=“$scope" params=“/:id”></config>
<template>
  <div class="wrap">
    <span>{{n}}</span>
    <test></test>
  </div>
</template>
<script>
  export default function( scope ){
    scope.n = 10
  }  
</script>
<style lang="scss" scoped>
  .wrap {
    span {
      color : red
    }
  }
</style>

1),config标签
injector参数后面收入依赖注入的内容和原本angularjs1.x没区别, params是路由参数也和原版angularjs1.x设置方法相同。
2),template标签
此路由对应页面所使用的模版对应angular-ui-router的template里面的内容。
3).script标签
js的具体写法实现。
4).style标签
页面样式，当增加scoped属性后为局部区域内的样式，lang属性定义这一区块使用less,sass哪一种方法书写css
5).directive，service的书写与controller遵循相同的规则。

6，其他命令：( 以全局安装为主，局部安装在前面加npm run );
smart-angular controller a b为一个已经存在的项目a添加一个controllers/b.controller;
smart-angular directive a b为一个已经存在的项目a添加一个directives/b.directive;
smart-angular service a b为一个已经存在的项目a添加一个services/b. service;
smart-angular pack project 打包一个名为project下的所有文件，并分开放置，放到build文件夹下。
smart-angular pack “project/output” 打包一个名为project下的所有文件并合并到一个名为output.js的文件并放到build文件夹下。（项目中除非发布工具，通常不建议使用）
smart-angular pack “project/controllers” 打包一个名为project下的所有controllers文件并合并到一个名为controllers.js的文件并放到build文件夹下。
smart-angular pack “project/directives” 打包一个名为project下的所有directives文件并合并到一个名为directives.js的文件并放到build文件夹下。
smart-angular pack “project/services” 打包一个名为project下的所有services文件并合并到一个名为services.js的文件并放到build文件夹下。
smart-angular pack “project/controller/test” 打包一个名为project下的controllers文件内名为test.controller的文件到build文件夹下。
