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

function Popup() {
	var div;
	function popup(d) {
		if (d && !div) {

			div = d3.select('body').append("div")
				.attr("class", "graph-popup")
				.style("display", "none")
				.style("position", "fixed");
			d.on("mouseover", popup.show)
				.on("mousemove", popup)
				.on("mouseout", popup.hide)
			return;
		}
		var loc = d3.mouse(document.body);
		div.style("left", (loc[0]-71)+"px")
			.style("top", (loc[1]-10)+"px")
			.text(d.key+": "+(Math.round(d.values.y*100)/100));
	}
	popup.show = function() {
		div.style("display", "block");
	}
	popup.hide = function() {
		div.style("display", "none")
	}
	return popup;
}

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
			.scale(yScale)
		xAxisGroup = null,
		yAxisGroup = null,
		showX = false,
		showY = true,
		label = "";

	var popup = Popup();

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
			barWidth = wdth/(data.length+1);

		group.attr("transform", "translate("+margin.left+", "+margin.top+")");
		xAxisGroup.attr("transform", "translate(0, "+hght+")");
		yAxisGroup.attr("transform", "translate(-5, 0)");

		xScale.rangeRound([0, wdth])
			.domain([0, data.length]);
		yScale.range([hght, 0])
			.domain([0, d3.max(data, function(d) { return d.values.y; })]);

		colorScale.domain(d3.extent(data, function(d) { return d.values.y; }));

		if (showX) {
			xAxisGroup.call(xAxis);
		}
		if (showY) {
			yAxisGroup.call(yAxis);
		}

		var bars = group.selectAll('rect')
			.data(data);

		bars.enter().append("rect")

		bars.attr({
				x: function(d, i) { return xScale(i); },
				y: function(d) { return yScale(d.values.y); },
				width: barWidth,
				height: function(d) { return hght-yScale(d.values.y); },
				fill: function(d) { return colorScale(d.values.y); },
				class: "react-rect" });
		var l = svg.selectAll(".label")
			.data([label])
		l.exit().remove();
		l.enter().append("text")
		l.attr({
				x: 5,
				y: 15,
				"font-size": 12,
				class: "label" })
			.text(function(d) { return d; });

		var t = svg.append("g").append("text")
		bars.on("mousemove", function(d) {
			t.attr({
				x: width-5,
				y: 15,
				"text-anchor": "end",
				"font-size": 12,
				class: "label" })
			.text(function() { return d.key+": "+(Math.round(d.values.y*100)/100)+" min"; });
		})

		//bars.call(popup);
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
		else {
			for (var k in t) {
				margin[k] = t[k];
			}
		}
		return graph;
	}
	return graph;
}
