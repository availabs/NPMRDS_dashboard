var d3 = require("d3"),
	nvd3 = require("../../../../node_modules/nvd3/nv.d3");

var UNIQUE_GRAPH_IDs = 0;

function NPMRDSGraph() {
	var data = [],
		graphData = [],
		nvd3Data = [],
		id = (function() { return "NPMRDS-graph-"+UNIQUE_GRAPH_IDs++; })(),
		width = "750px",
		height = "500px",
		initted = false;

	// var nvd3Graph;

	// var margin = {left:50, top:50, right:25, bottom:25},
	// 	wdth = parseInt(width)-(margin.left+margin.right),
	// 	hght = parseInt(height)-(margin.top+margin.bottom);

	// var svg,
	// 	graphGroup,
	// 	xAxisGroup,
	// 	yAxisGroup;

	// var xScale = d3.scale.ordinal()
	// 		.rangePoints([0, wdth], 1),

	// 	yScale = d3.scale.linear()
	// 		.range([hght, 0]);

	// var xAxis = d3.svg.axis()
	// 		.scale(xScale)
	// 		.orient("bottom"),

	// 	yAxis = d3.svg.axis()
	// 		.scale(yScale)
	// 		.orient("left");

	// var line = d3.svg.line()
	// 	.x(function(d) { return xScale(d.x); })
	// 	.y(function(d) { return yScale(d.y); });

	function graph(dataName) {
		if (!initted) {
			initted = true;
			graph.init();
		}
console.log("graph data", data);

		if (!data.length) {
			d3.select("#"+id+" svg").remove();
			initted = false;
		}

		var dataIndex = 0;

		graphData = [];
		data.forEach(function(d) {
			d.monthly.schema.forEach(function(d, i) {
				if (d == dataName) dataIndex = i;
			})

			d.monthly.rows.sort(function(a, b) {
				var aMonth = +a[9] < 10 ? "0"+a[9] : a[9].toString(),
					aYear = a[8],
					bMonth = +b[9] < 10 ? "0"+b[9] : b[9].toString(),
					bYear = b[8];
				return +(aYear.toString()+aMonth) - +(bYear.toString()+bMonth);
			});

			var lineData = [];

			d.monthly.rows.forEach(function(d) {
				lineData.push({
					x: d[9]+'-'+d[8]%100,
					y: +d[dataIndex]
				});
			});
			graphData.push({ values: lineData, key: d.tmc });
		})

		nvd3.addGraph(function() {
			nvd3Graph = nvd3.models.lineChart()
				.x(function(d, i) { return i; })
				.margin({left: 100, top: 50, right: 25, bottom: 50})
				.tooltips(true)
				.transitionDuration(350)
				.showYAxis(true)
				.showXAxis(true);

			nvd3Graph.xAxis
				.tickFormat(function(d) { return graphData[0].values[d].x; })
				.axisLabel("Date");

			nvd3Graph.yAxis
				.tickFormat(d3.format(",.1f"))
				.axisLabel("temp (units)");

			d3.select("#"+id+" svg")
				.datum(graphData)
				.call(nvd3Graph);

			nvd3.utils.windowResize(nvd3Graph.update);

			return nvd3Graph;
		});

		// nvd3Graph.update();

		// xScale.domain(lineData.map(function(d) { return d.x; }));
		// var yExtent = d3.extent(lineData.map(function(d) { return d.y; }));
		// yScale.domain([yExtent[0]*.8, yExtent[1]*1.2]);

		// xAxisGroup.transition().call(xAxis);
		// yAxisGroup.transition().call(yAxis);

		// var path = graphGroup.selectAll(".NPMRDS-graph-path")
		// 	.data([lineData]);
		// path.enter().append("path")
		// 	.attr({stroke:"#000", fill:"none", class:"NPMRDS-graph-path"});
		// path.transition().attr("d", line);
	}
	graph.init = function() {
		// wdth = parseInt(width)-(margin.left+margin.right);
		// xScale.rangePoints([0, wdth], 1);

		// hght = parseInt(height)-(margin.top+margin.bottom);
		// yScale.range([hght, 0]);

		d3.select("#"+id).append("svg")
			.attr({ width: "100%", height: height, class: "NPMRDS-graph-svg" });

		// graphGroup = svg.append("g")
		// 	.style("transform", "translate("+margin.left+"px, "+margin.top+"px)"),

		// xAxisGroup = graphGroup.append("g").attr("class", "x axis")
		// 	.style("transform", "translate(0px, "+hght+"px)"),

		// yAxisGroup = graphGroup.append("g").attr("class", "y axis");

		// nvd3.utils.windowResize(nvd3Graph.update);
		// nvd3.addGraph(nvd3Graph);

		return graph;
	}
	graph.data = function(d) {
		if (!arguments.length) {
			return graphData;
		}
		data = d;
		return graph;
	}
	graph.width = function(w) {
		if (!arguments.length) {
			return width;
		}
		width = w;
		return graph;
	}
	graph.height = function(h) {
		if (!arguments.length) {
			return height;
		}
		height = h;
		return graph;
	}
	graph.id = function(i) {
		if (!arguments.length) {
			return id;
		}
		id = i;
		return graph;
	}
	return graph;
}

module.exports = NPMRDSGraph;