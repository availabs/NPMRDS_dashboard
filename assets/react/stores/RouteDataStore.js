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
    UserStore = require("./UserStore");

var ROUTE_DATA_CACHE = {};

var CHANGE_EVENT = "CHANGE_EVENT";

var RouteStore = assign({}, EventEmitter.prototype, {
    addChangeListener: function(cb) {
        this.on(CHANGE_EVENT, cb);
    },
    removeChangeListener: function(cb) {
        this.removeListener(CHANGE_EVENT, cb);
    },
    emitChange: function() {
        this.emit(CHANGE_EVENT);
    },

    getMonthlyData: function(id) {
        return ROUTE_DATA_CACHE[id] ? ROUTE_DATA_CACHE[id].monthly : null;
    },
    getMonthlyAMData: function(id) {
        return ROUTE_DATA_CACHE[id] ? ROUTE_DATA_CACHE[id].monthlyAM : null;
    },
    getMonthlyPMData: function(id) {
        return ROUTE_DATA_CACHE[id] ? ROUTE_DATA_CACHE[id].monthlyPM : null;
    }
})

RouteStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {
        case ActionTypes.LOAD_MONTHLY_GRAPH_DATA:
            var dataType = action.Datatype;
            ROUTE_DATA_CACHE[action.id][action.dataType] = action.data;
            RouteStore.emitChange();
            break;

        default:
            break;
    }
})

module.exports = RouteStore;
