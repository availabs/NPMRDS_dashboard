'use strict';
/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 */

var AppDispatcher = require('../dispatcher/AppDispatcher'),
    Constants = require('../constants/AppConstants'),
    EventEmitter = require('events').EventEmitter,
    assign = require('object-assign'),
    ServerActionCreators = require('../actions/ServerActionsCreator'),

    SailsWebApi = require("../utils/api/SailsWebApi"),
    GeoStore = require("./GeoStore"),

    TMCDataStore = require("./TMCDataStore"),

    Events = Constants.EventTypes,
    CHANGE_EVENT = 'change',

    ActionTypes = Constants.ActionTypes,

    geomShifter = GeometryShifter(),
	dataPointSlider = DataPointSlider(),
	linkShader = LinkShader(),
	dataPointCollectionsManager = DataPointCollectionsManager(),
	DataViews = ["Speed", "Congestion", "Time", "Flow"],
	dataView = DataViews[0];

/**
* usage data cache object
*/
var usageData = {};

dataPointSlider
	.width(1300)
	.height(50)
	.update(function(d) {
		linkShader
			.reverse(dataView == "Congestion" || dataView == "Time")
			.data(d);
		UsageDataStore.emitEvent(Events.DATA_POINT_SLIDER_UPDATE);
		UsageDataStore.emitEvent(Events.USAGE_DATA_PROCESSED);
	});

dataPointCollectionsManager.init();

var UsageDataStore = assign({}, EventEmitter.prototype, {
	emitChange: function() {
    	this.emit(CHANGE_EVENT);
  	},

	emitEvent: function(Event, data) {
		this.emit(Event, data);
	},

	addChangeListener: function(Event, callback) {
	    this.on(Event, callback);
	},
  
  	removeChangeListener: function(Event, callback) {
    	this.removeListener(Event, callback);
  	},

	loadData: function(params) {
		dataPointCollectionsManager.reset();

		var loadedRoads = GeoStore.getLoadedRoads();

		if (!loadedRoads.length) {
			return;
		}

		params.links = loadedRoads.map(function(road) { return road.properties.linkID; });
		SailsWebApi.getCountyUsageData(36, params);

		//console.log('data is loading')
		UsageDataStore.emitChange();
	},
	linkShader: function() {
		return linkShader;
	},

	setSVG: function(svg) {
		//console.log("SETTING SVG", svg);
		dataPointSlider.svg(svg)
			.init();
	},

	getDataViews: function() {
		return {
			DataViews: DataViews,
			current: dataView
		}
	}
})

UsageDataStore.dispatchToken = AppDispatcher.register(function(payload) {
	var action = payload.action;

  	switch(action.type) {
  		case ActionTypes.RECEIVE_COUNTY_DATA:
console.log("RECEIVE_COUNTY_DATA::usageData", action.usageData);
  			processUsageData(action.usageData, action.params);
			UsageDataStore.emitChange();
/*
####################
testing purposes
####################
*/

TMCDataStore.addTMC(["120P17024","120P17023","120P17022","120P17021","120P17020","120P17019","120P17018"]);

/*
####################
*/
  		break;
  		
  		case ActionTypes.DATA_VIEW_CHANGE:
  			dataView = action.view;
  			switchDataView();
  			UsageDataStore.emitEvent(Events.TMC_DATAVIEW_CHANGE, dataView);
  			break;
  	}
});

module.exports = UsageDataStore;

