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

var RouteStore = assign({}, EventEmitter.prototype, {

})

RouteStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {
        case default:
            break;
    }
})

module.exports = RouteStore;
