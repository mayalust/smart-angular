const render = handlers => {
  return angularModule => {
    let configs = []
    handlers.forEach( setup => {
      let config = setup(angularModule);
      config && config.type === "router" ? configs.push( config ) : null;
    });
    if(configs.length > 0){
      angularModule.config([ '$routeProvider', '$locationProvider', ( $routeProvider, $locationProvider ) => {
        console.log(configs);
        configs.forEach( ({ router, template, ctrlname }) => {
          $routeProvider.when(router, {
            template : template,
            controller: ctrlname
          });
        });
        $locationProvider.hashPrefix('');
      }])
    }
  };
}
export { render }