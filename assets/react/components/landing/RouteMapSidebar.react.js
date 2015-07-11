"use strict"

var React = require('react'),

	BarGraph = require("./BarGraph.react"),
	ReactBarGraph = BarGraph.react;

// unexpanded schema: ["month", "total", "num"]
// expanded schema: {month: val, travelTime: val}

function expandData(data) {
	var expanded = [];
	data.rows.forEach(function(row) {
		var sum = row[1],
			count = row[2],
			value = sum / count;
		for (var x = 0; x < count; ++x) {
			expanded.push({ month: row[0], travelTime: value });
		}
	})
	return expanded;
}

module.exports = React.createClass({
	getInitialState: function() {
		return {
			graph: BarGraph.d3(),
			TMCcodes: this.props.TMCcodes
		};
	},
	componentWillReceiveProps: function(newProps) {
		console.log(newProps)
		if (newProps.TMCcodes.length) {
	        var today = new Date(),
	            num = today.getFullYear()*10000+(today.getMonth()+1)*100+today.getDay(),
	            TMCs = JSON.stringify(newProps.TMCcodes);

	        d3.json("/routes/getdata/"+num+"/"+TMCs, function(err, res) {
	            if (err) {
	            	console.log(err);
	            }
	            else {
	            	var nested = d3.nest()
	            		.key(function(d) { return d.month; })
    					.sortKeys(d3.ascending)
	            		.rollup(function(d) {
	            			return {
	            				x: d[0].month,
	            				y: d3.sum(d.map(function(d) { return d.travelTime; })) / d.length
	            			}
	            		})
	            		.entries(expandData(res))
	            	this.state.graph.data(nested)();
	            }
	        }.bind(this));
	    }
		this.setState({
			graph: this.state.graph,
			TMCcodes: newProps.TMCcodes
		});
	},
	render: function() {
		return (
			<div className="route-map-sidebar">
				<ReactBarGraph bargraph={ this.state.graph }>
				</ReactBarGraph>
			</div>
		)
	}
})