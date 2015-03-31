'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    ActionTypes = Constants.ActionTypes,
    Events = Constants.EventTypes;

var selectedTMCs = [],
	TMCdata = {};

var TMCDataStore = assign({}, EventEmitter.prototype, {
	emitEvent: function(Event, data) {
		this.emit(Event, data);
	},
	addChangeListener: function(Event, callback) {
	    this.on(Event, callback);
	},
  	removeChangeListener: function(Event, callback) {
    	this.removeListener(Event, callback);
  	},
	addTMC: function(tmc) {
		SailsWebApi.getTMCdata(tmc);
	},
	removeTMC: function(tmc) {
		for (var i = 0; i < selectedTMCs.length; i++) {
			if (selectedTMCs[i] == tmc) {
				selectedTMCs[i] = selectedTMCs[selectedTMCs.length-1];
				selectedTMCs.pop();
				this.emitEvent(Events.REMOVE_TMC_DATA, tmc);
				break;
			}
		}
	},
	receiveTMCdata: function(tmc, data) {
    	selectedTMCs.push(tmc);
		this.emitEvent(Events.DISPLAY_TMC_DATA, tmc);
	}
})

TMCDataStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {
    	case ActionTypes.RECEIVE_TMC_DATA:
    		TMCDataStore.receiveTMCdata(action.tmc, action.data);
    		break;
    	default:
    }
});

module.exports = TMCDataStore;