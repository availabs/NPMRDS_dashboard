var d3 = require("d3");

var UNIQUE_CHART_IDs = 0;

function NPMRDSChart() {
	var data = [],
		id = (function() { return "NPMRDS-chart-"+UNIQUE_CHART_IDs++; })(),
		dispatcher = d3.dispatch("dataclick"),
		callback = null,
		dataview = "median",
		graph = null;

	dispatcher.dataclick.bind(chart);

	var table = null,
		tbody,
		format = d3.format(",.2f");

	function chart() {
		if (!table && data.length) {
			table = d3.select("#"+id).append("table")
				.attr("class", "table table-striped table-hover");

			var row = table.append("thead")
				.append("tr");

			var headerData = ["TMC"].concat(data[0].all.schema),
				headers = row.selectAll("th").data(headerData);
			headers.exit().remove();
			headers.enter().append("th");
			headers.each(function(d, i) {
				var th = d3.select(this);
				if (i > 0 && i < 8) {
					th.attr("class", "NPMRDS-dataview")
						.on("click.NPMRDS-chart", dispatcher.dataclick)
				}
				th.text(d);
			});

			tbody = table.append("tbody");
		}
		if (!data.length) {
			table.remove();
			table = null;
		}

		var rows = tbody.selectAll("tr")
			.data(data);

		rows.exit().remove();

		rows.enter().append("tr");

		var columns = rows.selectAll("td").data(function(d, i) {
			return [d.tmc].concat(d.all.rows[0]);
		})
		columns.exit().remove();
		columns.enter().append("td");
		columns.each(function(d, i) {
			var td = d3.select(this);
			if (i == 0) {
				td.style("font-weight", 600);
			}
			if (i < 4) {
				td.text(d);
			}
			else {
				td.text(format(d));
			}
			if (i == 0) {
				td.append("span")
					.on("click.NPMRDS-chart", function() {
						callback(d);
						removeTMC(d);
					})
					.attr("class", "glyphicon glyphicon-remove NPMRDS-tmc-remove")
					.style("margin-left", "20px");
			}
		});
	}
	chart.on = function(e, l) {
		if (!arguments.length) {
			return chart;
		}
		if (arguments.length == 1) {
			return dispatcher.on(e);
		}
		dispatcher.on(e, l);
		return chart;
	}
	chart.dataview = function(v) {
		if (!arguments.length) {
			return dataview;
		}
		dataview = v;
		dispatcher.dataclick(dataview);
		return chart;
	}
	chart.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		graph.data(d)(dataview);
		return chart;
	}
	chart.id = function(i) {
		if (!arguments.length) {
			return id;
		}
		id = i;
		return chart;
	}
	chart.setCallback = function(func) {
		callback = func;
		return chart;
	}
	chart.setGraph = function(g) {
		graph = g;
		return chart;
	}
	return chart;

	function removeTMC(tmc) {
		console.log(tmc);
		data = data.filter(function(d) { return tmc != d.tmc; });
		chart();
		graph.data(data)(dataview);
	}
}

module.exports = NPMRDSChart;