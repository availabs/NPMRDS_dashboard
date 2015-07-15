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
			.style("height", (window.innerHeight*0.125)+"px")
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
		group = null,
		margin = { top: 0, bottom: 0, left: 0, right: 0 },
		width = 0,
		height = 0,
		xScale = d3.scale.linear(),
		yScale = d3.scale.linear(),
		colorScale = d3.scale.quantize()
			.range(["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"].reverse()),
		xAxis = d3.svg.axis()
			.orient("bottom")
			.scale(xScale),
		yAxis = d3.svg.axis()
			.tickSize(3, 3)
			.orient("left")
			.scale(yScale),
		xAxisGroup = null,
		yAxisGroup = null,
		showX = false,
		showY = true,
		label = "",
		flow = 0,
		title = "graph";

	function graph(selection) {
		if (selection) {
			svg = selection.append("svg")
				.style({
					height: "100%",
					width: "100%"
				});
			group = svg.append("g");
			xAxisGroup = group.append("g")
				.attr("class", "x axis");
			yAxisGroup = group.append("g")
				.attr("class", "y axis");
			width = svg.node().clientWidth;
			height = svg.node().clientHeight;
			return;
		}
		var wdth = width-margin.left-margin.right,
			hght = height-margin.top-margin.bottom,
			barWidth = Math.floor(wdth/(data.length+1));

		group.attr("transform", "translate("+margin.left+", "+margin.top+")");
		xAxisGroup.attr("transform", "translate(0, "+hght+")");
		yAxisGroup.attr("transform", "translate(-5, 0)");

		xScale.rangeRound([0, wdth])
			.domain([0, data.length]);
		yScale.range([hght, 0])
			.domain([0, d3.max(data, function(d) { return d.values.y; })]);

		var extent = d3.extent(data, function(d) { return d.values.y; });
		extent[0] = flow ? flow : extent[0];
		colorScale.domain(extent);

		if (showX) {
			xAxisGroup.call(xAxis);
		}
		if (showY) {
			yAxisGroup.call(yAxis);
		}

		var bars = group.selectAll('rect')
			.data(data);
		bars.enter().append("rect")
			.attr({
				y: hght,
				height: 0,
				width: barWidth,
				class: "react-rect",
				fill: "#fff"
			});

		var sum = 0;
		bars.each(function(d) {
				sum += d.values.y;
			})
			.transition().attr({
				x: function(d, i) { return xScale(i); },
				y: function(d) { return yScale(d.values.y); },
				height: function(d) { return hght-yScale(d.values.y); },
				fill: function(d) { return colorScale(d.values.y); }
			});
		var avg = sum / data.length;

		var ttl = svg.selectAll(".title")
			.data([title])
		ttl.exit().remove();
		ttl.enter().append("text");
		ttl.attr({
				x: 200,
				y: 10,
				"font-size": 12,
				class: "title" })
			.text(function(d) { return d; });

		var lbl = svg.selectAll(".label")
			.data([label])
		lbl.exit().remove();
		lbl.enter().append("text");
		lbl.attr({
				x: 5,
				y: 10,
				"font-size": 12,
				class: "label" })
			.text(function(d) { return d; });

		var date = null;
		bars.on("mouseover", function(d) {
			date = new Date(Math.round(d.key/10000), Math.round(d.key/100)%100-1, d.key%100);
		})
		bars.on("mousemove", function(d) {
			var t = svg.selectAll(".info")
				.data(["info"])
			t.exit().remove();
			t.enter().append("text");
			t.attr({
				x: width-5,
				y: 10,
				"text-anchor": "end",
				"font-size": 12,
				class: "info" })
			.text(function() { return date.toDateString()+": "+Math.round(d.values.y)+" min"; });
		})

		var avgLine = group.selectAll(".avg-line")
			.data([avg]);
		avgLine.exit().remove();
		avgLine.enter().append("line")
			.attr({
			x1: 0,
			y1: hght,
			x2: wdth,
			y2: hght,
			class: "avg-line"
			})
		avgLine.transition().attr({
			x1: 0,
			y1: yScale(avg),
			x2: wdth,
			y2: yScale(avg)
		})

		var flowLine = group.selectAll(".flow-line")
			.data([flow]);
		flowLine.exit().remove();
		flowLine.enter().append("line").attr({
			x1: 0,
			y1: hght,
			x2: wdth,
			y2: hght,
			class: "flow-line",
			"stroke-dasharray": "3 3"
		})
		flowLine.transition().attr({
			x1: 0,
			y1: yScale(flow),
			x2: wdth,
			y2: yScale(flow)
		})
	}
	graph.title = function(t) {
		if (!arguments.length) {
			return title;
		}
		title = t;
		return graph;
	}
	graph.flowLine = function(fl) {
		if (!arguments.length) {
			return flow;
		}
		flow = fl;
		return graph;
	}
	graph.label = function(l) {
		if (!arguments.length) {
			return label;
		}
		label = l;
		return graph;
	}
	graph.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return graph;
	}
	// margin params:
	// object with any values for: { top: 0, bottom: 0, left: 0, right: 0 }
	// numbers: top, left, bottom, right
	graph.margin = function(t, l, b, r) {
		if (!arguments.length) {
			return margin;
		}
		if (typeof t == "number") {
			margin.top = t || margin.top;
			margin.left = l || margin.left;
			margin.bottom = b || margin.bottom;
			margin.right = r || margin.right;
		}
		else if (typeof t == "object") {
			for (var k in t) {
				margin[k] = t[k];
			}
		}
		return graph;
	}
	return graph;
}
