'use strict';

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    ActionTypes = Constants.ActionTypes,
    Events = Constants.EventTypes,

	crossfilter = require("../utils/CrossFilter")(),
    TMCCrossFilter = require("../utils/TMCCrossFilter"),
	//TMCmodel = require("../utils/TMCModel")(),

	selectedTMCs = {},
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

	colorMapper = TMCColorMapper(),
	nameMapper = TMCNameMapper();

var controlPanelParams = {};

var TMC_CrossFilter_List = [];

var WEB_WORKERS = [];
function WebWorker() {
    var workerInstance = new Worker("/react/utils/WebWorker.js"),
        callBack;

    workerInstance.onmessage = function(e) {
        console.log("WebWorker Response", e.data)
        if (e.data.data) {
            callBack(e.data.data);
        }
    }

    function worker(g, cb) {
        callBack = cb;
        workerInstance.postMessage({ type: "group", group: g });
    }
    worker.add = function(d) {
        workerInstance.postMessage({ type: "add", data: d });
    }
    worker.filter = function(dim, filter) {
        workerInstance.postMessage({ type: "filter", dim: dim, filter: filter });
    }
    return worker;
}

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

		var unloaded = TMCs.filter(function(tmc) { return !(tmc in TMCdata); });

		if (unloaded.length) {
			SailsWebApi.getTMCdata(TMCs, unloaded);
		}
		else {
			this.displayTMCdata(TMCs);
		}
	},
	removeTMC: function(tmc) {
//console.log("<TMCDataStore::removeTMC>", tmc);
		if (selectedTMCs[tmc]) {
			TMCDataStore.emitEvent(Events.REMOVE_TMC_DATA, tmc);
			colorMapper.remove(tmc);
			delete selectedTMCs[tmc];
		}
	},
	changeDataView: function(view) {
		this.emitEvent(Events.TMC_DATAVIEW_CHANGE, view);
	},
	receiveTMCdata: function(requestedTMCs, data) {
//console.log("TMCDataStore.receiveTMCdata", requestedTMCs, data);

		var parsedData = d3.nest()
				.key(function(d) { return d.tmc.toString(); })
				.entries(parseData(data));

//console.log("TMCDataStore.receiveTMCdata", parsedData);

		parsedData.forEach(function(data) {
			TMCdata[data.key] = data.values;

			crossfilter.add(data.values);
            TMC_CrossFilter_List.forEach(function(d) { d.add(data.values); });
            WEB_WORKERS.forEach(function(d) { d.add(data.values); });

			nameMapper.add(data.key, data.values[0].road_name);
		});

		this.displayTMCdata(requestedTMCs);
	},
	displayTMCdata: function(TMCs) {
//console.log("TMCDataStore.displayTMCdata", TMCs);
		TMCs.forEach(function(tmc) {
			if (!(tmc in selectedTMCs) && TMCs.length==1) {
				selectedTMCs[tmc] = true;
				colorMapper.add(tmc);
			}
		})
		if (TMCs.length == 1) {
			this.emitEvent(Events.DISPLAY_TMC_DATA, new TMC(TMCs[0]));
		}
		else if (TMCs.length > 1) {
			var data = TMCs.map(function(d) { return TMCdata[d]; });
			this.emitEvent(Events.DISPLAY_AGGREGATED_DATA, { data: data, tmcs: TMCs });
		}
	},
	getTMCData: function(tmc) {
		return TMCdata[tmc];
	},
	getCrossFilter: function() {
		return crossfilter.session();
	},
    getTMCCrossFilter: function() {
        var cf = TMCCrossFilter();
        TMC_CrossFilter_List.push(cf);
        return cf;
    },
    getWebWorker: function() {
        var worker = WebWorker();
        WEB_WORKERS.push(worker);
        return worker;
    },
	getTMCcolor: function(tmc) {
		return colorMapper(tmc);
	},
	getTMCname: function(tmc) {
		var name = nameMapper(tmc);
//console.log("TMCDataStore.getTMCname", tmc, name);
		if (!name || !name.length) {
			return tmc.toString();
		}
		return name;
	},
	getParams: function() {
		return controlPanelParams;
	}
})

TMCDataStore.dispatchToken = AppDispatcher.register(function(payload) {
    var action = payload.action;

    switch(action.type) {
    	case ActionTypes.RECEIVED_TMC_DATA:
    		TMCDataStore.receiveTMCdata(action.tmcs, action.data);
    		break;
		case ActionTypes.CONTROL_PANEL_PARAMS_LOADED:
			controlPanelParams = action.params;
			break;
    }
});

function parseData(data) {
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
		obj.tmc = new TMC(obj.tmc);
		obj.time = (obj["date"]*1000) + (obj["epoch"]);
		obj.hour = (obj["date"]*100) + (Math.floor(obj["epoch"]/12));
		return obj;
	});
}

function TMCstring2number(tmc) {
	var regex = /(\d{3})([NP])(\d{5})/,
		match = regex.exec(tmc);

	var tmcNum = (+match[1])*100000 + (+match[3]);
	if (match[2] == "N") {
		return -tmcNum;
	}
	return tmcNum;
}

function TMC(tmc) {
	// if (tmc == "combined") {
	// 	this.__tmcString__ = "combined-"+UNIQUE_COMBINED_TMCs++;
	// 	this.__tmcNumber__ = 13370000+UNIQUE_COMBINED_TMCs;
	// }
	// else {
		this.__tmcString__ = tmc;
		this.__tmcNumber__ = TMCstring2number(tmc);
	// }
}
TMC.prototype.toString = function() {
	return this.__tmcString__;
}
TMC.prototype.valueOf = function() {
	return this.__tmcNumber__;
}

function TMCNameMapper() {
	var TMCmap = d3.map();

	function mapper(TMC) {
		var tmc = TMC.toString();
		if (TMCmap.has(tmc)) {
			return TMCmap.get(tmc);
		}
		return "";
	}
	mapper.add = function(tmc, name) {
		TMCmap.set(tmc.toString(), name);
		return mapper;
	}
	return mapper;
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
