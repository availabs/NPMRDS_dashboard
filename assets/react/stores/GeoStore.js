'use strict';

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
    _shiftedRoadsFeatures = [],
    _currentState = 0;

var GeoStore = assign({}, EventEmitter.prototype, {

  emitEvent: function(Event, data) {
    this.emit(Event, data);
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
              GeoStore.emitEvent(Events.COUNTY_CHANGE);
          }
          else {
              _loadedRoads[fips] = "loading";
              SailsWebApi.getCountyRoads(fips);
          }
      }
      else {
          delete _loadedRoads[fips];
          GeoStore.emitEvent(Events.COUNTY_CHANGE);
      }
  },

    getRoads: function() {
        var roads = {
            type: "FeatureCollection",
            features: []
        }

        for (var road in _loadedRoads) {
            if (_loadedRoads[road]=="loaded") {
                roads.features = roads.features.concat(_roadsCache[road]);
            }
        }
        return roads;
    },

  getLoadedRoads: function() {
    if (_shiftedRoadsFeatures.length) {
//console.log("GeoStore.RETURNING SHIFTED ROADS")
      return _shiftedRoadsFeatures;
    }
    var loadedRoadFeatures = [];
    for (var key in _loadedRoads) {
      if (_loadedRoads[key] == "loaded") {
          if (_shiftedRoads[key]) {
              loadedRoadFeatures = loadedRoadFeatures.concat(_shiftedRoads[key]);
          } 
          else if (_roadsCache[key]) {
              loadedRoadFeatures = loadedRoadFeatures.concat(_roadsCache[key]);
          }
      }
    }
    return loadedRoadFeatures;
  },

  getLoadedRoadsByCounty: function() {
    var roadsByCounty = {};
    for (var key in _loadedRoads) {
      if (_loadedRoads[key] == "loaded" && _roadsCache[key]) {
        roadsByCounty[key] = _roadsCache[key];
      }
    }
    return roadsByCounty;
  },

  getAll: function() {
    return _counties;
  },

  setShiftedRoads: function(roads) {
  //console.log("GeoStore.RECEIVED_SHIFTED_COUNTY_ROADS")
    _shiftedRoadsFeatures = [];
    _shiftedRoads = roads;

    for (var fips in _shiftedRoads) {
      _shiftedRoadsFeatures = _shiftedRoadsFeatures.concat(_shiftedRoads[fips]);
    }
  }
});

GeoStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {

        case ActionTypes.RECEIVED_COUNTIES:
            _counties = topojson.feature(action.topology, action.topology.objects.counties);
            GeoStore.emitEvent(Events.STATE_CHANGE);
            break;
        case ActionTypes.RECEIVED_COUNTY_ROADS:
            //console.log("GeoStore.RECEIVED_COUNTY_ROADS")
            action.topology.forEach(function(topology) {
                var id = topology.objects.geo.id,
                    geo = topojson.feature(topology, topology.objects.geo);
                geo.id = id;
                _roadsCache[id] = geo.features;
                if (_loadedRoads[id] == "loading") {
                    _loadedRoads[id] = "loaded";
                }
            })
            GeoStore.emitEvent(Events.COUNTY_CHANGE);
            _shiftedRoadsFeatures = [];
            break;
        case ActionTypes.RECEIVED_SHIFTED_COUNTY_ROADS:
//console.log("GeoStore.RECEIVED_SHIFTED_COUNTY_ROADS")
            _shiftedRoadsFeatures = [];
            _shiftedRoads = actions.roads;

            for (var fips in _shiftedRoads) {
              _shiftedRoadsFeatures = _shiftedRoadsFeatures.concat(_shiftedRoads[fips]);
            }
          break;

        default:
            // do nothing
    }
});

module.exports = GeoStore;
