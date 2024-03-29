"use strict"

var React = require('react'),

	d3 = require("d3"),

	RouteDataStore = require("../../stores/RouteDataStore"),

	ViewActionsCreator = require("../../actions/ViewActionsCreator"),

	LineGraph = require("./MonthlyHoursLineGraph"),
	BarGraph = require("./RouteMapBarGraph"),

	BrushTimeSelector = require("./BrushTimeSelector");

var margin = { left:30, bottom:5, top:15, right: 10 };

var METER_TO_MILE = 0.000621371;

//'/routes/brief/monthly/hours/:tmc_array'
var MonthlyHoursGraph = {
	name: "monthly-hours",
	data: { url: '/routes/brief/monthly/hours/',
		title: 'Monthly Hours', id: 'monthly-hours' },
	graph: null
}

var BarGraphsYScale = d3.scale.linear();

var MonthlyGraphData = {
	name: "monthly",
	domain: [0, 0],
	yScale: BarGraphsYScale,
	data: [
		{ title: 'Daily All', id: 'daily', type: "All" },
		{ title: 'Daily AM', id: 'dailyAM', type: "AM" },
		{ title: 'Daily PM', id: 'dailyPM', type: "PM" }
	],
	graphs: []
}
var DailyGraph = {
	name: "daily",
	domain: [0, 0],
	yScale: BarGraphsYScale,
	data: null,
	graph: null
}

var AMbrushSelector = BrushTimeSelector(),
	PMbrushSelector = BrushTimeSelector();

