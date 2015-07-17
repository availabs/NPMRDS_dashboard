"use strict"

var React = require('react'),

	d3 = require("d3"),

	BarGraph = require("./RouteMapBarGraph"),

	RouteDataStore = require("../../stores/RouteDataStore");

var margin = { left:30, bottom:5, top:15, right: 10 };

var METER_TO_MILE = 0.000621371;

var yScale = d3.scale.linear();

//'/routes/brief/monthly/hours/:tmc_array'
var MonthlyHoursGraph = {
	name: "monthly-hours",
	data: { url: '/routes/brief/monthly/hours/',
		title: 'Monthly Hours', id: 'monthly-hours' },
	graph: null
}

var MonthlyGraphData = {
	name: "monthly",
	domain: [0, 0],
	yScale: yScale,
	data: [
		{ url: '/routes/brief/recent/month/all/',
			title: 'Daily All', id: 'daily', type: "All" },
		{ url: '/routes/brief/recent/month/AM/',
			title: 'Daily AM', id: 'dailyAM', type: "AM" },
		{ url: '/routes/brief/recent/month/PM/',
			title: 'Daily PM', id: 'dailyPM', type: "PM" }
	],
	graphs: []
}
var DailyGraph = {
	name: "daily",
	domain: [0, 0],
	yScale: yScale,
	data: null,
	graphs: null
}

// AM Peak: HOURS [6-9)
// PM Peak: HOURS [3-6)
module.exports = React.createClass({
	componentDidMount: function() {
		this.initializeGraphs();
	},
	loadDailyGraphData: function(d, graph) {
		var date = new Date(Math.round(d.key/10000), Math.round(d.key/100)%100-1, d.key%100);
		DailyGraph.data = { url: '/routes/brief/day/'+graph.type()+'/'+d.key+"/",
			title: 'Hourly '+graph.type()+" for "+date.toDateString(), id: 'hourly', type: graph.type() };
		DailyGraph.graph
			.title(DailyGraph.data.title)
			.type(DailyGraph.data.type);

		var length = this.props.routeCollection.length,
			speed = this.props.routeCollection.speed,

			TMCs = JSON.stringify(this.props.routeCollection.tmc_codes);

		yScale.domain(MonthlyGraphData.domain);

		d3.json(DailyGraph.data.url+TMCs, function(err, res) {
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
		yScale.domain(MonthlyGraphData.domain);
		MonthlyGraphData.graphs.forEach(function(d) { d(); });
	},
	initializeGraphs: function() {
		MonthlyGraphData.yScale = yScale;
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
					.yScale(yScale)
					.id("hourly");
		d3.select("#hourly")
			.style("height", (window.innerHeight*0.15)+"px")
			.call(DailyGraph.graph);
	},
	loadGraphs: function(collection) {
		var length = collection.length,
			speed = collection.speed,

			TMCs = JSON.stringify(collection.tmc_codes);

		yScale.domain([0, 0]);

		MonthlyGraphData.data.forEach(function(d, i) {
			d3.json(d.url+TMCs, function(err, res) {
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
					this.domain = this.yScale.domain();

					this.graphs[i]
						.flowLine(flow)
						.data(data);
					this.graphs.forEach(function(d) { d(); });
				}
			}.bind(MonthlyGraphData));
		}, this);
	},
	componentWillReceiveProps: function(newProps, newState) {
		if (newProps.routeCollection) {
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
				{ monthGraphs }
				<div className="react-graph-div">
					<div id="hourly" className="react-bar-graph"/>
				</div>
			</div>
		)
	}
})

function nestData(data) {
	var schema = data.schema,
		schemaMap = {};
	schema.forEach(function(d, i) {
		schemaMap[d] = i;
	})
	return d3.nest()
		.key(function(d) { return d[schemaMap["tmc"]]; })
		.key(function(d) { return d[schemaMap["date"]]; })
		.sortKeys(d3.ascending)
		.rollup(function(grp) {
			return {
				x: +grp[0][schemaMap["date"]],
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