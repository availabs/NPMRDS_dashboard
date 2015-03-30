/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

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
  
  //------------------------------------
  // CRUD Handlers
  //------------------------------------

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

  receiveCountyData: function(fips, params, data) {
    AppDispatcher.handleServerAction({
      type: ActionTypes.RECEIVE_COUNTY_DATA,
      usageData: data,
      fips: fips,
      params: params
    });
  },
  
  deleteData:function(id){
    AppDispatcher.handleServerAction({
      type: ActionTypes.DELETE_USER,
      Id: id
    });
  }
  
};
