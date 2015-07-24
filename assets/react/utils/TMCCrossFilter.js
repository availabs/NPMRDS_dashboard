var cf = require("crossfilter"),
	d3 = require("d3");

var WEEKDAYS = {
	"monday": 0,
	"tuesday": 1,
	"wednesday": 2,
	"thursday": 3,
	"friday": 4,
	"saturday": 5,
	"sunday": 6
}

function TMCCrossFilter() {
    var cross_filter = cf();

    var GroupFactory = {
		tmc: function() {
            dimensionMap.tmc = cross_filter.dimension(function(d) { return d.tmc; });
            groupMap.tmc = dimensionMap.tmc.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        },
		weekday: function() {
            dimensionMap.weekday = cross_filter.dimension(function(d) { return d.weekday; });
            groupMap.weekday = dimensionMap.weekday.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        },
		hour: function() {
            dimensionMap.hour = cross_filter.dimension(function(d) { return d.weekday; });
            groupMap.hour = dimensionMap.hour.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        },
		epoch: function() {
            dimensionMap.epoch = cross_filter.dimension(function(d) { return d.epoch; });
            groupMap.epoch = dimensionMap.epoch.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        },
		yyyymm: function() {
            dimensionMap.yyyymm = cross_filter.dimension(function(d) { return Math.floor(d.date/100); });
            groupMap.yyyymm = dimensionMap.yyyymm.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        },
		yyyymmdd: function() {
            dimensionMap.yyyymmdd = cross_filter.dimension(function(d) { return d.date; });
            groupMap.yyyymmdd = dimensionMap.yyyymmdd.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        },
		yyyymmddhh: function() {
            dimensionMap.yyyymmddhh = cross_filter.dimension(function(d) { return d.hour; });
            groupMap.yyyymmddhh = dimensionMap.yyyymmddhh.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        },
		yyyymmddeee: function() {
            dimensionMap.yyyymmddeee = cross_filter.dimension(function(d) { return d.time; });
            groupMap.yyyymmddeee = dimensionMap.yyyymmddeee.group().reduce(reduceAdd, reduceRemove, reduceInitial);
        }
    }

	var dimensionMap = {
		tmc: null,
		//truck: null,
		weekday: null,
		//year: null,
		//month: null,
		//day: null,
		hour: null,
		epoch: null,
		yyyymm: null,
		yyyymmdd: null,
		yyyymmddhh: null,
		yyyymmddeee: null
	}

	var groupMap = {
		tmc: null,
		//truck: null,
		weekday: null,
		//year: null,
		//month: null,
		//day: null,
		hour: null,
		epoch: null,
		yyyymm: null,
		yyyymmdd: null,
		yyyymmddhh: null,
		yyyymmddeee: null
	}

    function crossfilter(group) {
		if (group == "all") {
			var data = cross_filter.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial).value();

			crossfilter.calcIndices(data, data.values);

			return data;
		}
        if (!groupMap[group]) {
            GroupFactory[group]();
        }
		return groupMap[group].all().filter(function(d) {
				if (!d.value.count) return false;
				crossfilter.calcIndices(d.value, d.value.values);
				return true;
			})
	};
    crossfilter.add = function(d) {
		cross_filter.add(d);
		return crossfilter;
	}
    crossfilter.filter = function(dimension, filter) {
        if (!dimensionMap[dimension]) {
            GroupFactory[dimension]();
        }
		dimensionMap[dimension].filter(filter);
		return crossfilter;
	}
    crossfilter.calcIndices = function(obj, values) {
		values.sort(function(a, b) { return a-b; });
		obj.avgTime = obj.sum/obj.count;
		obj.avgSpeed = obj.distance/(obj.avgTime/3600);
		obj.median = d3.median(values);
		obj.eightieth = d3.quantile(values, 0.8);
		obj.nintyfifth = d3.quantile(values, 0.95);
		obj.nintyseventh = d3.quantile(values, 0.975);
		obj.stddevTime = values.length > 1 ? d3.deviation(values) : 0;
		obj.stddevSpeed = values.length > 1 ? d3.deviation(values.map(function(d) { return obj.distance/(d/3600); })) : 0;
		obj.bufferTime = (obj.nintyfifth-obj.avgTime)/obj.avgTime;
		obj.freeflow = d3.quantile(values, 0.7);
		obj.planningTime = obj.nintyfifth/obj.freeflow;
		obj.miseryIndex = obj.nintyseventh/obj.freeflow;
		obj.travelTimeIndex = obj.avgTime/obj.freeflow;
		obj.freeflow = obj.distance/(obj.freeflow/3600);
	}
	return crossfilter;
}

function reduceAdd(accum, curr) {
    if (!curr.travel_time_all) {
        return accum;
    }
    accum.sum += curr.travel_time_all;
    accum.count++;
    accum.tmc = curr.tmc;
    accum.distance = curr.distance;

    accum.values.push(curr.travel_time_all);

      return accum;
}
function reduceRemove(accum, curr) {
    if (!curr.travel_time_all) {
        return accum;
    }
    accum.sum -= curr.travel_time_all;
    accum.count--;

    for (var i = 0; i < accum.values.length; i++) {
        if (accum.values[i] == curr.travel_time_all) {
            accum.values[i] = accum.values[accum.values.length-1];
            accum.values.pop();
            break;
        }
    }

      return accum;
}
function reduceInitial() {
      return { sum: 0, count: 0, distance: -1, values: [], tmc: "" };
}

module.exports = TMCCrossFilter;
