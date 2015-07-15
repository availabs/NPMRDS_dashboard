"use strict"

var React = require('react'),

	MonthGraph = require("./MonthGraph.react"),

	BarGraph = require("./BarGraph.react"),
	ReactBarGraph = BarGraph.react;

var METER_TO_MILE = 0.000621371;

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

module.exports = React.createClass({
	getInitialState: function() {
		return {
			d3graph: BarGraph.d3().margin({left:30, bottom:5, top:15, right: 5}),
			TMCcodes: this.props.TMCcodes
		};
	},
	componentWillReceiveProps: function(newProps) {
	},
	componentWillUpdate: function(newProps, newState) {
		if (newProps.TMCcodes.length && newProps.collection.features) {

			var collection = newProps.collection,
				length = 0,
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

	        var TMCs = JSON.stringify(newProps.TMCcodes);
	        d3.json(this.props.url+TMCs, function(err, res) {
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

				var flow = length / speed * 60;

				var data = makeRoute(nested);
	            	this.state.d3graph
                        .title(this.props.title)
						.flowLine(flow)
						.label("minutes")
						.data(data)();
	            }
	        }.bind(this));
	    }
	},
	render: function() {
		return (
			<div className="react-graph-div">
				<ReactBarGraph bargraph={ this.state.d3graph }>
				</ReactBarGraph>
			</div>
		)
	}
})

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

// function stacked(nested) {
// 	var data = [];
// 	nested.forEach(function(tmc) {
// 		var obj = {
// 			values: tmc.values.sort(function(a,b){return b.key-a.key})
// 						.map(function(d) { return {x:d.values.x,y:d.values.y}; }),
// 			tmc: tmc.key
// 		}
// 		data.push(obj);
// 	})
// 	console.log("READY TO STACK", data);
// 	var stack = d3.layout.stack()
// 		.offset("zero")
// 		.values(function(d) { return d.values; })
// 		.x(function(d) { return d.x; })
// 		.y(function(d) { return d.y; })
// 		.out(function(d, y, y0) { d.y = y; d.y0 = y0; });
//
// 	console.log("??????????",stack(data));
// }
