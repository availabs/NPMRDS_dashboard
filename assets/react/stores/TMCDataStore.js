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

	UNIQUE_COMBINED_TMCs = 0,

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
	addTMC: function(TMCs) {
		if (!Array.isArray(TMCs)) {
			TMCs = [TMCs];
		}

		var unloaded = [],
			loaded = [];

		TMCs.forEach(function(tmc) {
			if (!(tmc in TMCdata)) {
				unloaded.push(tmc);
				//SailsWebApi.getTMCdata(tmc);
			}
			else {
				//this.receiveTMCdata(tmc, TMCdata[tmc]);
				loaded.push(tmc);
			}
		})

		if (unloaded.length) {
			var data = {};
			loaded.forEach(function(t) {
				data[t] = TMCdata[t];
			})
			SailsWebApi.getTMCdata(unloaded, data);
		}
		else {
			var data = {};
			loaded.forEach(function(t) {
				data[t] = TMCdata[t];
			})
			this.receiveTMCdata(loaded, data);
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
	receiveTMCdata: function(TMCs, data) {
		for (var tmc in data) {
			colorMapper.add(tmc);
			selectedTMCs.push(tmc);
			data[tmc].tmc = new TMC(tmc);

			if (!(tmc in TMCdata)) {
				TMCdata[tmc] = data[tmc];

				var BQschema = data[tmc].schema,
					BQtypes = data[tmc].types,

					cfData = parseData(tmc, data[tmc]);

				crossfilter.add(cfData);
			}

			this.emitEvent(Events.DISPLAY_TMC_DATA, data[tmc]);
		}

		if (TMCs.length > 1) {
			aggregateData(TMCs, data);
		}
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

function aggregateData(TMCs, data) {
	var newData = [];
	for (var tmc in data) {
		var tmcData = parseData(tmc, data[tmc])
			//.sort(function(a, b) { return a.time-b.time; });
		newData.push(tmcData);
	}
	newData = d3.merge(newData);

	var nestData = d3.nest()
		.key(function(d) { return d.tmc.toString(); })
		.key(function(d) { return d.date; })
		.rollup(function(d) {
			return {
				distance: d[0].distance,
				date: d[0].date,
				tmc: d[0].tmc,
				travel_time_all: d3.sum(d, function(d) { return d.travel_time_all; }) / d.length,
				travel_time_truck: d3.sum(d, function(d) { return d.travel_time_truck; }) / d.length,
				weekday: d[0].weekday
			};
		})
		.entries(newData);

	var aggregatedSet = {};
	nestData.forEach(function(tmc) {
		tmc.values.forEach(function(date) {
			if (!(date.key in aggregatedSet)) {
				aggregatedSet[date.key] = [];
			}
			aggregatedSet[date.key].push(date.values)
		})
	});

	var aggregated = {
		tmcs: TMCs,
		values: []
	};
	for (var date in aggregatedSet) {
		if (aggregatedSet[date].length == TMCs.length) {
			var obj = {
				distance: d3.sum(aggregatedSet[date], function(d) { return d.distance; }),
				date: aggregatedSet[date][0].date,
				month: Math.floor(aggregatedSet[date][0].date / 100),
				travel_time_all: d3.sum(aggregatedSet[date], function(d) { return d.travel_time_all; }),
				travel_time_truck: d3.sum(aggregatedSet[date], function(d) { return d.travel_time_truck; }),
				weekday: aggregatedSet[date][0].weekday
			}
			aggregated.values.push(obj);
		}
	}

	TMCDataStore.emitEvent(Events.DISPLAY_AGGREGATED_DATA, aggregated);
}

function parseData(tmc, data) {
	var BQschema = data.schema,
		BQtypes = data.types;

	return data.rows.map(function(row) {
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
		obj.hour = (obj["date"]*100) + (Math.floor(obj["epoch"]/12));
		return obj;
	});
}

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
	if (tmc == "combined") {
		this.__tmcString__ = "combined-"+UNIQUE_COMBINED_TMCs++;
		this.__tmcNumber__ = 13370000+UNIQUE_COMBINED_TMCs;
	}
	else {
		this.__tmcString__ = tmc;
		this.__tmcNumber__ = convertTMC(tmc);
	}
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