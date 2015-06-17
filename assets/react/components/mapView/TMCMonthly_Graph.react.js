"use strict"

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes,
    TMCDataStore = require("../../stores/TMCDataStore"),

    ControlPanel = require("./ControlPanel.react"),

	d3 = require("d3"),
	saveSvgAsPng = require('save-svg-as-png'),
	crossfilter = TMCDataStore.getCrossFilter(),

	UNIQUE_IDs = 0;

var currentView = "avgSpeed",
	currentTMC = null,
	months = [];

var LineGraph = React.createClass({
	getInitialState: function() {
		return {
			linegraph: Linegraph().id(UNIQUE_IDs++),
			labeller: Labeller(),
			selectedTMCs: {},
			graphData: []
		}
	},
	componentDidMount: function() {
		d3.select("#TMC-monthly-graph-"+this.state.linegraph.id()).call(this.state.linegraph);
		// this.state.linegraph.on("graphupdate", this.updateGraph);

		d3.select("#TMC-monthly-div-"+this.state.linegraph.id()).call(this.state.labeller);
		this.state.labeller.on("tmcchange", this.TMCchange);

		d3.select("#TMC-monthly-div-"+this.state.linegraph.id()).style("display", "none");

		TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this.TMCadded);
		TMCDataStore.addChangeListener(Events.REMOVE_TMC_DATA, this.TMCremoved);

		TMCDataStore.addChangeListener(Events.TMC_DATAVIEW_CHANGE, this.dataviewChange);
	},
	componentWillUnmount: function() {
		TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this.TMCadded);
		TMCDataStore.removeChangeListener(Events.REMOVE_TMC_DATA, this.TMCremoved);
		
		TMCDataStore.removeChangeListener(Events.TMC_DATAVIEW_CHANGE, this.dataviewChange);
	},
	TMCadded: function(data) {
		if (!(data.tmc.toString() in this.state.selectedTMCs)) {
			this.state.selectedTMCs[data.tmc.toString()] = data.tmc;
			var TMCs = [];
			for (var k in this.state.selectedTMCs) {
				TMCs.push(this.state.selectedTMCs[k]);
			}
			this.state.labeller.tmcs(TMCs)();

			if (!currentTMC) {
				currentTMC = data.tmc;
				this.updateGraph();
			}
		}
	},
	TMCremoved: function(tmc) {
		if (tmc in this.state.selectedTMCs) {
			delete this.state.selectedTMCs[tmc.toString()];

			var TMCs = [];
			for (var k in this.state.selectedTMCs) {
				TMCs.push(this.state.selectedTMCs[k]);
			}
			this.state.labeller.tmcs(TMCs)();

			if (tmc == currentTMC.toString()) {
				currentTMC = TMCs.length ? TMCs[0] : null;
				this.state.labeller.makeActive(0);
				this.updateGraph();
			}
		}
	},
	dataviewChange: function(view) {
		if (view != currentView) {
			currentView = view;
			this.state.linegraph();
		}
	},
	TMCchange: function(tmc) {
		if (tmc != currentTMC) {
			currentTMC = tmc;
			this.updateGraph();
		}
	},
	updateGraph: function() {
		var graphData = [];
		
		if (currentTMC) {
			if (!months.length) {
				months = crossfilter("yyyymm").map(function(d) { return d.key; });
			}

			crossfilter.filter("tmc", currentTMC);

			months.forEach(function(month) {
				crossfilter.filter("yyyymm", month);
				var data = crossfilter("hour"),
					obj = {
						key: month,
						values: data.map(function(d) { return {
							key: d.key,
							x: d.key,
							y: getValues(d.value)
						}})
					};
				graphData.push(obj);
			})

			this.state.linegraph.data(graphData)();
		}

		if (!graphData.length) {
			d3.select("#TMC-monthly-div-"+this.state.linegraph.id()).style("display", "none");
		}
		else {
			d3.select("#TMC-monthly-div-"+this.state.linegraph.id()).style("display", null);
		}
	},
	savePng:function(){
		//console.log('test',saveSvgAsPng)
		saveSvgAsPng.saveSvgAsPng(document.getElementById("TMC-monthly-graph-"+this.state.linegraph.id() ), "diagram.png");
	},

	render: function() {

		return (
			<div className="col-lg-12 NPMRDS-tmc-panel" id={"TMC-monthly-div-"+this.state.linegraph.id()}>
				<svg id={ "TMC-monthly-graph-"+this.state.linegraph.id() }></svg>
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

function Labeller() {
	var tmcDiv,
		TMCs = [],
		dispatcher = d3.dispatch("tmcchange");

	function labeller(selection) {
		if (selection) {
			tmcDiv = selection.append('div')
				.style({position:"absolute",right:"0px",top:"0px"});
			return;
		}

		var tmcs = tmcDiv.selectAll(".tmcs-label")
			.data(TMCs);
		tmcs.exit().remove();
		var enter = tmcs.enter().append("div")
			.attr("class", "tmcs-label")
			.style({float:"left",padding:"0px 10px",height:"30px","line-height":"30px",cursor:"pointer"});

		tmcs.on("click", highlight)
			.style("background-color", function(d) { return TMCDataStore.getTMCcolor(d.toString()); });

		var text = enter.append("div")
				.style({ display: "inline" })
				.text(function(d) { return TMCDataStore.getTMCname(d); });

		if (TMCs.length == 1) {
			tmcs.each(highlight);
		}

		enter.on("mouseover", function(d) { d3.select(this).selectAll("div").text(d); })
			.on("mouseout", function(d) { d3.select(this).selectAll("div").text(TMCDataStore.getTMCname(d)); });

		var buttons = enter.append("span")
				.attr("class", "glyphicon glyphicon-remove NPMRDS-tmc-remove")
				.style({ "margin-left": "10px", display: "inline" })
				.on("click", function(d) { d3.event.stopPropagation();TMCDataStore.removeTMC(d.toString()); });
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
	labeller.tmcs = function(d) {
		if (!arguments.length) {
			return TMCs;
		}
		TMCs = d;
		return labeller;
	}
	labeller.makeActive = function(n) {
		tmcDiv.selectAll(".tmcs-label")
			.each(function(d, i) {
				if (i == n) {
					highlight.call(this, d);
				}
			})
	}
	return labeller;

	function highlight(d) {
		tmcDiv.selectAll(".tmcs-label").selectAll("div")
			.style("font-weight", null)
			.style("text-decoration", null)
			.style("color", null);
		d3.select(this).selectAll("div")
			.style("font-weight", 800)
			.style("text-decoration", "underline")
			.style("color", "#fff");
		dispatcher.tmcchange(d);
	}
}

function Popup() {
	var div,
		data = [],
		selfID = null;

	function popup(selection) {
		if (selection) {
			div = d3.select("#TMC-monthly-div-"+selfID).append("div")
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
				.attr("id", "TMC-monthly-"+groupData.key+"-path")
				.attr({stroke: "#74c476",//function() { return colorScale(ndx); }, 
					  	"stroke-width": 3, fill:"none", class:"NPMRDS-graph-path",
						"stroke-opacity": 0.3})
			path.transition().attr("d", line);

			var points = group.selectAll("circle")
				.data(groupData.values)
			points.exit().remove();
			points.enter().append("circle")
				.attr("id", "TMC-monthly-"+groupData.key+"-point")
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
			point.points = d3.selectAll("#TMC-monthly-"+point.key+"-point");
			point.path = d3.selectAll("#TMC-monthly-"+point.key+"-path");
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
		if (d == 0) {
			return "12:00AM";
		}
		if (d < 12) {
			return d+":00AM";
		}
		if (d == 12) {
			return d+":00PM";
		}
		return (d%12)+":00PM";
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