'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    ActionTypes = Constants.ActionTypes,
    Events = Constants.EventTypes,

    TMCDataStore = require("./TMCDataStore"),

    routeCreator = require("../components/utils/RouteCreator")();

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
  	addPoint: function(point) {
console.log("RouteStore.addPoint: point", point);
        routeCreator
            .points(point)
            .call(bufferedRoute);
  	},
  	getRoute: function() {
  		return routeCreator.route().route;
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

console.log("RouteStore.getIntersects: linkIDs", linkIDs);
		SailsWebApi.getTMClookup(linkIDs);

	    return intersects;
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