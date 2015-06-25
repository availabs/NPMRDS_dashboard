var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {
  //------------------------------------
  // App
  //------------------------------------
  setAppSection: function(data){
    //console.log('set app section action',data)
    AppDispatcher.handleServerAction({
      type: ActionTypes.SET_APP_SECTION,
      section: data
    })
  },

  //------------------------------------
  // User
  //------------------------------------
  setSessionUser:function(data){
    AppDispatcher.handleServerAction({
      type: ActionTypes.SET_SESSION_USER,
      user:data
    })
  },
  receivePreferences: function(prefs) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.GET_PREFERENCES,
      prefs: prefs
    })
  },
  
  //------------------------------------
  // CRUD Handlers
  //------------------------------------
  
  routeSaved: function(err, res) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.ROUTE_SAVED,
      error: err,
      result: res
    });
  },
  routeLoaded: function(err, res) {
console.log("ServerActionsCreator.routeLoaded",err, res);
    AppDispatcher.handleServerAction({
      type: ActionTypes.ROUTE_LOADED,
      error: err,
      result: res
    });
  },
  receiveSavedRoutes: function(err, res) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_SAVED_ROUTES,
      error: err,
      result: res
    });
  },

  changeDataView: function(view) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.DATA_VIEW_CHANGE,
      view: view
    });
  },

  receiveData: function(type,data) {
    //handles Create,Read & Update
    var actiontype = 'RECEIVE_'+type.toUpperCase()+'S';
    AppDispatcher.handleServerAction({
      type: ActionTypes[actiontype],
      data: data
    });
  },

  receiveCounties: function(topo) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_COUNTIES,
      topology: topo
    });
  },

  receiveCountyRoads: function(topo) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_COUNTY_ROADS,
      topology: topo
    });
  },

  receiveShiftedCountyRoads: function(roads) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_SHIFTED_COUNTY_ROADS,
      roads: roads
    });
  },

  receiveTMCdata: function(requestedTMCs, data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_TMC_DATA,
      tmcs: requestedTMCs,
      data: data
    });
  },

  receiveCountyData: function(fips, params, data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_COUNTY_DATA,
      usageData: data,
      fips: fips,
      params: params
    });
  },
  
  receiveTMClookup: function(data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_TMC_LOOKUP,
      data: data
    });
  },
  
  deleteData:function(id){
    AppDispatcher.handleServerAction({
      type: ActionTypes.DELETE_USER,
      Id: id
    });
  }
  
};
