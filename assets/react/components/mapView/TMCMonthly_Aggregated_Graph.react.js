"use strict"

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes,
    TMCDataStore = require("../../stores/TMCDataStore"),

	d3 = require("d3"),
	saveSvgAsPng = require('save-svg-as-png'),
	crossfilter = TMCDataStore.getCrossFilter(),

	TMCmodel = require("../../utils/TMCModel")(),


	UNIQUE_IDs = 0;

var currentView = "avgSpeed",
	currentTMC = null,
	weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

var LineGraph = React.createClass({
	getInitialState: function() {
		return {
			linegraph: Linegraph().id(UNIQUE_IDs++),
			labeller: Labeller()
		}
	},
	componentDidMount: function() {
		d3.select("#TMC-monthly-aggregated-graph-"+this.state.linegraph.id()).call(this.state.linegraph);
		// this.state.linegraph.on("graphupdate", this.updateGraph);

		d3.select("#TMC-monthly-aggregated-div-"+this.state.linegraph.id()).call(this.state.labeller);

		d3.select("#TMC-monthly-aggregated-div-"+this.state.linegraph.id()).style("display", "none");

		TMCDataStore.addChangeListener(Events.DISPLAY_AGGREGATED_DATA, this.TMCsAdded);

		TMCDataStore.addChangeListener(Events.TMC_DATAVIEW_CHANGE, this.dataviewChange);
	},
	componentWillUnmount: function() {
		TMCDataStore.removeChangeListener(Events.DISPLAY_AGGREGATED_DATA, this.TMCsAdded);
		
		TMCDataStore.removeChangeListener(Events.TMC_DATAVIEW_CHANGE, this.dataviewChange);
	},
	TMCsAdded: function(data) {
console.log(data);
		data.data.forEach(function(tmcData) {
			TMCmodel.add(tmcData[0].tmc, tmcData);
		})

		var mergedData = d3.merge(data.data).filter(function(d) { return d.weekday<5; });
		//TMCmodel.add(mergedData);

		var hourSet = d3.set();
		mergedData.forEach(function(d){hourSet.add(d.hour);});
		var hours = hourSet.values();
console.log("TMC_Monthly_Aggregated.TMCsAdded, mergedData completed");

		var nestedData = d3.nest()
			.key(function(d) { return d.tmc; })
			.key(function(d) { return d.hour; })
			.rollup(function(d) {
				return {
					sum: d3.sum(d, function(d) { return d.travel_time_all; }),
					count: d.length,
					distance: d[0].distance,
					tmc: d[0].tmc,
					values: d.map(function(d){return d.travel_time_all;})
				};
			})
			.entries(mergedData);
console.log("TMC_Monthly_Aggregated.TMCsAdded, nestedData completed");

		var dataMap = {},
			newData = [];

		nestedData.forEach(function(tmc) {
			dataMap[tmc.key] = {};
			tmc.values.forEach(function(hour) {
				dataMap[tmc.key][hour.key] = hour.values;
				hour.values.hour = hour.key;
				newData.push(hour.values);
			})
		})
console.log("TMC_Monthly_Aggregated.TMCsAdded, dataMap completed");

var x = 0;
		for (var tmc in dataMap) {
			hours.forEach(function(hour) {
				if (!(hour in dataMap[tmc])) {
					var nd = TMCmodel.getHour(tmc, (+hour)%100);
					nd.hour = hour;
					newData.push(nd);
					x++;
				}
			})
		}
console.log("TMC_Monthly_Aggregated.TMCsAdded, newData completed");

		var finalData = d3.nest()
			.key(function(d) { return Math.floor(d.hour/10000); })
			.key(function(d) { return d.hour%100; })
			.rollup(function(d) {
				return {
					sum: d3.sum(d, function(d) { return d.sum; }),
					count: d3.sum(d, function(d) { return d.count; }),
					distance: d[0].distance,
					tmc: d[0].tmc,
					values: d3.merge(d.map(function(d) { return d.values; }))
				};
			})
			.entries(newData);
console.log("TMC_Monthly_Aggregated.TMCsAdded, finalData completed");

		var graphData = [];
		finalData.forEach(function(monthObj) {
			var obj = {
				key: monthObj.key,
				values: monthObj.values.map(function(d) {
					crossfilter.calcIndices(d.values, d.values.values)
					return {
						x: d.key,
						y: getValues(d.values)
					};
				})
			}
			graphData.push(obj);
		})
console.log("TMC_Monthly_Aggregated.TMCsAdded, graphData completed");

		if (!graphData.length) {
			d3.select("#TMC-monthly-aggregated-div-"+this.state.linegraph.id()).style("display", "none");
		}
		else {
			d3.select("#TMC-monthly-aggregated-div-"+this.state.linegraph.id()).style("display", null);
		}

		this.state.linegraph.data(graphData)();
		this.state.labeller.tmcs(data.tmcs)();
	},
	dataviewChange: function(view) {
		if (view != currentView) {
			currentView = view;
			this.state.linegraph();
		}
	},
	TMCsChange: function(tmc) {
	},
	updateGraph: function() {
	},
	savePng:function(){
		saveSvgAsPng.saveSvgAsPng(document.getElementById("MC-monthly-aggregated-div-"+this.state.linegraph.id() ), "diagram.png");
	},
	render: function() {
		return (
			<div className="col-lg-12 NPMRDS-tmc-panel" id={"TMC-monthly-aggregated-div-"+this.state.linegraph.id()}>
				<svg id={ "TMC-monthly-aggregated-graph-"+this.state.linegraph.id() }></svg>
				<button className='btn btn-danger' style={{position:'absolute',bottom:'10px',right:'10px'}} onClick={this.savePng}>Export</button>
            </div>
		);
	}
});