function processUsageData(usageData, params) {
	var loadedRoadsByCounty = GeoStore.getLoadedRoadsByCounty(),
		shiftedRoadsByCounty = {},
		linkIDmap = {},
		regex = /\d{3}([nNpP])\d{5}/;

	dataPointSlider.resolution(params.resolution);

	usageData.forEach(function(point) {
		dataPointCollectionsManager.addPoint(point.point, params.resolution);

		for (var linkID in point.links) {
			if (!(linkID in linkIDmap)) {
				linkIDmap[linkID] = d3.map();
			}

			for (var tmc in point.links[linkID]) {

				var d = point.links[linkID][tmc],
					dist = +d.length,
					time = +d.travelTime;

				var speed = dist/(time/3600),
					freeflowSpeed = dist/(d.freeflow/3600),
					difference = 100*(freeflowSpeed-speed)/freeflowSpeed;

				linkIDmap[linkID].set(tmc, {length: d.length, linkDir: d.linkDirection, travelDir: d.travelDirection});

				var data = {
					Speed: speed,
					Flow: freeflowSpeed,
					Congestion: difference,
					Time: d.travelTime
				}

				dataPointCollectionsManager.data(point.point, linkID, tmc, data);
			}
		}
	})

	for (var fips in loadedRoadsByCounty) {
		var features = loadedRoadsByCounty[fips],
			newFeatures = [];

		features.forEach(function(feature) {
			var linkID = feature.properties.linkID;
			if (linkID in linkIDmap) {
				linkIDmap[linkID].forEach(function(tmc, data) {
					var dir = tmc.match(regex)[1],
						direction = (/[Nn]/.test(dir) ? -1.0 : 1.0);

					if (/[Nn]/.test(dir) && /[Tt]/.test(data.linkDir)) {
						direction *= -1;
					}
					else if (/[Pp]/.test(dir) && /[Ff]/.test(data.linkDir)) {
						direction *= -1;
					}
					var newFeature = {
							type: "Feature",
							geometry: (feature.properties.direction == "B" ? geomShifter(feature.geometry, direction) : feature.geometry),
							properties: getProperties(feature.properties)
						};

					newFeature.properties.tmc = tmc;
					newFeature.properties.linkDir = data.linkDir;
					newFeature.properties.travelDir = data.travelDir;
					newFeatures.push(newFeature);
				})
			}
			else {
				newFeatures.push(feature);
			}
		})

		shiftedRoadsByCounty[fips] = newFeatures;
	}

	GeoStore.setShiftedRoads(shiftedRoadsByCounty);

	dataPointCollectionsManager.sort()
		.dataLoaded(true)
			(dataView, function(d) {

				linkShader
					.domain(d.domain());

				dataPointSlider
					.data(d.data())
					.show();
			})
}

function switchDataView() {
	dataPointCollectionsManager(dataView, function(d) {
		linkShader
			.domain(d.domain());

		dataPointSlider
			.data(d.data())
			.update();

		// legend.label(d.unitLabel())();
	})
}

function GeometryShifter() {
	var adjustment = 3000.0;

	function shifter(geometry, direction) {
		var newGeometry = {
				type: geometry.type,
				coordinates: null
			}
		switch (geometry.type) {
			case "linestring":
			case "LineString":
				newGeometry.coordinates = shiftLineString(geometry.coordinates, direction);
				break;
			case "multilinestring":
			case "MultiLineString":
				newGeometry.coordinates = geometry.coordinates.map(function(d) { return shiftLineString(d, direction); });
				break;
			default:
				newGeometry.coordinates = getCoordinates(geometry.coordinates);
		}
		return newGeometry;
	}
	shifter.adjustment = function(a) {
		if (!arguments.length) {
			return adjustment;
		}
		adjustment = a;
		return shifter;
	}

	return shifter;

	function getCoordinates(coordinates) {
		if (Array.isArray(coordinates)) {
			return coordinates.map(getCoordinates);
		}
		return coordinates;
	}

	function shiftLineString(lineString, direction) {
		var newLineString = [];

		for (var i = 1, len = lineString.length; i < len; i++) {
			newLineString.push(shiftPoint(lineString[i-1], lineString[i], direction));
		}
		newLineString.push(shiftPoint(lineString[i-1], lineString[i-2], -direction));
		return newLineString;
	}

	function shiftPoint(point1, point2, direction) {
		var vector = [point2[0]-point1[0], point2[1]-point1[1]],
			magnitude = Math.sqrt(vector[0]*vector[0]+vector[1]*vector[1])*adjustment;
		if (!magnitude) {
			return point1;
		}
		var shift = [direction*vector[1]/magnitude, -direction*vector[0]/magnitude];
		return [point1[0]+shift[0], point1[1]+shift[1]];
	}
}

function getProperties(properties) {
	var props = {};

	for (var key in properties) {
		props[key] = properties[key];
	}
	return props;
}

