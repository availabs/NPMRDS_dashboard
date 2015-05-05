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

var UNIQUE_IDs = 0;

function CrossFilter() {
	var cross_filter = cf(),

	// available crossfilter dimensions
		tmc_Dimension = cross_filter.dimension(function(d) { return d.tmc; }),
		//travel_time_all_Dimension = cross_filter.dimension(function(d) { return d.travel_time_all; }),
		travel_time_truck_Dimension = cross_filter.dimension(function(d) { return d.travel_time_truck; }),
		weekday_Dimension = cross_filter.dimension(function(d) { return d.weekday; }),

		year_Dimension = cross_filter.dimension(function(d) { return Math.floor(d.date/10000); }),
		month_Dimension = cross_filter.dimension(function(d) { return Math.floor(d.date/100)%100; }),
		day_Dimension = cross_filter.dimension(function(d) { return d.date%100; }),
		hour_Dimension = cross_filter.dimension(function(d) { return Math.floor(d.epoch/12); }),
		epoch_Dimension = cross_filter.dimension(function(d) { return d.epoch; }),

		yyyymm_Dimension = cross_filter.dimension(function(d) { return Math.floor(d.date/100); }),
		yyyymmdd_Dimension = cross_filter.dimension(function(d) { return d.date; }),
		yyyymmddhh_Dimension = cross_filter.dimension(function(d) { return (d.date*100) + Math.floor(d.epoch/12); }),
		yyyymmddeee_Dimension = cross_filter.dimension(function(d) { return d.time; });

	weekday_Dimension.filter(function(weekday) { return weekday < 5; });

	var TMC_group = tmc_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		truck_group = travel_time_truck_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		weekday_group = weekday_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),

		year_group = year_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		month_group = month_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		day_group = day_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		hour_group = hour_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		epoch_group = epoch_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),

		yyyymm_group = yyyymm_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		yyyymmdd_group = yyyymmdd_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		yyyymmddhh_group = yyyymmddhh_Dimension.group(),//.reduce(reduceAdd, reduceRemove, reduceInitial),
		yyyymmddeee_group = yyyymmddeee_Dimension.group();//.reduce(reduceAdd, reduceRemove, reduceInitial);

	var dimensionMap = {
		tmc: tmc_Dimension,
		truck: travel_time_truck_Dimension,
		weekday: weekday_Dimension,
		year: year_Dimension,
		month: month_Dimension,
		day: day_Dimension,
		hour: hour_Dimension,
		epoch: epoch_Dimension,
		yyyymm: yyyymm_Dimension,
		yyyymmdd: yyyymmdd_Dimension,
		yyyymmddhh: yyyymmddhh_Dimension,
		yyyymmddeee: yyyymmddeee_Dimension
	}

	var groupMap = {
		tmc: TMC_group,
		truck: truck_group,
		weekday: weekday_group,
		year: year_group,
		month: month_group,
		day: day_group,
		hour: hour_group,
		epoch: epoch_group,
		yyyymm: yyyymm_group,
		yyyymmdd: yyyymmdd_group,
		yyyymmddhh: yyyymmddhh_group,
		yyyymmddeee: yyyymmddeee_group
	}

	var dispatcher = d3.dispatch("crossfilterupdate");

	var CURRENT_SESSION = null;

	function crossfilter(session, group) {
		if (session.id() != CURRENT_SESSION) {
			CURRENT_SESSION = session.id();
			session.applyFilters();
		}
		if (group == "all") {
			var data = cross_filter.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial).value();
			calcIndices(data, data.values)
			return data;
		}
		return groupMap[group].reduce(reduceAdd, reduceRemove, reduceInitial).all()
			.filter(function(d) {
				if (!d.value.count) return false;
				calcIndices(d.value, d.value.values);
				return true;
			})
	}
	crossfilter.on = function(e, l) {
		if (arguments.length == 1) {
			return dispatcher.on(e);
		}
		if (arguments.length == 2) {
			dispatcher.on(e, l);
		}
		return crossfilter;
	}
	crossfilter.add = function(d) {
		cross_filter.add(d);
		dispatcher.crossfilterupdate(crossfilter);
		return crossfilter;
	}
	crossfilter.filter = function(session, dimension, filter) {
		if (session.id() != CURRENT_SESSION) {
			CURRENT_SESSION = session.id();
			session.applyFilters();
		}
		dimensionMap[dimension].filter(filter);
		return crossfilter;
	}
	crossfilter.session = function() {
		return CrossFilerSession(crossfilter);
	}
	crossfilter.size = function() {
		return cross_filter.size();
	}
	return crossfilter;

	function calcIndices(obj, values) {
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
	function reduceAdd(accum, curr) {
		accum.sum += (curr.travel_time_all || 0);
		accum.count++;
		accum.tmc = curr.tmc;
		accum.distance = curr.distance;

		accum.values.push(curr.travel_time_all);

	  	return accum;
	}
	function reduceRemove(accum, curr) {
		accum.sum -= curr.travel_time_all;
		accum.count--;
		accum.tmc = curr.tmc;
		accum.distance = curr.distance;

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
}

function CrossFilerSession(crossfilter) {
	var id = "CFsession-"+UNIQUE_IDs++,
		filtersMap = {
			tmc: null,
			truck: null,
			weekday: function(weekday) { return weekday < 5; },
			year: null,
			month: null,
			day: null,
			hour: null,
			epoch: null,
			yyyymm: null,
			yyyymmdd: null,
			yyyymmddhh: null,
			yyyymmddeee: null
		};

	function session(group) {
		return crossfilter(session, group);
	}
	session.id = function() {
		return id;
	}
	session.add = function(d) {
		crossfilter.add(d);
		return session;
	}
	session.filter = function(dimension, filter) {
		filtersMap[dimension] = filter;
		crossfilter.filter(session, dimension, filter);
		return session;
	}
	session.size = function() {
		return crossfilter.size();
	}
	session.applyFilters = function() {
		for (var dimension in filtersMap) {
			crossfilter.filter(session, dimension, filtersMap[dimension]);
		}
		return session;
	}
	return session;
}

module.exports = CrossFilter;