const render = function( handlers, inConfig ){
  return function( angularModule, url, callback ){
    if( typeof url === "function"){
      callback = url;
      url = undefined;
    }
    let configs = [], baseurl = getloadpath( url );
    function getloadpath( url ){
      if( typeof url === "undefined"){
        return "./";
      }
      //let match = /^(.*\/ps-(\w+)\/build\/)/.exec(url);
      let match = /^(.*\/build\/)/.exec(url)
      return match ? match[1] : "./";
    }
    handlers.forEach( setup => {
      let config = setup(angularModule);
      config && config.type === "router" ? configs.push( config ) : null;
    });
    if( configs.length > 0 && inConfig ){
      angularModule.config([ '$stateProvider', '$locationProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', ( $stateProvider, $locationProvider, $controllerProvider, $compileProvider, $filterProvider, $provide ) => {
        $locationProvider.hashPrefix('');
        let angularConfig = window.__smartAngular__ = window.__smartAngular__ || {};
        angularConfig.routers = angularConfig.routers || [];
        [].push.apply( angularConfig.routers, configs );
        configs.forEach( ({ router, ctrlname, loaderpath, template }) => {
          function hasRegistered( service, name ){
            return angularModule._invokeQueue.some( item => {
              return item[1] === service
                && item[2][0] === name
            })
          }
          if( !hasRegistered( "factory", "$registerService" )){
            $provide.factory("$registerService", function(){
              return {
                getRouters() {
                  return window.__smartAngular__["routers"];
                },
                controller(){
                  $controllerProvider.register.apply($controllerProvider,arguments);
                  this._invokeQueue.push(["$controllerProvider", "controller", [arguments[0]]]);
                },
                directive(){
                  $compileProvider.directive.apply($compileProvider,arguments)
                  this._invokeQueue.push(["$compileProvider", "directive", [arguments[0]]]);
                },
                filter(){
                  $filterProvider.register.apply($filterProvider,arguments);
                  this._invokeQueue.push(["$filterProvider", "filter", [arguments[0]]]);
                },
                factory(){
                  $provide.factory.apply($provide,arguments);
                  this._invokeQueue.push(["$provide", "factory", [arguments[0]]]);
                },
                service(){
                  $provide.service.apply($provide,arguments);
                  this._invokeQueue.push(["$provide", "service", [arguments[0]]]);
                },
                _invokeQueue : [].slice.call(angularModule._invokeQueue)
              }
            });
          }
          let names = [
            [ctrlname,router],
            [`prod_controller.${ctrlname}`, `/prod_dashboard/:id/:showTree/:main_active_index${router}`],
            [`prod_sub_dashboard.sub_${ctrlname}`, `/subview/:sub_active_index${router}`],
            [`prod_sub_dashboard.minor_dashboard.minor_${ctrlname}`, `/minor_view/:minor_active_index${router}`]
          ];
          names.forEach( name => {
            let config = {
              url : name[1],
              name : name[0],
              template : template,
              controller : ctrlname,
              resolve : {
                loader : ["$q", "$registerService", function(q, registerService){
                  let defer =  q.defer(), time = new Date();
                  if( !loaderpath ) {
                    defer.resolve("success");
                    return defer.promise;
                  }
                  let deps = loaderpath.map( d => baseurl + d );
                  psrequire( deps, function(){
                    let args = [].slice.call(arguments),
                      endTime = ( new Date() - time ) / 1000,
                      first = args.shift(),
                      { template } = first( registerService );
                    console.log( endTime.toFixed(2) + "s is spent on importing new controllers and dependencies.")
                    setTemplate( template );
                    for(var i in args){
                      args[i]( registerService );
                    }
                    defer.resolve("success");
                  });
                  return defer.promise;
                }]
              }
            };
            function setTemplate(str){
              $stateProvider.stateRegistry.states[name[0]].views.$default.template = str;
            }
            $stateProvider.state(config);
          });
        });
      }])
    }
    typeof callback === "function"
      ? callback( angularModule ) : null;
  };
}
export { render }