module.exports = LineGraph;

function getValues(values) {
	return {
		avgSpeed: values.avgSpeed,
		avgTime: values.avgTime,
		bufferTime: values.bufferTime,
		eightieth: values.eightieth,
		freeflow: values.freeflow,
		median: values.median,
		miseryIndex: values.miseryIndex,
		nintyfifth: values.nintyfifth,
		planningTime: values.planningTime,
		stddevTime: values.stddevTime,
		stddevSpeed: values.stddevSpeed,
		travelTimeIndex: values.travelTimeIndex
	}
}

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

function Labeller() {
	var tmcDiv,
		TMCs = [];

	function labeller(selection) {
		if (selection) {
			tmcDiv = selection.append('div')
				.style({position:"absolute",right:"0px",top:"0px"});
			return;
		}

		var tmcs = tmcDiv.selectAll(".tmcs-label")
			.data(TMCs);
		tmcs.exit().remove();
		tmcs.enter().append("div")
			.attr("class", "tmcs-label")
			.style({float:"left",padding:"0px 10px",height:"30px","line-height":"30px",cursor:"pointer"});
		tmcs.text(function(d) { return d.toString(); })
			.style("background-color", function(d) { return TMCDataStore.getTMCcolor(d.toString()); })
			.on("click", function(d) { TMCDataStore.addTMC(d); });
	}
	labeller.tmcs = function(d) {
		if (!arguments.length) {
			return TMCs;
		}
		TMCs = d;
		return labeller;
	}
	return labeller;
}

function Popup() {
	var div,
		data = [],
		selfID = null;

	function popup(selection) {
		if (selection) {
			div = d3.select("#TMC-monthly-aggregated-div-"+selfID).append("div")
				.style({padding:"0px", color:"#000", height:"30px", 
					"line-height":"30px", position:"absolute", left:"20px", top:"5px",
					"font-size":"15pt"})
		}
		var rows = div.selectAll("div").data(data);
		rows.exit().remove();
		rows.enter().append("div");
		var text = rows.selectAll("div").data(function(d) { return d; });
		text.exit().remove();
		text.enter().append("span")
			.style("font-weight", function(d,i) { return i==0?"bold":null; });
		text.text(function(d) { return d; });
	}
	popup.id = function(id) {
		if (!arguments.length) {
			return selfID;
		}
		if (selfID === null) {
			selfID = id;
		}
		return popup;
	}
	popup.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return popup;
	}
	return popup;
}

