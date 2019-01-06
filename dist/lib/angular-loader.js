const render = handlers => {
  return angularModule => {
    let configs = []
    handlers.forEach( setup => {
      let config = setup(angularModule);
      config && config.type === "router" ? configs.push( config ) : null;
    });
    function getPath(url){
      url = url.slice(1);
      url = url.split("/");
      url.pop();
      return url.map(d => {
        return ".."
      }).join("/")
    }
    if(configs.length > 0){
      angularModule.config([ '$stateProvider', '$locationProvider', '$controllerProvider', ( $stateProvider, $locationProvider, $controllerProvider ) => {
        configs.forEach( ({ router, ctrlname, loaderpath, template }) => {
          let config = {
            url : router,
            template : template,
            controller : ctrlname,
            resolve : {
              loader : ["$q", function(q){
                let defer =  q.defer();
                console.log(getPath(window.location.pathname) + loaderpath.slice(1));
                window["require"]([getPath(window.location.pathname) + loaderpath.slice(1)], d => {
                  d($controllerProvider);
                  defer.resolve("success");
                });
                return defer.promise;
              }]
            }
          };
          $stateProvider.state(ctrlname, config);
        });
        $locationProvider.hashPrefix('');
      }])
    }
  };
}
export { render }