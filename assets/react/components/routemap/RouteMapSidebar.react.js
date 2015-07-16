"use strict"

var React = require('react'),

	d3 = require("d3"),

	BarGraph = require("./RouteMapBarGraph"),

	RouteDataStore = require("../../stores/RouteDataStore");

var margin = { left:30, bottom:5, top:15, right: 10 };

var METER_TO_MILE = 0.000621371;

var UNIQUE_GRAPH_ID = 0;

var GraphData = {
	monthly: {
		yScale: null,
		data: [
			{ url: '/routes/brief/recent/month/',
				title: 'Monthly All', id: 'monthly' },
			{ url: '/routes/brief/recent/month/AM/',
				title: 'Monthly AM', id: 'monthlyAM' },
			{ url: '/routes/brief/recent/month/PM/',
				title: 'Monthly PM', id: 'monthlyPM' }
		],
		graphs: []
	}
}

// AM Peak: HOURS [6-9)
// PM Peak: HOURS [3-6)
module.exports = React.createClass({
	componentDidMount: function() {
		this.initializeGraphs();
	},
	loadDailyGraphData: function(d) {
		console.log(d);
	},
	initializeGraphs: function() {
		for (var group in GraphData) {
			GraphData[group].yScale = d3.scale.linear();
			GraphData[group].graphs = GraphData[group].data.map(
				function(d) {
					return BarGraph()
						.margin(margin)
						.yScale(GraphData[group].yScale)
						.title(d.title)
						.onClick(this.loadDailyGraphData)
						.id(d.id);
				}, this);
			GraphData[group].graphs.forEach(function(d, i) {
				d3.select("#"+GraphData[group].data[i].id)
					.style("height", (window.innerHeight*0.15)+"px")
					.call(d)
			}, this)
		}
	},
	loadGraphs: function(TMCcodes, collection) {
		var length = 0,
			speedLength = 0,
			speed = 0;

		collection.features.forEach(function(feature) {
			length += feature.properties.length;
			if (feature.properties.speedLimit) {
				speedLength += feature.properties.length;
				speed += feature.properties.speedLimit*feature.properties.length;
			}
		})
		length *= METER_TO_MILE;
		speed /= speedLength;
		speed = speed * 3600 * METER_TO_MILE;

		var TMCs = JSON.stringify(TMCcodes);

		for (var group in GraphData) {
			GraphData[group].data.forEach(function(d, i) {
				d3.json(d.url+TMCs, function(err, res) {
					if (err) {
						console.log(err);
					}
					else {
						var expanded = expandData(res),
							nested = d3.nest()
								.key(function(d) { return d.tmc; })
								.key(function(d) { return d.date; })
								.sortKeys(d3.ascending)
								.rollup(function(group) {
									return {
											x: group[0].date,
											y: d3.sum(group, function(d) { return d.travelTime; })/group.length
										}
								})
								.entries(expandData(res))
						var flow = length / speed * 60,
							data = makeRoute(nested);
						var maxY = d3.max(data, function(d) { return d.values.y; }),
							domain = GraphData[group].yScale.domain();
						GraphData[group].yScale.domain([0, Math.max(maxY, domain[1])]);

						GraphData[group].graphs[i]
							.flowLine(flow)
							.label("minutes")
							.data(data);
						GraphData[group].graphs.forEach(function(d) { d(); });
					}
				}.bind(this));
			}, this);
		}
	},
	componentWillUpdate: function(newProps, newState) {
		if (newProps.TMCcodes.length && newProps.collection.features) {
			this.loadGraphs(newProps.TMCcodes, newProps.collection);
		}
	},
	render: function() {
		var monthGraphs = GraphData.monthly.data.map(function(d, i) {
			return(
				<div className="react-graph-div" key={"d-"+i}>
					<div id={ d.id } className="react-bar-graph" key={"g-"+i}/>
				</div>
			)
		})
		return (
			<div className="route-map-sidebar">
				{ monthGraphs }
			</div>
		)
	}
})

function expandData(data, schema) {
	var schema = data.schema.slice(0, data.schema.length-2),
		expanded = [];

	data.rows.forEach(function(row) {
		var sum = row[row.length-2],
			count = row[row.length-1],
			value = sum / count;
		for (var x = 0; x < count; ++x) {
			var obj = new Object(null);
			schema.forEach(function(d, i) {
				obj[d] = row[i];
				obj.travelTime = value;
			})
			expanded.push(obj);
		}
	})
	return expanded;
}

function makeRoute(nested) {
	var route = [];

	nested.forEach(function(tmc) {
		tmc.values.sort(function(a, b) { return +a.key - +b.key; });
		tmc.values.forEach(function(date, i) {
			if (!(i in route)) {
				route[i] = { key: date.key, values: {x: date.values.x, y: date.values.y/60 }};
			}
			else {
				route[i].values.y += date.values.y/60;
			}
		})
	})

	return route;
}
