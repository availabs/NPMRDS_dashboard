"use strict"

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes,
    TMCDataStore = require("../../stores/TMCDataStore"),
    saveSvgAsPng = require('save-svg-as-png'),

	d3 = require("d3"),

	crossfilter = TMCDataStore.getTMCCrossFilter(),
	avgCrossfilter = TMCDataStore.getWebWorker(),//TMCDataStore.getTMCCrossFilter(),

	UNIQUE_IDs = 0;

var currentView = "avgSpeed";

var months = ["All Time", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var params = {};

var LineGraph = React.createClass({
	getInitialState: function() {
		return {
			linegraph: Linegraph().id(UNIQUE_IDs++),
			// labeller: Labeller(),
			selectedTMCs: {}
		}
	},
	componentDidMount: function() {
		d3.select("#TMC-over-time-graph-"+this.state.linegraph.id()).call(this.state.linegraph);
		this.state.linegraph.on("graphupdate", this.updateGraph);

		// d3.select("#TMC-over-time-div-"+this.state.linegraph.id()).call(this.state.labeller);
		// this.state.labeller.on("resolutionchange", this.state.linegraph.resolution);

		d3.select("#TMC-over-time-div-"+this.state.linegraph.id()).style("display", "none");

		TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this.TMCadded);
		TMCDataStore.addChangeListener(Events.REMOVE_TMC_DATA, this.TMCremoved);

		TMCDataStore.addChangeListener(Events.TMC_DATAVIEW_CHANGE, this.dataViewChange);
	},
	componentWillUnmount: function() {
		TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this.TMCadded);
		TMCDataStore.removeChangeListener(Events.REMOVE_TMC_DATA, this.TMCremoved);

		TMCDataStore.removeChangeListener(Events.TMC_DATAVIEW_CHANGE, this.dataViewChange);
	},
	testEventDispatcher: function(args) {
		console.log("<TMCsOverTime_Graph.testEventDispatcher> args:", arguments);
	},
	TMCadded: function(tmc) {
		if (!(tmc.toString() in this.state.selectedTMCs)) {
			this.state.selectedTMCs[tmc.toString()] = tmc;
			this.addTMCtoGraph(tmc);
		}
	},
	TMCremoved: function(tmc) {
		if (tmc.toString() in this.state.selectedTMCs) {
			delete this.state.selectedTMCs[tmc.toString()];
			this.removeTMCfromGraph(tmc);
		}
	},
	dataViewChange: function(view) {
		if (view != currentView) {
			currentView = view;
			this.state.linegraph();
		}
	},
	addTMCtoGraph: function(tmc) {
		var graphData = this.state.linegraph.data(),
			group = this.state.linegraph.group(),
			avgLines = this.state.linegraph.avgLines();

		// avgCrossfilter.filter("tmc", tmc);
		// var all = getValues(avgCrossfilter("all"));
		// avgLines.push({key: tmc, values: all});
		// this.state.linegraph.avgLines(avgLines);

        avgCrossfilter.filter("tmc", tmc);
        avgCrossfilter("all", function(data) {
            console.log("ALL DATA", data)
            var all = getValues(data);
    		avgLines.push({key: tmc, values: all});
    		this.state.linegraph.avgLines(avgLines)();
        }.bind(this));

		crossfilter.filter("tmc", tmc);
		var tmcData = crossfilter(group);
		var	obj = {
				key: tmc,
				values: tmcData.map(function(d) { return {
					key: d.key,
					x: d.key,
					y: getValues(d.value)
				}})
			};
		graphData.push(obj);

		d3.select("#TMC-over-time-div-"+this.state.linegraph.id()).style("display", null);

		this.state.linegraph.data(graphData)();
	},
	removeTMCfromGraph: function(tmc) {
		var graphData = this.state.linegraph.data(),
			avgLines = this.state.linegraph.avgLines(),
			len = graphData.length;

		graphData = graphData.filter(function(d) { return d.key.toString() != tmc; });
		avgLines = avgLines.filter(function(d) { return d.key.toString() != tmc; });

		if (len != graphData.length) {
			this.state.linegraph
				.avgLines(avgLines)
				.data(graphData)();
		}

		if (!graphData.length) {
			d3.select("#TMC-over-time-div-"+this.state.linegraph.id()).style("display", "none");
		}
	},
	updateGraph: function() {
		var graphData = [],
			TMCs = [],
			group = this.state.linegraph.group();

		for (var k in this.state.selectedTMCs) {
			TMCs.push(this.state.selectedTMCs[k]);
		}

		// params = TMCDataStore.getParams(false);
		// applyParams(this.state.linegraph.resolution());
		// console.log("TMCsOverTime_Graph",params);

		TMCs.forEach(function(tmc) {
			crossfilter.filter("tmc", tmc);
			var tmcData = crossfilter(group),
				obj = {
					key: tmc,
					values: tmcData.map(function(d) { return {
						key: d.key,
						x: d.key,
						y: getValues(d.value)
					}})
				};
			graphData.push(obj);
		});

		this.state.linegraph.data(graphData)();

	},
	savePng:function(){
		saveSvgAsPng.saveSvgAsPng(document.getElementById("TMC-over-time-graph-"+this.state.linegraph.id() ), "diagram.png");
	},
	render: function() {
		return (
			<div className="col-lg-12 NPMRDS-tmc-panel" id={"TMC-over-time-div-"+this.state.linegraph.id()}>
				<svg id={ "TMC-over-time-graph-"+this.state.linegraph.id() }></svg>
				<button className='btn btn-danger' style={{position:'absolute',bottom:'10px',right:'10px'}} onClick={this.savePng}>Export</button>
            </div>
		);
	}
});

