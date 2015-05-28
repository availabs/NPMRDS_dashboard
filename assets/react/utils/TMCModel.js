var crossfilter = require("crossfilter")();

var tmc_Dimension = crossfilter.dimension(function(d) { return d.tmc.valueOf(); }),
	hour_Dimension = crossfilter.dimension(function(d) { return d.hour%100; }),

	hour_group = hour_Dimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

var currentTMC = null,
	currentHour = null;

var loadedTMCs = {}

function TMCModel() {
	var modelData = {};

	function model() {

	}
	model.add = function(tmc, d) {
		if (!loadedTMCs[tmc]) {
			loadedTMCs[tmc] = true;
			crossfilter.add(d);
		}
		return model;
	}
var x = 0;
	model.getHour = function(tmc, hour) {
		if (tmc != currentTMC) {
			tmc_Dimension.filter(tmc);
			currentTMC = tmc;
		}
		var cfData = hour_group.all().filter(function(d) { return d.key==hour && d.value.count; });
		return {
			sum: d3.sum(cfData, function(d){return d.value.sum;}),
			count: d3.sum(cfData, function(d){return d.value.count;}),
			distance: cfData[0].value.distance,
			tmc: cfData[0].value.tmc,
			values: d3.merge(cfData.map(function(d) { return d.value.values }))
		}
	}
	return model;
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

module.exports = TMCModel;