function Linegraph() {
	var selfID,
		data = [],
		margin = { left: 50, top: 50, right: 25, bottom: 50 },
		_svg,
		svg,
		width = 1400,
		height = 600,
		xScale = d3.scale.ordinal(),
		yScale = d3.scale.linear(),
		xAxis = d3.svg.axis()
			.orient("bottom")
			.scale(xScale)
			.tickFormat(formatXaxis),
		yAxis = d3.svg.axis()
			.orient("left")
			.scale(yScale),
		colorScale = d3.scale.linear()
			.range(["#f7fcf5", "#00441b"]),
		xAxisGroup,
		yAxisGroup,
		line = d3.svg.line()
			.x(function(d) { return xScale(d.x); })
			.y(function(d) { return yScale(d.y[currentView]); }),
		voronoi = d3.geom.voronoi(),
		voronoiGroup;

	var popup = Popup();

	function graph(selection) {
		if (selection) {
			_svg = selection.attr({width: width, height: height});
			svg = selection.append('g')
				.attr("transform", "translate("+margin.left+", "+margin.top+")");
			xAxisGroup = svg.append("g").attr("class", "axis")
				.attr("transform", "translate(0, "+(height-margin.top-margin.bottom)+")");
			yAxisGroup = svg.append("g").attr("class", "axis");
			xScale.rangePoints([0, width-margin.left-margin.right], 1);
			yScale.range([height-margin.top-margin.bottom, 0]);
			voronoi.x(function(d) { return xScale(d.x); })
				.y(function(d) { return yScale(d.y); })
				.clipExtent([[0,0],[width-margin.right-margin.left,height-margin.bottom-margin.top]]);

			selection.call(popup);

			if (!data.length) {
				return;
			}
		}
		colorScale.domain([0, data.length-1]);

		var	values = d3.merge(data.map(function(d) { return d.values; })),
			yExtent = d3.extent(values.map(function(d) { return d.y[currentView]; })),
			xValues = d3.set(values.map(function(d) { return d.x; })).values().sort(function(a, b) { return a-b; });

		xScale.domain(xValues);
		yScale.domain([yExtent[0]*.8, yExtent[1]*1.2]);

		// xAxis.tickFormat(dataResolutionObjects[currentResolution].tickFormat);
		xAxisGroup.transition().call(xAxis);
		yAxisGroup.transition().call(yAxis);

		xAxisGroup.selectAll("text").each(function(d,i) {
			d3.select(this).attr("transform", "translate(0, "+((i%2))*12+")");
		})

		var groups = svg.selectAll(".chart-group").data(data, function(d) { return d.key; });
		groups.exit().remove();
		groups.enter().append("g")
			.attr("id", function(d) { return "chart-group-"+d.key})
			.attr("class", "chart-group");

		var pointsData = [];

		groups.each(function(groupData, ndx) {
			var group = d3.select(this);

			var path = group.selectAll("path")
				.data([groupData.values]);
			path.exit().remove();
			path.enter().append("path")
				.attr("id", "TMC-monthly-aggregated-"+groupData.key+"-path")
				.attr({stroke: "#74c476",//function() { return colorScale(ndx); }, 
					  	"stroke-width": 3, fill:"none", class:"NPMRDS-graph-path",
						"stroke-opacity": 0.3})
			path.transition().attr("d", line);

			var points = group.selectAll("circle")
				.data(groupData.values)
			points.exit().remove();
			points.enter().append("circle")
				.attr("id", "TMC-monthly-aggregated-"+groupData.key+"-point")
				.attr("class", function(d) { return "NPMRDS-graph-point"; })
				.attr({fill: "#74c476",//function() { return colorScale(ndx); },
				       r: 4, stroke: "none", "fill-opacity": 0.3})
			points.transition().attr({
				cx: function(d) { return xScale(d.x); },
				cy: function(d) { return yScale(d.y[currentView]); }
			});
			points.each(function(d) {
				pointsData.push({
					x: d.x,
					y: d.y[currentView],
					key: groupData.key,
					point: d3.select(this)
				});
			});

			// path.each(function(d, i) {
			// 	d3.select(this).datum({
			// 		key: groupData.key,
			// 		x: d.x,
			// 		y: d.y,
			// 		path: d3.select(this),
			// 		points: group.selectAll(".NPMRDS-graph-point")
			// 	});
			// })
			// points.each(function(d, i) {
			// 	d3.select(this).datum({
			// 		key: groupData.key,
			// 		x: d.x,
			// 		y: d.y,
			// 		path: group.selectAll(".NPMRDS-graph-path"),
			// 		points: group.selectAll(".NPMRDS-graph-point")
			// 	});
			// })
		})

		pointsData.forEach(function(point) {
			point.points = d3.selectAll("#TMC-monthly-aggregated-"+point.key+"-point");
			point.path = d3.selectAll("#TMC-monthly-aggregated-"+point.key+"-path");
		})

		if (voronoiGroup) {
			voronoiGroup.remove();
			voronoiGroup = null;
		}
		voronoiGroup = svg.append("g").attr("id", "voronoi-group")
			.on("mousemove", mousemove);

		var vPath = voronoiGroup.selectAll("path").data(voronoi(pointsData).filter(function(d){return d;}));
		vPath.enter().append("path")
			.attr({fill: "none", stroke: "none"})
			.attr("pointer-events", "all")
			.on("mouseover", mouseover)
			.on("mouseout", mouseout)
			.on("click", click);
		vPath.exit().remove();
		vPath.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
			.datum(function(d) { return d.point; });
	}
	graph.on = function(e, l) {
		if (!arguments.length) {
			return graph;
		}
		else if (arguments.length == 1) {
			return dispatcher.on(e);
		}
		dispatcher.on(e, l);
		return graph;
	}
	graph.id = function(id) {
		if (!arguments.length) {
			return selfID;
		}
		selfID = id;
		popup.id(id);
		return graph;
	}
	graph.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return graph;
	}
	graph.width = function(w) {
		if (!arguments.length) {
			return width;
		}
		width = w;

		_svg.attr({width: width, height: height});
		xScale.rangePoints([0, width-margin.left-margin.right], 1);
		voronoi.clipExtent([[0,0],[width-margin.right-margin.left,height-margin.bottom-margin.top]]);
		return;
	}

	var MONTHS = [];

	return graph;

	function formatXaxis(d) {
		return d;
	}

	function mousemove(d) {
		var x = d3.mouse(this)[0];
	}

	function mouseover(d) {
		d.path.attr({
			stroke: "#006d2c",
			"stroke-opacity": 1.0
		});
		d.points.attr({
			fill: "#006d2c",
			"fill-opacity": 1.0
		});
		popup.data([[ "Month: ", dateLabeler(Math.floor(d.key/100), d.key%100) ]])()
	}
	function mouseout(d) {
		d.path.attr({
			stroke: "#74c476",
			"stroke-opacity": 0.3
		});
		d.points.attr({
			fill: "#74c476",
			"fill-opacity": 0.3
		});
		popup.data([])();
	}

	function click(d) {
		// if (currentResolution < dataResolutionObjects.length-1) {
		// 	currentResolution++;
		// 	dataResolutionObjects[currentResolution].filter.apply(d.x);

		// 	dispatcher.graphupdate();
		// }
	}

	function dateLabeler(year, month, day, hour, bool) {
		var months = [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		if (arguments.length == 2) {
			return months[month]+" "+year;
		}
		if (arguments.length == 3) {
			return months[month]+" "+day;
		}
		if (arguments.length == 4) {
			return hour+":00";
		}
		var minutes = hour*5,
			format = d3.format("02d");
		return Math.floor(minutes/60)+":"+format(minutes%60);
	}
}