const render = handlers => {
  return angularModule => {
    let configs = []
    handlers.forEach( setup => {
      let config = setup(angularModule);
      config && config.type === "router" ? configs.push( config ) : null;
    });
    if(configs.length > 0){
      angularModule.config([ '$stateProvider', '$locationProvider', ( $stateProvider, $locationProvider ) => {
        configs.forEach( ({ router, template, ctrlname }) => {
          $stateProvider.state(router, {
            url : router,
            template : template,
            controller: ctrlname,
            resolve : {
              getCtrl : ["$q", function(q){
                let defer =  q.defer();
                defer.resolve("success");
                return defer.promise;
              }]
            }
          });
        });
        $locationProvider.hashPrefix('');
      }])
    }
  };
}
export { render }