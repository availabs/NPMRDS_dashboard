'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    ActionTypes = Constants.ActionTypes,
    Events = Constants.EventTypes,

    TMCDataStore = require("./TMCDataStore"),
    GeoStore = require("./GeoStore"),

    routeCreator = require("../components/utils/RouteCreator")();

var routePoints = {};

var RouteStore = assign({}, EventEmitter.prototype, {
	emitEvent: function(Event, data) {
		this.emit(Event, data);
	},
	addChangeListener: function(Event, callback) {
	    this.on(Event, callback);
	},
  	removeChangeListener: function(Event, callback) {
    	this.removeListener(Event, callback);
  	},
    clearPoints: function() {
        routePoints = {};
    },
  	addPoint: function(id, point) {
console.log("RouteStore.addPoint:", id, point);
        if (point.length < 2) {
            delete routePoints[id];
        }
        else if (point.length == 2) {
            routePoints[id] = point;
        }
  	},
    calcRoute: function() {
        var points = [];
        for (var id in routePoints) {
            points.push(routePoints[id]);
        }
        points.sort(function(a,b){return a-b;});
console.log("RouteStore.calcRoute, points:", points);

        routeCreator
            .points(points)
            .call(bufferedRoute);
    },
  	getRoute: function() {
  		return routeCreator.route().route;
  	},
    getRouteData: function() {
        var data = {},
            route = routeCreator.route().route;

        data.points = routeCreator.points();

        return data;
    },
  	getBufferedRoute: function() {
  		return routeCreator.route().buffer;
  	},
  	getIntersects: function(roads) {
	    var intersects = [],
	    	linkIDs = [];

	    roads.features.forEach(function(feature) {
	        var buffer = routeCreator.buffer(feature),
	            intersect = routeCreator.intersect(buffer.features[0]);

	        if (intersect) {
	            intersects.push(feature);
	            linkIDs.push(feature.properties.linkID);
	        }
	    });

		if (linkIDs.length) {
			SailsWebApi.getTMClookup(linkIDs);
		}

		RouteStore.emitEvent(Events.INTERSECTS_CREATED, intersects);
  	}
})

RouteStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {
        case ActionTypes.RECEIVE_TMC_LOOKUP:
console.log("RouteStore.RECEIVE_TMC_LOOKUP", action.data);
      			var tmcs = [];
      			for (var tmc in action.data) {
      				tmcs.push(tmc);
      			}
      			TMCDataStore.addTMC(tmcs);
            break;

        case ActionTypes.ROUTE_LOADED:
            var points = JSON.parse(action.result.points);
console.log("RouteStore.ROUTE_LOADED", points);
            RouteStore.emitEvent(Events.ROUTE_LOADED, points);
            break;

        case ActionTypes.RECEIVE_SAVED_ROUTES:
console.log("RouteStore.RECEIVE_SAVED_ROUTES", action.result);
            RouteStore.emitEvent(Events.RECEIVED_SAVED_ROUTES, action.result);
            break;

        default:
    		    break;
    }
});

module.exports = RouteStore;

function bufferedRoute(error, route) {
	if (error) {
		console.log("RouteStore.bufferedRoute: error", error);
		return;
	}

	RouteStore.emitEvent(Events.ROUTE_CREATED, route);
}