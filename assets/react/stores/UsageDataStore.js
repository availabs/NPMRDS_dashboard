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
var usageData = {},
	_loadingState=false;

/**
* data point slider object
*/
var _slider = null;


dataPointSlider
	.width(1000)
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

	getUsageData: function() {
		return usageData;
	},

	loadData: function(params) {
		dataPointCollectionsManager.reset();

		var loadedRoads = GeoStore.getLoadedRoads();

		if (!loadedRoads.length) {
			return;
		}

		params.links = loadedRoads.map(function(road) { return road.properties.linkID; });
		SailsWebApi.getCountyUsageData(36, params);
		_loadingState = true;
		//console.log('data is loading')
		UsageDataStore.emitChange();
	},

	getLoadingState:function(){
		return _loadingState;
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
  			usageData = action.usageData;
console.log("USAGE_DATA",usageData);
  			processUsageData(action.params);
  			_loadingState = false;
			UsageDataStore.emitChange();
  		break;
  		
  		case ActionTypes.DATA_VIEW_CHANGE:
  			dataView = action.view;
  			switchDataView();
  			UsageDataStore.emitChange();
  			break;
  	}
});

module.exports = UsageDataStore;

function processUsageData(params) {
  	//console.log("processUsageData", usageData);

	var loadedRoadsByCounty = GeoStore.getLoadedRoadsByCounty(),
		shiftedRoadsByCounty = {},
		linkIDmap = {},
		regex = /\d{3}([nNpP])\d{5}/;

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
	//console.log("processUSageData, sending: shiftedRoadsByCounty")
	//ServerActionCreators.receiveShiftedCountyRoads(shiftedRoadsByCounty);

	dataPointCollectionsManager.sort()
		.dataLoaded(true)
			(dataView, function(d) {

				linkShader
					.domain(d.domain());

				dataPointSlider
					.data(d.data())
					.show();

				// legend.label(d.unitLabel());
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
				.point(point),

			index = data.length;


		if (resolution == "weekday") {
			var val = function(d) { return _WEEKDAYS_MAP_[d]; };
			dataPoint.value(val);
		}

		dataIndexMap[point] = index;

		if (resolution == "weekday") {
			var val = function(d) { return _WEEKDAYS_MAP_[d]; };
			dataPoint.value(val);
		}

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

function DataPointSlider() {
	var dataPoints = [],
		svg,
		width = 1000,
		height = 500,
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
		updateFunc = null;

	function slider() {
		var value = brush.extent()[0];

		if (d3.event.sourceEvent) {
		    value = position(d3.mouse(this)[0]);
		    brush.extent([value, value]);

		    var point = dataPoints[value].point();

			if (point != dataPoint) {
				var data = dataPoints[value]();
				updateFunc(data);
				dataPoint = point;
			}
		}

		handle.attr("cx", scale(point));
	}
	slider.update = function(f) {
		if (!arguments.length) {
			updateFunc(dataPoints[brush.extent()[0]]());
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
		}
		else {
			slider.hide();
		}

		brush.extent([0, 0]);
		sliderGroup.call(brush.event);

		var data = dataPoints.length ? dataPoints[0]() : {};
		updateFunc(data);
	}
	slider.hide = function() {
		// svg.style("display", "none");
		UsageDataStore.emitEvent(Events.DATA_POINT_SLIDER_SHOW, false);
	}
	slider.init = function() {
		var wdth = width-50,
			hght = height;

		scale.rangePoints([0, wdth]);
		position.domain([0, wdth]);

		svg.attr("transform", "translate("+((width-wdth)/2)+", 0)");

		axisGroup = svg.append("g")
			.attr("class", "x axis")
		    .attr("transform", "translate(0,25)");

		sliderGroup = svg.append('g')
			.attr("class", "NPMRDS-slider slider")
			.call(brush);

		sliderGroup.selectAll(".extent,.resize")
		    .remove();

		sliderGroup.select(".background")
		    .attr("height", 50);

		handle = sliderGroup.append("circle")
		    .attr("class", "handle")
		    .attr("transform", "translate(0,25)")
		    .attr("r", 9);
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
		svg = s.append("g");
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