function DataPointCollectionsManager() {
	var dataPointCollections = {},
		activeCollection = null,
		points = [],
		resolution,
		dataLoaded = false;

	function manager(label, cb) {
		if (dataLoaded) {
			if (label in dataPointCollections) {
				activeCollection = dataPointCollections[label];
			}
			cb(activeCollection);
		}
	}
	manager.init = function() {
		DataViews.forEach(function(label) {
			var collection = DataPointCollection()

			switch (label) {
				case "Speed":
				case "Flow":
					collection.unitLabel("MPH");
					break;
				case "Congestion":
					collection.unitLabel("% Diff.");
					break;
				case "Time":
					collection.unitLabel("Seconds");
					break;
			}

			dataPointCollections[label] = collection;
		})
	}
	manager.unitLabel = function() {
		return activeCollection.unitLabel();
	}
	manager.addPoint = function(point, resolution) {
		if (points.reduce(function(p, c) { return p || (c == point); }, false)) {
			return;
		}
		points.push(point);

		for (var key in dataPointCollections) {
			dataPointCollections[key].addPoint(point, resolution);
		}
	}
	manager.data = function(point, linkID, tmc, data) {
		for (var key in dataPointCollections) {
			dataPointCollections[key].data(point, linkID, tmc, data[key]);
			dataPointCollections[key].domain(data[key]);
		}
	}
	manager.dataLoaded = function(bool) {
		if (!arguments.length) {
			return dataLoaded;
		}
		dataLoaded = bool;
		return manager;
	}
	manager.reset = function() {
		for (var key in dataPointCollections) {
			dataPointCollections[key].reset();
		}
		points = [];
		dataLoaded = false;
		return manager;
	}
	manager.sort = function() {
		for (var key in dataPointCollections) {
			dataPointCollections[key].sort();
		}
		return manager;
	}
	return manager;
}

function DataPointCollection() {
	var data = [],
		dataIndexMap = {},
		domain = [],
		unitLabel = "";

	var _WEEKDAYS_MAP_ = {
		sunday: 0,
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6
	}

	function collection() {

	}
	collection.reset = function() {
		data = [];
		dataIndexMap = {};
		domain = [];
		return collection;
	}
	collection.addPoint = function(point, resolution) {
		var dataPoint = UsageDataPoint()
				.point(point)
				.resolution(resolution),

			index = data.length;


		if (resolution == "weekday") {
			var val = function(d) { return _WEEKDAYS_MAP_[d]; };
			dataPoint.value(val);
		}

		dataIndexMap[point] = index;

		// if (resolution == "weekday") {
		// 	var val = function(d) { return _WEEKDAYS_MAP_[d]; };
		// 	dataPoint.value(val);
		// }

		data.push(dataPoint);
	}
	collection.data = function(point, linkID, tmc, value) {
		if (!arguments.length) {
			return data;
		}

		data[dataIndexMap[point]].add(linkID, tmc, value);

		return collection;
	}
	collection.domain = function(d) {
		if (!arguments.length) {
			return domain;
		}
		domain.push(d);
		return collection;
	}
	collection.unitLabel = function(l) {
		if (!arguments.length) {
			return unitLabel;
		}
		unitLabel = l;
		return collection;
	}
	collection.sort = function() {
		data.sort(function(a, b) { return a.value()-b.value(); });
		return collection;
	}
	return collection;
}

function UsageDataPoint() {
	var point = 0,
		resolution = null,
		data = {},
		valueFunc = function(d) { return +point; };

	function datapoint() {
		return data;
	}
	datapoint.point = function(p) {
		if (!arguments.length) {
			return point;
		}
		point = p;
		return datapoint;
	}
	datapoint.resolution = function(r) {
		if (!arguments.length) {
			return resolution;
		}
		resolution = r;
		return datapoint;
	}
	datapoint.add = function(linkID, tmc, value) {
		if (!data[linkID]) {
			data[linkID] = {};
		}
		data[linkID][tmc] = value;
		return datapoint;
	}
	datapoint.value = function(v) {
		if (!arguments.length) {
			return valueFunc(point);
		}
		valueFunc = v;
		return datapoint;
	}

	return datapoint;
}

