var d3 = require("d3"),
	esc = require("esc");

module.exports = function() {
	var data = [],
		selection = null,
		svg = null,
		group = null,
		lineGroup = null,
		monthSelector = null,
		margin = { top: 0, bottom: 0, left: 0, right: 0 },
		width = 0,
		height = 0,
		xScale = d3.scale.linear(),
		yScale = d3.scale.linear(),
		colorScale = d3.scale.quantize()
			.range(["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"].reverse()),
		xAxis = d3.svg.axis()
			.orient("bottom")
			.tickFormat(hourFormat)
			.scale(xScale),
		yAxis = d3.svg.axis()
			.ticks(5)
			.tickSize(3, 3)
			.orient("left")
			.scale(yScale),
		xAxisGroup = null,
		yAxisGroup = null,
		showX = true,
		showY = true,
		label = "",
		flow = 0,
		title = "graph",
		click = null,
		id = "",
		type = "",
		line = d3.svg.line()
			.x(function(d) { return xScale(d.x); })
			.y(function(d) { return yScale(d.y); }),
		voronoi = d3.geom.voronoi()
			.x(function(d) { return xScale(d.x); })
			.y(function(d) { return yScale(d.y); }),
		vGroup = null;

    function graph(slct) {
        if (arguments.length) {
            selection = slct;
			svg = selection.append("svg")
				.style({
					height: "100%",
					width: "100%"
				});
			group = svg.append("g");
			lineGroup = svg.append("g");
			xAxisGroup = group.append("g")
				.attr("class", "x axis");
			vGroup = svg.append("g")
			yAxisGroup = group.append("g")
				.attr("class", "y axis");
			monthSelector = svg.append("g");
			width = svg.node().clientWidth;
			height = svg.node().clientHeight;
			svg.style("opacity", 0);
			return;
        }
		if (data.length) {
			graph.show();
		}

		var wdth = width-margin.left-margin.right,
			hght = height-margin.top-margin.bottom;

		voronoi.clipExtent([[0, 0],[wdth, hght]]);

		group.attr("transform", "translate("+margin.left+", "+margin.top+")");
		vGroup.attr("transform", "translate("+margin.left+", "+margin.top+")");
		lineGroup.attr("transform", "translate("+margin.left+", "+margin.top+")");

		xAxisGroup.attr("transform", "translate(0, "+hght+")");
		yAxisGroup.attr("transform", "translate(-5, 0)");

		xScale.rangeRound([0, wdth])
			.domain([0, 23]);

		var extent = d3.extent(d3.merge(data.map(function(d) { return d3.extent(d.values, function(d) { return d.y; }); })));
		// console.log("EXTENT", extent)

		// var max = d3.max(data.map(function(d) { return d3.max(d.values, function(d) { return d.y; }); }));
		yScale.range([hght, 0])
			.domain([extent[0]*.9, extent[1]*1.1]);

		if (showX) {
			xAxisGroup.transition()
				.call(xAxis);
		}
		if (showY) {
			yAxisGroup.transition()
				.call(yAxis);
		}

		var lines = group.selectAll(".month-line")
			.data(data);

		lines.exit().remove();
		lines.enter().append("path")
			.attr("class", "month-line")
			.classed("selected-month-line", function(d, i) {
				return i == data.length-1;
			});

		var points = [];
		lines.transition()
			.attr({
				d: function(d) { return line(d.values) },
				fill: "none",
				opacity: 0.25
			})
			.each(function(dd) {
				dd.values.forEach(function(d) {
					points.push({
						line: this,
						x: d.x,
						y: d.y,
						key: dd.key
					})
				}, this)
			});

		var key = data[data.length-1].key,
			timeout = null,
			monthGroupOpen = false;

		var monthGroups = monthSelector.selectAll(".month-group")
			.data(data);
		monthGroups.exit().remove();
		monthGroups.enter().append("g")
			.attr("transform", "translate(50, 5)")
			.each(function(d, i) {
				var group = d3.select(this);
				group.append("rect")
					.attr({
						x: 0,
						y: 0,
						width: 70,
						height: 20,
						fill: "#fff",
						class: d.key == key ? "month-group month-group-active" : "month-group"
					});
				group.append("text")
					.attr({
						x: 35,
						y: 15,
						"text-anchor": "middle"
					})
					.text(esc.getMonth(d.key%100).slice(0,3)+" "+Math.round(+d.key/100));
			});
		monthSelector.on("mouseover", function() {
			monthGroupOpen = true;
			if (timeout) {
				clearTimeout(timeout);
			}
			if (vTimeout) {
				clearTimeout(vTimeout);
			}
			monthGroups.sort(function(a,b) {
					return +a.key - +b.key;
				})
				.transition()
				.attr("transform", function(d, i) {
					return "translate(50, "+(5+i*25)+")";
				})
		})
		monthSelector.on("mouseout", function() {
			timeout = setTimeout(function() {
				timeout = null;
				monthGroupOpen = false;
				monthGroups.sort(function(a, b) {
						return a.key == key ? 1 : -1;
					}).transition()
					.attr("transform", "translate(50, 5)");
			}, 500);
			vTimeout = setTimeout(highlightMonthLine, 25);
		})
		monthGroups.on("mouseover", highlightMonthLine);
		monthGroups.on("click", sortMonthGroups);

		function sortMonthGroups(d) {
			key = d.key || d.point.key;

			monthGroups.sort(function(a, b) {
					return a.key == key ? 1 : -1;
				}).transition()
				.attr("transform", "translate(50, 5)");
			monthGroups.selectAll("rect").filter(function(d) {
				d3.select(this).classed("month-group-active", false);
				return d.key == key;
			}).classed("month-group-active", true);
			selectMonthLine(d);
			click(key);
		}

		function selectMonthLine(d) {
			var k = d ? (d.key || d.point.key) : key;
			group.selectAll(".month-line").filter(function(d) {
				d3.select(this).classed("selected-month-line", false);
				return k == d.key;
			}).classed("selected-month-line", true);
		}

		function highlightMonthLine(d) {
			var k = d ? (d.key || d.point.key) : key;
			group.selectAll(".month-line").filter(function(d) {
				d3.select(this).classed("active-month-line", false);
				return k == d.key;
			}).classed("active-month-line", true);
		}

		var vLines = vGroup.selectAll(".vline")
			.data(voronoi(points));
		vLines.enter().append("path");
		vLines.attr({
				fill: "none",
				stroke: "none",
				"pointer-events": "all",
				class: "vline",
				d: function(d) { return "M" + d.join("L") + "Z"; }
			})
			.on({
				mousemove: mouseover,
				mouseout: mouseout,
				click: sortMonthGroups
			});

		var lbl = "",
			vTimeout = null;
		function mouseover(d) {
			if (vTimeout) {
				clearTimeout(vTimeout);
				vTimeout = null;
			}
			if (monthGroupOpen) {
				return;
			}
			d3.event.stopPropagation();

			highlightMonthLine(d.point);

			lbl = esc.getMonth(d.point.key%100).slice(0,3)+" "+Math.round(+d.point.key/100) + " hour "+hourFormat(d.point.x)+" | travel time: " + Math.round(d.point.y) + " min";
			var label = group.selectAll(".graph-text")
				.data(data.slice(0, 1));
			label.exit().remove();
			label.enter().append("text");
			label.attr({
					x: wdth,
					"text-anchor": "end",
					y: -17,
					class: "graph-text" })
				.text(lbl);
		}
		function mouseout(d) {
			d3.event.stopPropagation();
			if (monthGroupOpen) {
				return;
			}
			d3.select(d.point.line)
				.classed("active-month-line", false);
			vTimeout = setTimeout(highlightMonthLine, 25);
		}
    }

	function hourFormat(num) {
		if (num == 0) {
			return "12am";
		}
		if (num == 12) {
			return "12pm";
		}
		if (num > 12) {
			return (num-12)+"pm";
		}
		return num+"am";
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
	graph.xScale = function(x) {
		if (!arguments.length) {
			return xScale;
		}
		xScale = x;
		xAxis.scale(xScale);
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
