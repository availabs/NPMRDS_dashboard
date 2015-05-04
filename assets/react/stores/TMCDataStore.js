'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    ActionTypes = Constants.ActionTypes,
    Events = Constants.EventTypes,

	crossfilter = require("../utils/CrossFilter")(),

	selectedTMCs = [],
	TMCdata = {},

	WEEKDAYS = {
		"monday": 0,
		"tuesday": 1,
		"wednesday": 2,
		"thursday": 3,
		"friday": 4,
		"saturday": 5,
		"sunday": 6
	},

	colorMapper = TMCColorMapper();

crossfilter.on("crossfilterupdate", function(cf) {
	//TMCDataStore.emitEvent()
	console.log("crossfilter updated");
})

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
console.log("TMCDataStore: adding", tmc);
		if (!(tmc in TMCdata)) {
			SailsWebApi.getTMCdata(tmc);
		}
		else {
			this.receiveTMCdata(tmc, TMCdata[tmc]);
		}
	},
	removeTMC: function(tmc) {
		var len = selectedTMCs.length;
		selectedTMCs = selectedTMCs.filter(function(d) { return tmc != d; });
		if (selectedTMCs.length < len) {
			TMCDataStore.emitEvent(Events.REMOVE_TMC_DATA, tmc);
			colorMapper.remove(tmc);
		}
	},
	changeDataView: function(view) {
		this.emitEvent(Events.TMC_DATAVIEW_CHANGE, view);
	},
	receiveTMCdata: function(tmc, data) {
console.log("TMCDataStore: received data for", tmc);
		colorMapper.add(tmc);
    	selectedTMCs.push(tmc);
    	data.tmc = new TMC(tmc);

    	if (!(tmc in TMCdata)) {
    		TMCdata[tmc] = data;

			var BQschema = data.schema,
				BQtypes = data.types,
			
				cfData = data.rows.map(function(row) {
					var obj = {};
					row.forEach(function(d, i) {
						if (BQtypes[i] != "STRING") {
							obj[BQschema[i]] = +d;
						}
						else {
							obj[BQschema[i]] = d;
						}
					});
					obj.weekday = WEEKDAYS[obj.weekday];
					obj.tmc = new TMC(tmc);
					obj.time = (obj["date"]*1000) + (obj["epoch"]);
					return obj;
				});

			crossfilter.add(cfData);
console.log("<TMCDataStore.receiveTMCdata> finished");
    	}
		this.emitEvent(Events.DISPLAY_TMC_DATA, data);
	},
	getTMCData: function(tmc) {
		return TMCdata[tmc];
	},
	getCrossFilter: function() {
		return crossfilter.session();
	},
	getTMCcolor: function(tmc) {
		return colorMapper(tmc);
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

function convertTMC(tmc) {
	var regex = /(\d{3})([NP])(\d{5})/,
		match = regex.exec(tmc);

	var tmcNum = (+match[1])*100000 + (+match[3]);
	if (match[2] == "N") {
		return -tmcNum;
	}
	return tmcNum;
}

function TMC(tmc) {
	this.__tmcString__ = tmc;
	this.__tmcNumber__ = convertTMC(tmc);
}
TMC.prototype.toString = function() {
	return this.__tmcString__;
}
TMC.prototype.valueOf = function() {
	return this.__tmcNumber__;
}

function TMCColorMapper() {
	var	colorRange = ["#a6cee3","#1f78b4","#b2df8a","#33a02c",
					  "#fb9a99","#e31a1c","#fdbf6f","#ff7f00",
					  "#cab2d6","#6a3d9a","#ffff99","#b15928",
					  "#8dd3c7","#ffffb3","#bebada","#fb8072",
					  "#80b1d3","#fdb462","#b3de69","#fccde5",
					  "#d9d9d9","#bc80bd","#ccebc5","#ffed6f"],
		colorScale = d3.scale.ordinal()
			.domain(d3.range(colorRange.length))
			.range(colorRange),

		TMCarray = colorRange.map(function() { return null; }),
		TMCentries = [];

	function mapper(TMC) {
		var tmc = TMC.toString();
		var index = -1;
		if ((index=findTMC(tmc, TMCarray)) > 0) {
			return colorScale(index);
		}
		return "#666";
	}
	mapper.add = function(TMC) {
		var tmc = TMC.toString();
		if (findTMC(tmc, TMCarray) > -1) {
			return;
		}
		TMCentries.push(tmc);
		var index = -1;
		if ((index=firstFree()) == -1) {
			index = findTMC(TMCentries[0]);
			TMCentries = TMCentries.slice(1);
		}
		TMCarray[index] = tmc;
	}
	mapper.remove = function(TMC) {
		var tmc = TMC.toString(),
			index = -1;
		if ((index=findTMC(tmc, TMCarray)) > -1) {
			TMCarray[index] = null;
		}
		if ((index=findTMC(tmc, TMCentries)) > -1) {
			TMCentries.splice(index, 1);
		}
	}
	return mapper;

	function findTMC(tmc, array) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] == tmc) {
				return i;
			}
		}
		return -1;
	}
	function firstFree() {
		for (var i = 0; i < TMCarray.length; i++) {
			if (TMCarray[i] === null) {
				return i;
			}
		}
		return -1;
	}
}

module.exports = TMCDataStore;