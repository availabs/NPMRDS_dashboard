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
      type: ActionTypes.RECEIVED_USER_PREFERENCES,
      prefs: prefs
    })
  },

  receiveMPONames: function(data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVED_MPO_NAMES,
      names: data
    })
  },

  receiveSavedRoutes: function(data) {
// console.log("<ServerActionCreators::receiveSavedRoutes>", data)
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVED_SAVED_ROUTES,
      data: data
    })
},

  routeSaved: function(err, res) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.ROUTE_SAVED,
      error: err,
      result: res
    });
  },
  routeLoaded: function(err, res) {
// console.log("ServerActionsCreator.routeLoaded",err, res);
    AppDispatcher.handleServerAction({
      type: ActionTypes.ROUTE_LOADED,
      error: err,
      result: res
    });
  },

  changeDataView: function(view) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.DATA_VIEW_CHANGED,
      view: view
    });
  },

  receiveCounties: function(topo) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVED_COUNTIES,
      topology: topo
    });
  },

  receiveCountyRoads: function(topo) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVED_COUNTY_ROADS,
      topology: topo
    });
  },

  receiveShiftedCountyRoads: function(roads) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVED_SHIFTED_COUNTY_ROADS,
      roads: roads
    });
  },

  receiveTMCdata: function(requestedTMCs, data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVED_TMC_DATA,
      tmcs: requestedTMCs,
      data: data
    });
  },

  receiveCountyData: function(fips, params, data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVED_COUNTY_ROADS_DATA,
      usageData: data,
      fips: fips,
      params: params
    });
  },

  loadMonthlyGraphData: function(id, type, data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.LOAD_MONTHLY_GRAPH_DATA,
      id: id,
      dataType: type,
      data: data
    });
  },

  // receiveTMClookup: function(data) {
  //   AppDispatcher.handleServerAction({
  //     type: ActionTypes.RECEIVED_TMC_LOOKUP,
  //     data: data
  //   });
  // },

  //------------------------------------
  // CRUD Handlers
  //------------------------------------

  deleteData:function(id){
    AppDispatcher.handleServerAction({
      type: ActionTypes.DELETE_USER,
      Id: id
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

};
