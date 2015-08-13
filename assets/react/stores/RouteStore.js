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
    UserStore = require("./UserStore"),

    routeCreator = require("../components/utils/RouteCreator")();

var routePoints = {},
    SAVED_ROUTES = [],
    ACTIVE_ROUTE = null;

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
// console.log("RouteStore.addPoint:", id, point);
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
// console.log("RouteStore.calcRoute, points:", points);

        routeCreator
            .points(points)
            .call(function(err, res) {
                if (err) {
                    console.log(err);
                }
                else {
                    RouteStore.emitEvent(Events.ROUTE_CREATED, res);
                }
            })
    },
  	getRoute: function() {
  		return routeCreator.route();
  	},
    getRouteData: function() {
        var data = {},
            route = routeCreator.route();

        data.points = routeCreator.points();

        return data;
    },
    getSavedRoutes: function() {
        return SAVED_ROUTES;
    },

    activeRoute: function(route) {
        if (!arguments.length) {
            return ACTIVE_ROUTE;
        }
        ACTIVE_ROUTE = route;
    }
})

RouteStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {
        case ActionTypes.RECEIVED_USER_PREFERENCES:
// console.log("<RouteStore::RECEIVED_USER_PREFERENCES");
            var prefs = action.prefs,
                userId = UserStore.getSessionUser().id;
            SailsWebApi.getSavedRoutes(userId, prefs.mpo_name);
            break;

        case ActionTypes.RECEIVED_TMC_LOOKUP:
            TMCDataStore.addTMC(action.data.rows.map(function(row) { return row[0]; }));
            break;

        case ActionTypes.ROUTE_SAVED:
// console.log("RouteStore.ROUTE_SAVED");
            RouteStore.emitEvent(Events.ROUTE_SAVED);
            var prefs = UserStore.getPreferences(),
                userId = UserStore.getSessionUser().id;
            SailsWebApi.getSavedRoutes(userId, prefs.mpo_name);
            break;

        case ActionTypes.ROUTE_LOADED:
            var points = action.result.points;
// console.log("RouteStore.ROUTE_LOADED", points);
            RouteStore.emitEvent(Events.ROUTE_LOADED, points);
            break;

        case ActionTypes.RECEIVED_SAVED_ROUTES:
// console.log("RouteStore.RECEIVED_SAVED_ROUTES", action.data)
            SAVED_ROUTES = action.data;
            RouteStore.emitEvent(Events.RECEIVED_SAVED_ROUTES, action.data);
            break;

        default:
    		break;
    }
});

module.exports = RouteStore;