function AxisTickFormatter() {
	var resolution = "",
		MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
					"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	function formatter(d) {
		return formatter[resolution](d);
	}
	formatter.resolution = function(r) {
		if (!arguments.length) {
			return resolution;
		}
		resolution = r;
		if (resolution == "15-minute") {
			resolution = "minute";
		}
		return formatter;
	}
	formatter.year = function(d) {
		return d;
	}
	formatter.month = function(d) {
		return MONTHS[+d];
	}
	formatter.day = function(d) {
		return d;
	}
	formatter.weekday = function(d) {
		return d;
	}
	formatter.hour = function(d) {
		return d+":00-"+d+":59";
	}
	formatter.minute = function(d) {
		var hour = Math.floor((d*15.0)/60.0),
			format = d3.format("02d");
		return hour+":"+format(Math.floor(d*15)%60)/*+"-"+
			hour+":"+format(Math.floor(d*15)%60+14)*/;
	}
	return formatter;
}

function DataPointSlider() {
	var dataPoints = [],
		dataPointIndex = 0,
		svg,
		controlsGroup,
		controlsDiv,
		width = 1100,
		height = 50,
		margin = { left: 30, right: 30 },
		scale = d3.scale.ordinal(),
		sliderGroup,
		brush = d3.svg.brush()
			.x(scale)
			.extent([0, 0])
			.on('brush', slider),
		axisGroup,
		axis = d3.svg.axis()
			.scale(scale)
			.orient("bottom"),
		handle,
		dataPoint = 0,
		position = d3.scale.quantize(),
		updateFunc = null,
		formatFunc = AxisTickFormatter(),
		interval = null;

	function slider(index) {
		var pos, value, point=dataPoint;

		if (d3.event && d3.event.sourceEvent) {
			pos = d3.mouse(this)[0];
	    	value = position(pos);
	    	point = dataPoints[value].point();

		    brush.extent([pos, pos]);
		    dataPointIndex = value;
		}
		else if (typeof index === "number") {
			index = (index+dataPoints.length)%dataPoints.length;

			pos = scale(index);
	    	value = index;
	    	point = dataPoints[value].point();
		    	
		    brush.extent([pos, pos]);
		    dataPointIndex = index;
		}

		if (point != dataPoint) {
			var data = dataPoints[value]();
			updateFunc(data);
			dataPoint = point;
		}
		handle.attr("cx", scale(dataPoint));
	}
	slider.resolution = function(r) {
		if (!arguments.length) {
			return formatFunc.resolution();
		}
		formatFunc.resolution(r);
		return slider;
	}
	slider.update = function(f) {
		if (!arguments.length) {
			var index = position(brush.extent()[0]);
			updateFunc(dataPoints[index]());
			return;
		}
		updateFunc = f;
		return slider;
	}
	slider.show = function() {
		if (dataPoints.length > 1) {
			UsageDataStore.emitEvent(Events.DATA_POINT_SLIDER_SHOW, true);
			// svg.style("display", "block");
			axisGroup.transition().call(axis);
			axisGroup.selectAll("text").each(function(d, i) {
				if (i%2) {
					d3.select(this).style("transform", "translate(0,-25px)");
				}
			})
			if (interval) {
				clearInterval(interval);
			}
			interval = setInterval(advanceSlider, 2000);
			dataPointIndex = 0;
		}
		else {
			if (interval) {
				clearInterval(interval);
				interval = null;
			}
			slider.hide();
		}

		// brush.extent([0, 0]);
		// sliderGroup.call(brush.event);

		var data = dataPoints.length ? dataPoints[0]() : {};
		updateFunc(data);
	}
	function advanceSlider() {
		slider(++dataPointIndex);
	}
	slider.hide = function() {
		// svg.style("display", "none");
		UsageDataStore.emitEvent(Events.DATA_POINT_SLIDER_SHOW, false);
	}
	slider.init = function() {

		scale.rangePoints([0, width-margin.left-margin.right]);
		position.domain([0, width-margin.left-margin.right]);

		svg.attr("transform", "translate("+(margin.left)+", 0)");

		axisGroup = svg.append("g")
			.attr("class", "x axis")
		    .attr("transform", "translate(0,"+(height/2)+")");

		sliderGroup = svg.append('g')
			.attr("class", "NPMRDS-slider slider")
			.call(brush);

		sliderGroup.selectAll(".extent,.resize")
		    .remove();

		sliderGroup.select(".background")
		    .attr("height", height);

		handle = sliderGroup.append("circle")
		    .attr("class", "handle")
		    .attr("transform", "translate(0,25)")
		    .attr("r", 9);

		axis.tickFormat(formatFunc);

		controlsDiv = d3.select("#NPMRDS-data-point-slider-div")
			.append("div").attr("id", "NPMRDS-data-point-slider-controls");

		controlsDiv.append("span").attr("class", "glyphicon glyphicon-backward")
			.on("click", function() {
				dataPointIndex = 0;
				slider(dataPointIndex);
			})
		controlsDiv.append("span").attr("class", "glyphicon glyphicon-step-backward")
			.on("click", function() {
				slider(--dataPointIndex);
			})
		controlsDiv.append("span").attr("class", "glyphicon glyphicon-pause")
			.on("click", function() {
				if (interval) {
					clearInterval(interval);
					interval = null;
					d3.select(this).attr("class", "glyphicon glyphicon-play");
				}
				else {
					interval = setInterval(advanceSlider, 2000);
					d3.select(this).attr("class", "glyphicon glyphicon-pause");
				}
			})
		controlsDiv.append("span").attr("class", "glyphicon glyphicon-step-forward")
			.on("click", function() {
				slider(++dataPointIndex);
			})
		controlsDiv.append("span").attr("class", "glyphicon glyphicon-forward")
			.on("click", function() {
				dataPointIndex = dataPoints.length-1;
				slider(dataPointIndex);
			})

		// controlsGroup.append("polygon")
		// 	.attr("points", "10,25 40,10, 40,40")
		// 	.attr("stroke", "none")
		// 	.attr("fill", "#00a")
		// 	.on("click", function() {
		// 		slider(--dataPointIndex);
		// 	});

		// controlsGroup.append("rect")
		// 	.attr("x", 50).attr("y", 10)
		// 	.attr("width", 30)
		// 	.attr("height", 30)
		// 	.attr("stroke", "none")
		// 	.attr("fill", "#0a0")
		// 	.on("click", function() {
		// 		if (interval) {
		// 			clearInterval(interval);
		// 			interval = null;
		// 			d3.select(this).attr("fill", "#a00");
		// 		}
		// 		else {
		// 			interval = setInterval(advanceSlider, 2000);
		// 			d3.select(this).attr("fill", "#0a0");
		// 		}
		// 	})

		// controlsGroup.append("polygon")
		// 	.attr("points", "120,25 90,10, 90,40")
		// 	.attr("stroke", "none")
		// 	.attr("fill", "#00a")
		// 	.on("click", function() {
		// 		slider(++dataPointIndex);
		// 	});
	}
	slider.data = function(d) {
		if (!arguments.length) {
			return dataPoints;
		}
		dataPoints = d;
		scale.domain(d.map(function(f) { return f.point(); }));
		position.range(d3.range(d.length));
		return slider;
	}
	slider.svg = function(s) {
		if (!arguments.length) {
			return svg;
		}
		controlsGroup = s.append("g")
		svg = s.style("width", width+"px")
			.style("height", height+"px")
			.append("g");
		// svg = s.append("g")
		// 	.style("display", "none");
		return slider;
	}
	slider.width = function(w) {
		if (!arguments.length) {
			return width;
		}
		width = w;
		return slider;
	}
	slider.height = function(h) {
		if (!arguments.length) {
			return height;
		}
		height = h;
		return slider;
	}
	slider.dataPoint = function() {
		return dataPoint;
	}

	return slider;
}

function LinkShader() {
	var data = {},
		colors = ["#a50026","#d73027","#f46d43","#fdae61","#fee08b",
					"#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"],
		scale = d3.scale.quantile()
			.range(colors);

	function shader(feature) {
		var congestion = data[feature.properties.linkID] ? 
				data[feature.properties.linkID][feature.properties.tmc] || -1 : -1;
		return (congestion > 0 ? scale(congestion) : "#000");
	}

	shader.domain = function(d) {
		if (!d) {
			return scale.domain();
		}
		scale.domain(d);

		return shader;
	}
	shader.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return shader;
	}
	shader.scale = function(s) {
		if (!arguments.length) {
			return scale;
		}
		scale = s;
		return shader;
	}
	shader.reverse = function(bool) {
		if (bool) {
			scale.range(colors.slice().reverse());
		}
		else {
			scale.range(colors.slice());
		}
		return shader;
	}

	return shader;
}