// AM Peak: HOURS [6-9)
// PM Peak: HOURS [3-6)
module.exports = React.createClass({
	componentDidMount: function() {
		this.initializeGraphs();

		AMbrushSelector
			.onChange(this.updateAM);
		PMbrushSelector
			.onChange(this.updatePM);
	},
	updateAM: function(bounds) {
		var collection = this.props.routeCollection,

			length = collection.length,
			speed = collection.speed,

			flow = length / speed * 60,

			TMCs = JSON.stringify(collection.tmc_codes);

		BarGraphsYScale.domain([0, 0]);

		MonthlyGraphData.data.forEach(function(d, i) {
			var graph = MonthlyGraphData.graphs[i],
				data = configureDataType(graph.type()),
				url = '/routes/brief/'+RouteDataStore.getCurrentMonth()+'/';

			if (graph.type() == "AM") {
console.log("update AM", bounds);
				d3.json(url+TMCs)
					.post(JSON.stringify(data), monthlyGraphRequest.call(MonthlyGraphData, flow, i));
			}
		});
	},
	updatePM: function(bounds) {
		var collection = this.props.routeCollection,

			length = collection.length,
			speed = collection.speed,

			flow = length / speed * 60,

			TMCs = JSON.stringify(collection.tmc_codes);

		BarGraphsYScale.domain([0, 0]);

		MonthlyGraphData.data.forEach(function(d, i) {
			var graph = MonthlyGraphData.graphs[i],
				data = configureDataType(graph.type()),
				url = '/routes/brief/'+RouteDataStore.getCurrentMonth()+'/';

			if (graph.type() == "PM") {
console.log("update PM", bounds);
				d3.json(url+TMCs)
					.post(JSON.stringify(data), monthlyGraphRequest.call(MonthlyGraphData, flow, i));
			}
		});
	},
	initializeGraphs: function() {
		var mhData = MonthlyHoursGraph.data;
		MonthlyHoursGraph.graph = LineGraph()
				.margin(30, 30, 20, 10)//top, left, bottom, right
				.title(mhData.title)
				.label("minutes")
				.onClick(this.loadMonth)
				.id(mhData.id);
		d3.select("#"+mhData.id)
			.style("height", (window.innerHeight*0.5)+"px")
			.call(MonthlyHoursGraph.graph);

		MonthlyGraphData.graphs = MonthlyGraphData.data.map(
			function(d) {
				return BarGraph()
					.margin(margin)
					.yScale(MonthlyGraphData.yScale)
					.title(d.title)
					.label("minutes")
					.onClick(this.loadDailyGraphData)
					.id(d.id)
					.type(d.type);
			}, this);
		MonthlyGraphData.graphs.forEach(function(d, i) {
			d3.select("#"+MonthlyGraphData.data[i].id)
				.style("height", (window.innerHeight*0.15)+"px")
				.call(d)
		}, this);

		DailyGraph.graph = BarGraph()
					.onClick(this.resetGraphs)
					.margin(margin)
					.label("minutes")
					.yScale(DailyGraph.yScale)
					.id("hourly");
		d3.select("#hourly")
			.style("height", (window.innerHeight*0.15)+"px")
			.call(DailyGraph.graph);
	},
	loadDailyGraphData: function(d, graph) {
		var date = new Date(Math.round(d.key/10000), Math.round(d.key/100)%100-1, d.key%100);
		DailyGraph.data = { url: '/routes/brief/'+d.key+'/',
			title: 'Hourly '+graph.type()+" for "+date.toDateString(), id: 'hourly', type: graph.type() };
		DailyGraph.graph
			.title(DailyGraph.data.title)
			.type(DailyGraph.data.type);

		var length = this.props.routeCollection.length,
			speed = this.props.routeCollection.speed,

			TMCs = JSON.stringify(this.props.routeCollection.tmc_codes);

		BarGraphsYScale.domain(MonthlyGraphData.domain);

		var data = configureDataType(graph.type());

		d3.json(DailyGraph.data.url+TMCs)
			.post(JSON.stringify(data), function(err, res) {
				if (err) {
					console.log(err);
				}
				else {
					var nested = nestData(res),

						flow = length / speed * 60,
						data = makeRoute(nested),

						maxY = d3.max(data, function(d) { return d.values.y; }),
						domain = this.yScale.domain();

					this.yScale.domain([0, Math.max(maxY, domain[1])]);

					this.graph
						.flowLine(flow)
						.data(data)();

					MonthlyGraphData.graphs.forEach(function(d) { d(); });
				}
			}.bind(DailyGraph));
	},
	resetGraphs: function(d, graph) {
		graph.data([])
			.hide()();
		BarGraphsYScale.domain(MonthlyGraphData.domain);
		MonthlyGraphData.graphs.forEach(function(d) { d(); });
	},
	loadMonth: function(month) {
		DailyGraph.graph.data([])();

		ViewActionsCreator.routeDataMonthChange(month);

		var collection = this.props.routeCollection,

			length = collection.length,
			speed = collection.speed,

			flow = length / speed * 60,

			TMCs = JSON.stringify(collection.tmc_codes);

		BarGraphsYScale.domain([0, 0]);

		MonthlyGraphData.data.forEach(function(d, i) {
			var graph = MonthlyGraphData.graphs[i],
				data = configureDataType(graph.type()),
				url = '/routes/brief/'+month+'/';

			d3.json(url+TMCs)
				.post(JSON.stringify(data), monthlyGraphRequest.call(MonthlyGraphData, flow, i));
		});
	},
	loadGraphs: function(collection) {
		var length = collection.length,
			speed = collection.speed,

			flow = length / speed * 60,

			TMCs = JSON.stringify(collection.tmc_codes);

		d3.json(MonthlyHoursGraph.data.url+TMCs, function(err, response) {
			if (err) {
				console.log(err);
				return;
			}
			var nested = nestMHData(response),
				data = makeHourLines(nested);

			ViewActionsCreator.monthlyHoursDataLoaded(collection.id, data);

			MonthlyHoursGraph.graph.data(data)();

			var scale = MonthlyHoursGraph.graph.xScale(),
				domain = scale.domain(),
				range = scale.range();

			var AMscale = d3.scale.linear()
				.domain([domain[0], Math.floor(domain[1]/2)])
				.range([range[0], scale(11)]);
			AMbrushSelector
				.xScale(AMscale)
				.extent([6, 8]);

			var PMscale = d3.scale.linear()
				.domain([Math.ceil(domain[1]/2), domain[1]])
				.range([scale(12), range[1]]);
			PMbrushSelector
				.xScale(PMscale)
				.extent([15, 17]);

			d3.select("#monthly-hours-brush-selector")
				.call(AMbrushSelector);

			d3.select("#monthly-hours-brush-selector")
				.call(PMbrushSelector);
		})

		BarGraphsYScale.domain([0, 0]);

		MonthlyGraphData.data.forEach(function(d, i) {
			var graph = MonthlyGraphData.graphs[i],
				data = configureDataType(graph.type()),
				url = '/routes/brief/recent/';

			d3.json(url+TMCs)
				.post(JSON.stringify(data), monthlyGraphRequest.call(MonthlyGraphData, flow, i));
		});
	},
	componentWillReceiveProps: function(newProps, newState) {
		if (newProps.routeCollection && newProps.routeCollection != this.props.routeCollection) {
			this.loadGraphs(newProps.routeCollection);
		}
	},
	render: function() {
		var monthGraphs = MonthlyGraphData.data.map(function(d, i) {
			return(
				<div className="react-graph-div" key={"m-"+i}>
					<div id={ d.id } className="react-bar-graph" key={"g-"+i}/>
				</div>
			)
		})
		return (
			<div className="route-map-sidebar">

				<div className="react-graph-div">
					<div id="monthly-hours" className="react-line-graph"/>
				</div>

				{ monthGraphs }

				<div className="react-graph-div">
					<div id="hourly" className="react-bar-graph"/>
				</div>

			</div>
		)
	}
})