module.exports = LineGraph;

var WEEKDAYS = {
    "monday": 0,
    "tuesday" : 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6
}

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

function Labeller() {
	var labelDiv,
		tmcDiv,
		labels = [],
		TMCs = [],
		dispatcher = d3.dispatch("resolutionchange");

	function labeller(selection) {
		if (selection) {
			labelDiv = selection.append('div')
				.style({position:"absolute",left:"0px",top:"0px"});
			tmcDiv = selection.append('div')
				.style({position:"absolute",right:"0px",top:"0px"});
			return;
		}

		var lbls = labelDiv.selectAll(".resolution-label")
			.data(labels);
		lbls.exit().remove();
		lbls.enter().append("div")
			.on("click", function(d, i) { dispatcher.resolutionchange(i); })
			.attr("class", "resolution-label")
			// .style({float:"left",padding:"0px 20px",height:"30px","line-height":"30px",
			// 		"background-color":"#999"});
		lbls.text(function(d) {
			if (d==Infinity) {
				return months[0];
			}
			if (d < 999999) {
				return months[d%100]+" "+(Math.floor(d/100));
			}
			return months[Math.floor(d/100)%100]+" "+(d%100);
		});

		var tmcs = tmcDiv.selectAll(".tmcs-label")
			.data(TMCs, function(d) { return d; });
		tmcs.exit().remove();
		var enter = tmcs.enter().append("div");

		enter.attr("class", "tmcs-label")
			.style({float:"left",padding:"0px 10px",height:"30px","line-height":"30px"});

		tmcs.style("background-color", TMCDataStore.getTMCcolor)

		var text = enter.append("div")
				.style({ display: "inline" })
				.text(function(d) { return TMCDataStore.getTMCname(d); });

		enter.on("mouseover", function(d) { d3.select(this).selectAll("div").text(d); })
			.on("mouseout", function(d) { d3.select(this).selectAll("div").text(TMCDataStore.getTMCname(d)); });

		var buttons = enter.append("span")
				.attr("class", "glyphicon glyphicon-remove NPMRDS-tmc-remove")
				.style({ "margin-left": "10px", display: "inline" })
				.on("click",TMCDataStore.removeTMC);
	}
	labeller.on = function(e, l) {
		if (!arguments.length) {
			return labeller;
		}
		else if (arguments.length == 1) {
			return dispatcher.on(e);
		}
		dispatcher.on(e, l);
		return labeller;
	}
	labeller.labels = function(d) {
		if (!arguments.length) {
			return labels;
		}
		labels = d;
		return labeller;
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

function applyParams(resolution) {
	var timeBounds = params.timeBounds ? params.timeBounds.map(function(d) { return Math.floor(d/5); }) : [];
	if (timeBounds.length == 1) {
		crossfilter.filter("epoch", timeBounds[0]);
	}
	else if (timeBounds.length == 2) {
		crossfilter.filter("epoch", function(d) { return timeBounds[0] <= d && d < timeBounds[1]; });
	}

	var weekdays = params.weekdays.map(function(d) { return WEEKDAYS[d]; }).sort(function(a, b) { return a-b; });
	if (weekdays.length == 1) {
		crossfilter.filter("weekday", weekdays[1]);
	}
	else if (weekdays.length > 1) {
		crossfilter.filter("weekday", function(d) { return weekdays[0] <= d && d <= weekdays[weekdays.length-1]; });
	}

	if (resolution != "Monthly") {
		return;
	}
console.log("applyParams ???")
	var dateBounds = params.dateBounds || [];
	if (dateBounds.length == 1) {
		crossfilter.filter("yyyymmdd", dateBounds[0]);
	}
	else if (dateBounds.length == 2) {
		crossfilter.filter("yyyymmdd", function(d) { return dateBounds[0] <= d && d <= dateBounds[1]; });
	}
}

function Linegraph() {
	var selfID,
		data = [],
		avgLines = [],
		margin = { left: 50, top: 50, right: 25, bottom: 50 },
		_svg,
		svg,
		width = 1400,
		height = 600,
		xScale = d3.scale.ordinal(),
		yScale = d3.scale.linear(),
		xAxis = d3.svg.axis()
			.orient("bottom")
			.scale(xScale),
		yAxis = d3.svg.axis()
			.orient("left")
			.scale(yScale),
		xAxisGroup,
		yAxisGroup,
		data = [],
		line = d3.svg.line()
			.x(function(d) { return xScale(d.x); })
			.y(function(d) { return yScale(d.y[currentView]); }),
		voronoi = d3.geom.voronoi(),
		voronoiGroup;

	var dispatcher = d3.dispatch("graphupdate");

	var labeller = Labeller();

	var currentResolution = 0,
		dataResolutionObjects = [
			{ resolution: "Monthly",
				time: Infinity,
				tickFormat: function(d) {
					return dateLabeler(Math.floor(d/100), d%100) },
				group: "yyyymm",
				filter: {
					apply: function() {},
					remove: function() { crossfilter.filter("yyyymm", null); crossfilter.filter("yyyymmdd", null); }
				} },
			{ resolution: "Daily",
				time: 0,
				tickFormat: function(d) {
					return dateLabeler(Math.floor(d/10000), Math.floor(d/100)%100, d%100) },
				group: "yyyymmdd",
				filter: {
					apply: function(v) { crossfilter.filter("yyyymm", v); },
					remove: function() { crossfilter.filter("yyyymmdd", null); }
				} },
			{ resolution: "Minutes",
				time: 0,
				tickFormat: function(d) {
					return dateLabeler(Math.floor(d/10000000), Math.floor(d/100000)%100, Math.floor(d/1000)%100, d%1000, true) },
				group: "yyyymmddeee",
				filter: {
					apply: function(v) { crossfilter.filter("yyyymmdd", v); },
					remove: function() {}
				} }
		],
		labels = [];

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

			// voronoi.x(function(d) { return xScale(d.x); })
			// 	.y(function(d) { return yScale(d.y); })
			// 	.clipExtent([[0,0],[width-margin.right-margin.left,height-margin.bottom-margin.top]]);

			d3.select("#TMC-over-time-div-"+selfID).call(labeller);
			labeller.on("resolutionchange", graph.resolution);

			if (!data.length) {
				return;
			}
		}

		labels = dataResolutionObjects.filter(function(d, i) { return i <= currentResolution; })
			.map(function(d) { return d.time; });

		labeller
			.labels(labels)
			.tmcs(data.map(function(d) { return d.key.toString(); }))();

		var	values = d3.merge(data.map(function(d) { return d.values; })),
			yExtent = d3.extent(values.map(function(d) { return d.y[currentView]; })),
			xValues = d3.set(values.map(function(d) { return d.x; })).values().sort(function(a, b) { return a-b; });

		avgLines.forEach(function(line) {
			if (line.values[currentView] < yExtent[0]) {
				yExtent[0] = line.values[currentView];
			}
			if (line.values[currentView] > yExtent[1]) {
				yExtent[1] = line.values[currentView];
			}
		})

		xScale.domain(xValues);
		yScale.domain([yExtent[0]*.9, yExtent[1]*1.1]);

		xAxis.tickFormat(dataResolutionObjects[currentResolution].tickFormat);
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

		// var pointsData = [];

		groups.each(function(d) {
// console.log(d);
			var groupData;
			// if (currentResolution == 1 && params.dateBounds) {
			// 	groupData = {key: d.key};
			// 	groupData.values = d.values.filter(function(d) { return params.dateBounds[0] <= d.key && d.key <= params.dateBounds[params.dateBounds.length-1]; });
			// }
			// else {
				groupData = d;
			// }
			var group = d3.select(this);

			var path = group.selectAll("path")
				.data([groupData.values]);
			path.exit().remove();
			path.enter().append("path")
				.attr({stroke: function(d) { return TMCDataStore.getTMCcolor(groupData.key) },
					  "stroke-width": 3, fill:"none", class:"NPMRDS-graph-path"})
				.on("mouseover", mouseover)
				.on("mouseout", mouseout);
			path.transition().attr("d", line);

			var points = group.selectAll("circle")
				.data(groupData.values)
			points.exit().remove();
			points.enter().append("circle")
				.attr("class", function(d) { return "NPMRDS-graph-point"; })
				.attr({fill: function(d) { return TMCDataStore.getTMCcolor(groupData.key) },
				       r: 4, stroke: "none"})
				.on("mouseover", mouseover)
				.on("mouseout", mouseout)
				.on("click", click);
			points.transition().attr({
				cx: function(d) { return xScale(d.x); },
				cy: function(d) { return yScale(d.y[currentView]); }
			});
			// points.each(function(d) {
			// 	pointsData.push({
			// 		x: d.x,
			// 		y: d.y,
			// 		key: groupData.key,
			// 		point: d3.select(this)
			// 	});
			// });

			path.each(function(d, i) {
				d3.select(this).datum({
					key: groupData.key,
					x: d.x,
					y: d.y,
					path: d3.select(this),
					points: group.selectAll(".NPMRDS-graph-point")
				});
			})
			points.each(function(d, i) {
				d3.select(this).datum({
					key: groupData.key,
					x: d.x,
					y: d.y,
					path: group.selectAll(".NPMRDS-graph-path"),
					points: group.selectAll(".NPMRDS-graph-point")
				});
			})
		})

		var resolutionData = [];
		if (currentResolution > 0) {
			data.forEach(function(tmc) {
				crossfilter.filter("tmc", tmc.key);
				var resData = crossfilter("all");
				resolutionData.push({key:tmc.key,values:getValues(resData)});
			})
		}
		var resGroups = svg.selectAll(".res-group").data(resolutionData, function(d) { return d.key; });
		resGroups.exit().remove();
		resGroups.enter().append("g")
			.attr("class", "res-group");
		resGroups.each(function(groupData) {
			var avgLine = d3.select(this).selectAll("line").data([groupData.values]);
			avgLine.exit().remove();
			avgLine.enter().append("line")
				.attr({stroke: function(d) { return TMCDataStore.getTMCcolor(groupData.key) },
					"stroke-width": 3, fill:"none", class:"NPMRDS-graph-path",
					"stroke-dasharray": "6,6"})
				.attr("x1", 0)
				.attr("x2", (width-margin.left-margin.right))
			avgLine.transition()
				.attr("y1", function(d) { return yScale(d[currentView]); })
				.attr("y2", function(d) { return yScale(d[currentView]); });
		})

		var avgGroups = svg.selectAll(".avg-group").data(avgLines, function(d) { return d.key; });
		avgGroups.exit().remove();
		avgGroups.enter().append("g")
			.attr("class", "avg-group");
		avgGroups.each(function(groupData) {
			var avgLine = d3.select(this).selectAll("line").data([groupData.values]);
			avgLine.exit().remove();
			avgLine.enter().append("line")
				.attr({stroke: function(d) { return TMCDataStore.getTMCcolor(groupData.key) },
					"stroke-width": 3, fill:"none", class:"NPMRDS-graph-path",
					"stroke-dasharray": "3,3"})
				.attr("x1", 0)
				.attr("x2", (width-margin.left-margin.right))
			avgLine.transition()
				.attr("y1", function(d) { return yScale(d[currentView]); })
				.attr("y2", function(d) { return yScale(d[currentView]); });
		})

		// pointsData.forEach(function(point) {
		// 	point.points = d3.selectAll("#esc-linegraph-"+point.key+"-point");
		// 	point.path = d3.selectAll("#esc-linegraph-"+point.key+"-path");
		// })

		// if (voronoiGroup) {
		// 	voronoiGroup.remove();
		// 	voronoiGroup = null;
		// }
		// voronoiGroup = svg.append("g").attr("id", "voronoi-group")
		// 	.on("mousemove", mousemove);

		// var vPath = voronoiGroup.selectAll("path").data(voronoi(pointsData));
		// vPath.enter().append("path")
		// 	.attr({fill: "none", stroke: "none"})
		// 	.attr("pointer-events", "all")
		// 	.on("mouseover", mouseover)
		// 	.on("mouseout", mouseout)
		// 	.on("click", click);
		// vPath.exit().remove();
		// vPath.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
		// 	.datum(function(d) { return d.point; });
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
		return graph;
	}
	graph.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return graph;
	}
	graph.avgLines = function(d) {
		if (!arguments.length) {
			return avgLines;
		}
		avgLines = d;
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
	graph.resolution = function(v) {
		if (!arguments.length) {
			return dataResolutionObjects[currentResolution].resolution;
		}
		var resolution = currentResolution;
		if (typeof v == "string") {
			dataResolutionObjects.forEach(function(d, i) {
				if (d.resolution == v) {
					resolution = i;
				}
			});
		}
		else if (typeof v == "number") {
			resolution = v;
		}

		if (resolution < currentResolution) {
			dataResolutionObjects[resolution].filter.remove();
		}
		if (resolution != currentResolution) {
			currentResolution = resolution;
			dispatcher.graphupdate();
			graph();
		}
		return graph;
	}
	graph.group = function() {
		return dataResolutionObjects[currentResolution].group;
	}
	graph.labels = function() {
		return labels;
	}
	return graph;

	function mousemove(d) {
		var x = d3.mouse(this)[0];
	}

	function mouseover(d) {
		d.path.attr({
			"stroke-width": 5
		});
		d.points.attr({
			r: 7
		});
		d3.selectAll(".time-"+d.x)
			.attr({ r: 7 });

		// d.point.attr("r", 6);
	}
	function mouseout(d) {
		d.path.attr({
			"stroke-width": 3
		});
		d.points.attr({
				r: 4
			});
		d3.selectAll(".time-"+d.x)
			.attr({ r: 4 });

		// d.point.attr("r", 2);
	}

	function click(d) {
		if (currentResolution < dataResolutionObjects.length-1) {
			currentResolution++;
			dataResolutionObjects[currentResolution].filter.apply(d.x);

			dataResolutionObjects[currentResolution].time = d.x;

			dispatcher.graphupdate();
		}
	}

	function dateLabeler(year, month, day, hour, bool) {

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
