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
      let match = /^(.*\/ps-(\w+)\/build\/)/.exec(url)
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
          function setTemplate(str){
            $stateProvider.stateRegistry.states[ctrlname].views.$default.template = str;
          }
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
                controller: $controllerProvider.register,
                directive: $compileProvider.directive,
                filter: $filterProvider.register,
                factory: $provide.factory,
                service: $provide.service
              }
            });
          }
          let names = [
            [ctrlname,router],
            [`main_${ctrlname}`, `/prod_dashboard/:showTree/:main_active_index${router}`],
            [`prod_sub_dashboard.sub_${ctrlname}`, `/subview${router}`],
            [`prod_sub_dashboard.minor_dashboard.minor_${ctrlname}`, `/minor_view${router}`]
          ];
          console.log( names );
          names.forEach( name => {
            let config = {
              url : name[1],
              name : name[0],
              template : template,
              controller : ctrlname,
              resolve : {
                loader : ["$q", function(q){
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
                      { template } = first($controllerProvider);
                    console.log( endTime.toFixed(2) + "s is spent on importing new controllers and dependencies.")
                    setTemplate( template );
                    for(var i in args){
                      args[i]($compileProvider);
                    }
                    defer.resolve("success");
                  });
                  return defer.promise;
                }]
              }
            };
            $stateProvider.state(ctrlname, config);
          });
        });
      }])
    }
    typeof callback === "function"
      ? callback( angularModule ) : null;
  };
}
export { render }