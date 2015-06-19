// var crossfilter = require("crossfilter")();

// var tmc_Dimension = crossfilter.dimension(function(d) { return d.tmc.valueOf(); }),
// 	date_Dimension = crossfilter.dimension(function(d) { return d.date; }),
// 	epoch_Dimension = crossfilter.dimension(function(d) { return d.epoch; }),

// 	epoch_group = epoch_Dimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

var loadedTMCs = {};

var EPOCHS_PER_DAY = 288;

function TMCModel() {
	var modelData = {};

	var model = {
		add: function(tmc, data) {
			loadedTMCs[tmc] = data.slice().sort(function(a, b) { return a.time-b.time; });
			return model;
		},
		get: function(tmc, time) {
			// var data = loadedTMCs[tmc].filter(function(d) { return d.time==time; });

			// if (data.length) {
			// 	return data[0];
			// }
			
			var points = getNearest(tmc, time);

			if (points.length == 1) {
				return points[0];
			}

			var x0 = totalEpochs(points[0].date, points[0].epoch),
				x1 = totalEpochs(points[1].date, points[1].epoch),

				slope = (points[0].travel_time_all-points[1].travel_time_all)/(x0-x1),

				x = totalEpochs(Math.floor(time/1000), time%1000);

if (!(x0<x&&x<x1)) {
	console.log(points[0].time, time, points[1].time);
	console.log(x0, x, x1);
}

		}
	}

	return model;
}

module.exports = TMCModel;

function getNearest(tmc, time) {
	var data = loadedTMCs[tmc];
	for (var i = data.length-1; i > -1; --i) {
		if (data[i].time < time) {
			return data.slice(i, i+2);
		}
	}
	return [data[0]];//loadedTMCs[tmc].slice(0, 1);
}

function totalEpochs(date, epoch) {
	var day = date%100,
		month = Math.floor(date/100)%100,
		year = Math.floor(date/10000)-2000;

	return epoch + --day*EPOCHS_PER_DAY + totalDays(--month, year)*EPOCHS_PER_DAY + (--year*365+Math.floor(year/4))*EPOCHS_PER_DAY;
}

function totalDays(month, year) {
	switch (month) {

		case 0: 
			return 0;
		case 1: case 3: case 5: case 7: case 8: case 10: case 12:
			return 31+totalDays(--month, year);
		case 2:
			return 28 + !(year%4) + totalDays(--month, year);
		default:
			return 30 + totalDays(--month, year);
	}
}

function reduceAdd(accum, curr) {
	if (!curr.travel_time_all) {
		return accum;
	}
	accum.sum += curr.travel_time_all;
	++accum.count;
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
	--accum.count;

	for (var i = 0; i < accum.values.length; ++i) {
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