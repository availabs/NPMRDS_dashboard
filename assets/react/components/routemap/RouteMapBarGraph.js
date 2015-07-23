var d3 = require("d3");

module.exports = function() {
	var data = [],
		selection = null,
		svg = null,
		group = null,
		lineGroup = null,
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
			.ticks(5)
			.tickSize(3, 3)
			.orient("left")
			.scale(yScale),
		xAxisGroup = null,
		yAxisGroup = null,
		showX = false,
		showY = true,
		label = "",
		flow = 0,
		title = "graph",
		click = null,
		id = "",
		type = "";

	function graph(slct) {
		if (arguments.length) {
			selection = slct
			svg = selection.append("svg")
				.style({
					height: "100%",
					width: "100%"
				});
			group = svg.append("g");
			lineGroup = svg.append("g");
			xAxisGroup = group.append("g")
				.attr("class", "x axis");
			yAxisGroup = group.append("g")
				.attr("class", "y axis");
			width = svg.node().clientWidth;
			height = svg.node().clientHeight;
			svg.style("opacity", 0);
			return;
		}
		if (data.length) {
			graph.show();
		}
		else {
			graph.hide();
		}

		var wdth = width-margin.left-margin.right,
			hght = height-margin.top-margin.bottom;

		group.attr("transform", "translate("+margin.left+", "+margin.top+")");
		lineGroup.attr("transform", "translate("+margin.left+", "+margin.top+")");

		xAxisGroup.attr("transform", "translate(0, "+hght+")");
		yAxisGroup.attr("transform", "translate(-5, 0)");

		// var xExtent = d3.extent(data, function(d) { return +d.values.x; });

		var barWidth = wdth/(data.length+1);
		// var barWidth = wdth/(xExtent[1]-xExtent[0]+2);
		xScale.rangeRound([0, wdth])
			.domain([0,data.length]);
			// .domain([xExtent[0], xExtent[1]+1]);

		yScale.range([hght, 0]);

		colorScale.domain([flow*3/4, flow*3]);

		if (showX) {
			xAxisGroup.transition()
				.call(xAxis);
		}
		if (showY) {
			yAxisGroup.transition()
				.call(yAxis);
		}

		var bars = group.selectAll('rect')
			.data(data, function(d) { return d.key+"-"+id; });

		bars.exit().transition()
			.attr("height", 0)
			.attr("y", hght)
			.remove();

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
			.on("click", function(d) {
				click(d, graph);
			});
		var avg = sum / data.length;
		bars.transition().attr({
				x: function(d, i) { return xScale(i); },
				y: function(d) { return yScale(d.values.y); },
				height: function(d) { return hght-yScale(d.values.y); },
				fill: function(d) { return colorScale(d.values.y); },
				width: barWidth
			});

		var ttl = group.selectAll(".title")
			.data(data.slice(0,1))
		ttl.exit().remove();
		ttl.enter().append("text");
		ttl.attr({
				x: 100,
				y: -2,
				"font-size": 12,
				class: "title" })
			.text(title);

		var lbl = group.selectAll(".label")
			.data(data.slice(0,1));
		lbl.exit().remove();
		lbl.enter().append("text");
		lbl.attr({
				x: -25,
				y: -5,
				"font-size": 12,
				class: "label" })
			.text(label);

		var date = null,
			timeLabel = "";
		bars.on("mouseover", function(d) {
			if (/\d{8}/.test(d.key)) {
				date = new Date(Math.round(d.key/10000), Math.round(d.key/100)%100-1, d.key%100);
				timeLabel = date.toDateString()+" | travel time: "+Math.round(d.values.y)+" min";
			}
			else if (/\d{1,3}/.test(d.key)) {
				timeLabel = +d.key > 12 ? (+d.key-12)+"-"+(+d.key-12)+":59"+" PM" :
					(+d.key)==0 ? (+d.key+12)+"-"+(+d.key+12)+":59"+" AM" : (+d.key)+"-"+(+d.key)+":59"+" AM";
				timeLabel += " | travel time: "+Math.round(d.values.y)+" min";
			}
		})
		bars.on("mousemove", function(d) {
			var t = group.selectAll(".info")
				.data(data.slice(0,1))
			t.exit().remove();
			t.enter().append("text");
			t.attr({
				x: wdth,
				y: -2,
				"text-anchor": "end",
				"font-size": 12,
				class: "info" })
			.text(timeLabel);
		})

		var avgLine = lineGroup.selectAll(".avg-line")
			.data(data.slice(0,1));
		avgLine.exit().remove();
		avgLine.enter().append("line")
			.attr({
			x1: 0,
			y1: hght,
			x2: wdth,
			y2: hght,
			class: "avg-line"
		});
		avgLine.transition().attr({
			x1: 0,
			y1: yScale(avg),
			x2: wdth,
			y2: yScale(avg)
		});

		var flowLine = lineGroup.selectAll(".flow-line")
			.data(data.slice(0,1));
		flowLine.exit().remove();
		flowLine.enter().append("line").attr({
			x1: 0,
			y1: hght,
			x2: wdth,
			y2: hght,
			class: "flow-line",
			"stroke-dasharray": "3 3"
		});
		flowLine.transition().attr({
			x1: 0,
			y1: yScale(flow),
			x2: wdth,
			y2: yScale(flow)
		});
	}
	graph.hide = function() {
		svg.transition().style("opacity", 0);
		return graph;
	}
	graph.show = function() {
		svg.transition().style("opacity", 1);
		return graph;
	}
	graph.type = function(t) {
		if (!arguments.length) {
			return type;
		}
		type = t;
		return graph;
	}
	graph.id = function(i) {
		if (!arguments.length) {
			return id;
		}
		id = i;
		return graph;
	}
	graph.yScale = function(y) {
		if (!arguments.length) {
			return yScale;
		}
		yScale = y;
		yAxis.scale(yScale);
		return graph;
	}
	graph.onClick = function(c) {
		if (!arguments.length) {
			return click;
		}
		click = c;
		return graph;
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
