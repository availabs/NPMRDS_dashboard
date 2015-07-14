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
  '/roads/geo/county/:id': 'geodata.getCountyRoads',
  '/roads/geo/state/:id': 'geodata.getStateRoads',

  /**
  * road usage data, by linkID
  */
  '/roads/usage/state/:id': 'usagedata.getStateData',
  '/roads/usage/county/:id': 'usagedata.getCountyData',

  /**
  * tmc usage data, by tmc code
  */
  '/tmc/data/:tmc': 'tmcdata.getTMCData',
  '/tmc/lookup/:links': 'tmcdata.TMClookup',

  /**
  * route saving and loading
  */
  '/routes/save/:owner/:name': 'route.saveRoute',
  '/routes/load/:owner/:name': 'route.loadRoute',
  '/routes/getsaved/:owner/:mpo_array': 'route.getSavedRoutes',            // this route returns a list of route names

  /**
  * route data retrieval
  */
  '/routes/brief/recent/month/:tmc_array': 'routedata.getBriefRecentMonth',
  '/routes/brief/year/:tmc_array': 'routedata.getBriefYear',

  /**
  * user preferences saving and loading
  */
  '/preferences/save/:id/:type/:mpo': 'userpreferences.savePreferences',
  '/preferences/get/:id': 'userpreferences.getPreferences',

  /**
  * MPOData model controls
  */
  '/mpo/getallnames': 'mpodata.getAllNames'
};
