//---------------------------------------
// App Controller View 
// One Per Server Side Route
//---------------------------------------

//  --- Libraries
var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    Routes = Router.Routes,
    Redirect = Router.Redirect,
    DefaultRoute = Router.DefaultRoute,
    
//  --- Layout File
    App = require('./pages/layout.react'),

//  --- Pages
    MapView = require('./pages/mapView.react'),
    UserAdmin = require('./pages/UserAdmin.react'),
    LandingPage = require('./pages/LandingPage.react'),
    UserSettings = require('./pages/UserSettings.react'),

// --- Server API
    sailsWebApi = require('./utils/api/SailsWebApi.js');

// --- Initialize the API with the session User  
sailsWebApi.initAdmin(window.User);
delete window.User;

//  --- Routes 
var routes = (
  <Route name="app" path="/" handler={App}>
    <Route name="LandingPage" path="landing" handler={LandingPage} />
    <Route name="mapVieiw" path="mapView" handler={MapView}/>
    <Route name="userAdmin" path="admin/users"  handler={UserAdmin} />
    <Route name="settings" path="user/settings" handler={UserSettings} />
    <DefaultRoute handler={LandingPage}/>
  </Route>
);

document.body.classList.add('sidebar-hidden');

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
});


