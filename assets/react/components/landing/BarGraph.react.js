var React = require('react'),
	d3 = require("d3"),
	crossfilter = require("crossfilter");

var UNIQUE_GRAPH_ID = 0;

exports.react = React.createClass({
	getInitialState: function() {
		return {
			id: "react-bar-graph-"+UNIQUE_GRAPH_ID++,

		}
	},
	componentDidMount: function() {
		d3.select("#"+this.state.id)
			.style("height", (window.innerHeight*0.2)+"px")
			.call(this.props.bargraph);
	},
	render: function() {
		return (
			<div id={ this.state.id } className="react-bar-graph">
				{ this.props.children }
			</div>
		)
	}
})

exports.d3 = BarGraph;

function BarGraph() {
	var data = [],
		svg = null,
		width = 0,
		height = 0,
		xScale = d3.scale.linear(),
		yScale = d3.scale.pow().exponent(5);

	function graph(selection) {
		if (selection) {
			svg = selection.append("svg")
				.style({
					height: "100%",
					width: "100%"
				});
			width = svg.node().clientWidth;
			height = svg.node().clientHeight;
			return;
		}
		var barWidth = width/(data.length+1);
		xScale.rangeRound([0, width])
			.domain([0, data.length]);
		yScale.range([0, height])
			.domain([0, d3.max(data, function(d) { return d.values.y; })]);

		var bars = svg.selectAll('rect')
			.data(data);

		bars.enter().append("rect")
			.attr("x", function(d, i) { return xScale(i); })
			.attr("y", function(d) { return height-yScale(d.values.y); })
			.attr("width", barWidth)
			.attr("height", function(d) { return yScale(d.values.y); })
			.attr("fill", "#000");
	}
	graph.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return graph;
	}
	return graph;
}