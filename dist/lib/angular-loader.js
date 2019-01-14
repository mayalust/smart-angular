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
                controller: $controllerProvider.register,
                directive: $compileProvider.directive,
                filter: $filterProvider.register,
                factory: $provide.factory,
                service: $provide.service
              }
            });
          }
          let config = {
            url : router,
            template : template,
            controller : ctrlname,
            resolve : {
              loader : ["$q", function(q){
                let defer =  q.defer()
                if( !loaderpath ) {
                  defer.resolve("success");
                  return defer.promise;
                }
                let deps = loaderpath.map( d => baseurl + d );
                psrequire( deps, function(){
                  let args = [].slice.call(arguments),
                    first = args.shift(),
                    { template } = first($controllerProvider);
                  setTemplate( template );
                  for(var i in args){
                    debugger;
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
      }])
    }
    typeof callback === "function"
      ? callback( angularModule ) : null;
  };
}
export { render }