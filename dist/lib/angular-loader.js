const render = ( handlers, inConfig ) => {
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
    function requireCss(css, callback){
      function loadCss(url, callback){
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", url);
        document.head.appendChild(link);
        link.onload = function(e){
          typeof callback === "function" ? callback(e) : null;
        }
      }
      function load(css){
        var url = css.shift();
        url ? loadCss(url, function(e){
          load(css);
        }) : ( typeof callback == "function" ? callback() : null );
      }
      load(css.map( d => d + ".css"));
    }
    if( configs.length > 0 && inConfig ){
      angularModule.config([ '$stateProvider', '$locationProvider', '$controllerProvider', ( $stateProvider, $locationProvider, $controllerProvider ) => {
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
                let defer =  q.defer(),
                  path = getPath(window.location.pathname) + loaderpath.slice(1);
                window["require"]([path], d => {
                  let { template } = d($controllerProvider);
                  setTemplate( template );
                  requireCss([path], d => {
                    defer.resolve("success");
                  })
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