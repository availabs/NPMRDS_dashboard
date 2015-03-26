'use strict';
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),
    topojson = require("topojson"),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    Events = Constants.EventTypes,

    ActionTypes = Constants.ActionTypes;

var _counties = {type:"FeatureCollection", features: []},
    _roadsCache = {},
    _loadedRoads = {},
    _shiftedRoads = {},
    _currentState = 0;

function _addUsers(rawData) {
  //console.log('stores/UserStore/_addUsers',rawData);
  rawData.forEach(function(user) {
    
      _users[user.id] = user;
    
  });
};

function _deleteUser(id){
  //console.log('stores/userstore/deleteuser',id)
  delete _users[id];
  _editUserID = null;
}

function _setEditUserID(id){
    _editUserID = id;
};

var GeoStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
    this.emit(Events.CHANGE_EVENT);
  },

  emitCountyChange: function() {
    this.emit(Events.COUNTY_CHANGE);
  },

  emitStateChange: function() {
    this.emit(Events.STATE_CHANGE);
  },
  
  /**
   * @param {function} callback
   */

  addChangeListener: function(Event, callback) {
    this.on(Event, callback);
  },
  
  removeChangeListener: function(Event, callback) {
    this.removeListener(Event, callback);
  },

  getState: function(fips) {
      _currentState = fips;
      return {
          type:"FeatureCollection", 
          features: _counties.features.filter(function(feat){
              return parseInt(feat.id/1000) == +fips;
          })
      };
  },

  getCurrentState: function() {
    return _currentState;
  },

  toggleCounty: function(fips) {
      if (!(fips in _loadedRoads)) {
          if (fips in _roadsCache) {
              _loadedRoads[fips] = "loaded";
              GeoStore.emitCountyChange();
          }
          else {
              _loadedRoads[fips] = "loading";
              SailsWebApi.getCountyRoads(fips);
          }
      }
      else {
          delete _loadedRoads[fips];
          GeoStore.emitCountyChange();
      }
  },

  getLoadedRoads: function() {
    var loadedRoadFeatures = [];
    for (var key in _loadedRoads) {
      if (_loadedRoads[key] == "loaded") {
          if (_shiftedRoads[key]) {
              loadedRoadFeatures = loadedRoadFeatures.concat(_shiftedRoads[key]);
          } 
          else if (_roadsCache[key]) {
              loadedRoadFeatures = loadedRoadFeatures.concat(_roadsCache[key].features);
          }
      }
    }
    return loadedRoadFeatures;
  },

  getLoadedRoadsByCounty: function() {
    var roadsByCounty = {};
    for (var key in _loadedRoads) {
      if (_loadedRoads[key] == "loaded" && _roadsCache[key]) {
        roadsByCounty[key] = _roadsCache[key].features;
      }
    }
    return roadsByCounty;
  },

  getAll: function() {
    return _counties;
  },

  setShiftedRoads: function(roads) {
    _shiftedRoads = roads;
  }
});

GeoStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {

        case ActionTypes.RECEIVE_COUNTIES:
            _counties = topojson.feature(action.topology, action.topology.objects.counties);
            GeoStore.emitStateChange();
            break;
        case ActionTypes.RECEIVE_COUNTY_ROADS:
            action.topology.forEach(function(topology) {
                var id = topology.objects.geo.id,
                    geo = topojson.feature(topology, topology.objects.geo);
                geo.id = id;
                _roadsCache[id] = geo;
                if (_loadedRoads[id] == "loading") {
                    _loadedRoads[id] = "loaded";
                }
            })
            GeoStore.emitCountyChange();
            break;

        default:
            // do nothing
    }
});

module.exports = GeoStore;
