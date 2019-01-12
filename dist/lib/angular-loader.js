const { requireCss, requirejs } = require("ps-ultility");
const render = ( handlers, inConfig ) => {
  return ( angularModule, callback ) => {
    let configs = []
    handlers.forEach( setup => {
      let config = setup(angularModule);
      config && config.type === "router" ? configs.push( config ) : null;
    });
    function getPath(url){
      url = url.slice(1);
      url = url.split("/");
      url.pop();
      return url.length > 0 ? url.map(d => {
        return ".."
      }).join("/") : ".";
    }
    if( configs.length > 0 && inConfig ){
      console.log( configs, angularModule );
      angularModule.config([ '$stateProvider', '$locationProvider', '$controllerProvider', ( $stateProvider, $locationProvider, $controllerProvider ) => {
        $locationProvider.hashPrefix('');
        configs.forEach( ({ router, ctrlname, loaderpath, template }) => {
          function setTemplate(str){
            $stateProvider.stateRegistry.states[ctrlname].views.$default.template = str;
          }
          let config = {
            url : router,
            template : template,
            controller : ctrlname,
            resolve : {
              loader : ["$q", function(q){
                let defer =  q.defer()
                if( !loaderpath ){
                  defer.resolve("success");
                  return defer.promise;
                }
                let path = getPath(window.location.pathname) + loaderpath.slice(1);
                window["require"]([path], d => {
                  let { template } = d($controllerProvider);
                  setTemplate( template );
                  requireCss([`${path}.css`], d => {
                    defer.resolve("success");
                  });
                });
                return defer.promise;
              }]
            }
          };
          $stateProvider.state(ctrlname, config);
        });
      }])
    }
    callback( angularModule );
  };
}
export { render }