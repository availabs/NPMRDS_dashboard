/**
 * Route Mappings
 * (sails.config.routes)
 * CoffeeScript for the front-end.
 *
 * For more information on routes, check out:
 * http://links.sailsjs.org/docs/config/routes
 */

module.exports.routes = {

  //-------------------------------
  // User controller 
  //-------------------------------

  '/landing': 'LandingController.index', //Landing View
  '/': 'LandingController.flux', //Main Flux App

  //-------------------------------
  // User controller 
  //-------------------------------

  //Views
  '/login':'UserController.login',
  
  //Auth
  '/logout':'UserController.logout',
  '/login/auth':'UserController.auth',

  /**
  * road topology, by fips codes
  */
  '/geo/getcounty/:id?': 'geodata.getCountyTopology',
  '/geo/getstate/:id': 'geodata.getStateTopology',

  /**
  * road usage data, by linkID
  */
  '/usage/getstate/:id': 'usagedata.getStateData',
  '/usage/getcounty/:id': 'usagedata.getCountyData',

  /**
  * tmc statistical data, by tmc code
  */
  '/tmcdata/:id': 'tmcdata.getTMCData',
  '/tmclookup': 'tmcdata.TMClookup',

  /**
  * route saving and loading
  */
  '/routes/save/:owner/:name/:points': 'routedata.saveRoute',
  '/routes/load/:owner/:name': 'routedata.loadRoute',
  '/routes/getsaved/:owner': 'routedata.getSavedRoutes',

  /**
  * user preferences saving and loading
  */
  '/preferences/save/:id/:type/:mpo': 'userpreferences.savePreferences',
  '/preferences/get/:id': 'userpreferences.getPreferences',
};