function configureDataType(type) {
	switch (type) {
		case "AM":
			var hours = AMbrushSelector.extent() || [6, 8];
			++hours[1];
			return { hours: hours.map(function(d) { return d*12; }) };
		case "PM":
			var hours = PMbrushSelector.extent() || [15, 17];
			++hours[1];
			return { hours: hours.map(function(d) { return d*12; }) };
		default:
			return {};
	}
}
function monthlyGraphRequest(flow, i) {
	return function(err, res) {
		if (err) {
			console.log(err);
		}
		else {
			var nested = nestData(res),
				data = makeRoute(nested),

				maxY = d3.max(data, function(d) { return d.values.y; }),
				domain = this.yScale.domain();

			this.yScale.domain([0, Math.max(maxY, domain[1])]);
			this.domain = this.yScale.domain();

			this.graphs[i]
				.flowLine(flow)
				.data(data);
			this.graphs.forEach(function(d) { d(); });
		}
	}.bind(this);
}

function nestMHData(data) {
	var schema = data.schema,
		schemaMap = {};
	schema.forEach(function(d, i) {
		schemaMap[d] = i;
	})
	return d3.nest()
		.key(function(d) { return d[schemaMap["month"]]; })
		.sortKeys(d3.ascending)
		.key(function(d) { return d[schemaMap["hour"]]; })
		.sortKeys(d3.ascending)
		.key(function(d) { return d[schemaMap["tmc"]]; })
		.rollup(function(grp) {
			return {
				avg: d3.sum(grp, function(d) { return +d[schemaMap["sum"]]; })/d3.sum(grp, function(d) { return +d[schemaMap["count"]]; })
			}
		})
		.entries(data.rows);
}
function makeHourLines(nested) {
	return nested.map(function(month) {
		return {
			key: month.key,
			values: month.values.map(function(hour) {
				return {
					x: +hour.key,
					y: d3.sum(hour.values, function(d) { return d.values.avg; })/60
				}
			}).sort(function(a, b) { return a.x - b.x; })
		}
	})
}

function nestData(data) {
	var schema = data.schema,
		schemaMap = {};
	schema.forEach(function(d, i) {
		schemaMap[d] = i;
	})
	return d3.nest()
		.key(function(d) { return d[schemaMap["tmc"]]; })
		.key(function(d) { return d[schemaMap["resolution"]]; })
		.sortKeys(d3.ascending)
		.rollup(function(grp) {
			return {
				x: +grp[0][schemaMap["resolution"]],
				y: d3.sum(grp, function(d) { return +d[schemaMap["sum"]]; })/d3.sum(grp, function(d) { return +d[schemaMap["count"]]; })
			}
		})
		.entries(data.rows)
}

function makeRoute(nested) {
	var route = d3.map();

	nested.forEach(function(tmc) {
		tmc.values.forEach(function(date, i) {
			if (!route.has(date.key)) {
				route.set(date.key, { key: date.key, values: {x: +date.values.x, y: +date.values.y/60 }});
			}
			else {
				route.get(date.key).values.y += +date.values.y/60;
			}
		})
	})
	return route.values().sort(function(a, b) { return +a.key-+b.key; });
}
