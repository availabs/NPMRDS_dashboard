'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),
    d3 = require("d3"),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    ActionTypes = Constants.ActionTypes,
    Events = Constants.EventTypes,

    TMCDataStore = require("./TMCDataStore"),
    GeoStore = require("./GeoStore"),
    UserStore = require("./UserStore");

var MONTHLY_HOURS_DATA_CACHE = {},
    currentViewedMonth = -1;    // no month set, views should default to most recent month

var CHANGE_EVENT = "CHANGE_EVENT";

var RouteDataStore = assign({}, EventEmitter.prototype, {
    addChangeListener: function(cb) {
        this.on(CHANGE_EVENT, cb);
    },
    removeChangeListener: function(cb) {
        this.removeListener(CHANGE_EVENT, cb);
    },
    emitChange: function() {
        this.emit(CHANGE_EVENT);
    },

    getMonthlyHoursData: function(id) {
        return { data: MONTHLY_HOURS_DATA_CACHE[id], month: currentViewedMonth };
    },
    getCurrentMonth: function() {
        return currentViewedMonth == -1 ? "recent" : currentViewedMonth;
    }
})

RouteDataStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {
        case ActionTypes.MONTHLY_HOURS_DATA_LOADED:
            console.log("<RaouteDataStore::MONTHLY_HOURS_DATA_LOADED>",action)
            MONTHLY_HOURS_DATA_CACHE[action.id] = action.data;
            RouteDataStore.emitChange();
            break;

        case ActionTypes.ROUTE_DATA_MONTH_CHANGE:
            currentViewedMonth = action.month;
            RouteDataStore.emitChange();

        default:
            break;
    }
})

module.exports = RouteDataStore;
