"use strict"

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes,
    TMCDataStore = require("../../stores/TMCDataStore"),

	d3 = require("d3"),

	crossfilter = TMCDataStore.getCrossFilter(),

	UNIQUE_IDs = 0;

var floatFormat = d3.format(",.2f"),
	identity = function(d) { return d; },
	dataFormat = {
		avgSpeed: floatFormat,
		avgTime: floatFormat,
		bufferTime: floatFormat,
		eightieth: floatFormat,
		freeflow: floatFormat,
		median: identity,
		distance: identity,
		miseryIndex: floatFormat,
		nintyfifth: floatFormat,
		planningTime: floatFormat,
		stddevTime: floatFormat,
		stddevSpeed: floatFormat,
		travelTimeIndex: floatFormat,
		tmc: function(d) { return d.toString(); }
	},
	dataSort = {
		avgSpeed: 0,
		avgTime: 3,
		bufferTime: 8,
		eightieth: 6,
		freeflow: 1,
		median: 5,
		distance: 12,
		miseryIndex: 9,
		nintyfifth: 7,
		planningTime: 10,
		stddevTime: 4,
		stddevSpeed: 2,
		travelTimeIndex: 11,
		tmc: -1
	}

var TMCChart = React.createClass({
	getInitialState: function() {
		return {
			chart: TMCchart().id(UNIQUE_IDs++),
			selectedTMCs: {}
		}
	},
	componentDidMount: function() {
		d3.select("#TMC-all-time-table-"+this.state.chart.id()).call(this.state.chart);

		TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this.TMCadded);
		TMCDataStore.addChangeListener(Events.REMOVE_TMC_DATA, this.TMCremoved);

		d3.select("#TMC-all-time-div-"+this.state.chart.id()).style("display", "none");
	},
	componentWillUnmount: function() {
		TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this.TMCadded);
		TMCDataStore.removeChangeListener(Events.REMOVE_TMC_DATA, this.TMCremoved);
	},
	TMCadded: function(data) {
		if (!(data.tmc.toString() in this.state.selectedTMCs)) {
			this.state.selectedTMCs[data.tmc.toString()] = data.tmc;
			this.addTMCtoChart(data.tmc);
		}
	},
	TMCremoved: function(tmc) {
		if (tmc.toString() in this.state.selectedTMCs) {
			delete this.state.selectedTMCs[tmc.toString()];
			this.removeTMCfromChart(tmc);
		}
	},
	addTMCtoChart: function(tmc) {
		var tableData = this.state.chart.data();

		crossfilter.filter("tmc", tmc);
		var tmcData = crossfilter("all");

		var data = [];
		for (var key in tmcData) {
			if (key.toString() in dataSort) {
				data.push({value:tmcData[key.toString()], name:key.toString(), sort:dataSort[key.toString()]});
			}
		}
		data.sort(function(a,b){return a.sort-b.sort});

		if (!tableData.length) {
			tableData.push(data.map(function(d) { return [d.name]; }));
		}
		tableData.push(data.map(function(d) { return [dataFormat[d.name](d.value)]; }));

		this.state.chart.data(tableData)();

		d3.select("#TMC-all-time-div-"+this.state.chart.id()).style("display", null);
	},
	removeTMCfromChart: function(tmc) {
		var tableData = this.state.chart.data(),
			len = tableData.length;

		tableData = tableData.filter(function(d) { return d[0].toString() != tmc.toString(); });
		if (len != tableData.length) {
			this.state.chart.data(tableData)();
		}

		if (tableData.length <= 1) {
			d3.select("#TMC-all-time-div-"+this.state.chart.id()).style("display", "none");
		}
	},
	render: function() {
		return (
			<div className="col-lg-12 NPMRDS-tmc-panel NPMRDS-tmc-table-panel" id={"TMC-all-time-div-"+this.state.chart.id()}>
				<div className="table-responsive">
					<table className="table table-striped table-hover" id={"TMC-all-time-table-"+this.state.chart.id()}></table>
				</div>
            </div>
		);
	}
});

module.exports = TMCChart;

function TMCchart() {
	var selfID,
		data = [],
		table;

	function chart(selection) {
		if (selection) {
			table = selection;
		}
		var thead = table.selectAll("thead").data(data.length ? ["thead"] : []);
			thead.exit().remove();
			thead.enter().append("thead");

		var row = thead.selectAll("tr").data(data.slice(0, 1));
		row.exit().remove();
		row.enter().append("tr");

		var columns = row.selectAll("th").data(function(d) { return d; });
		columns.exit().remove();
		columns.enter().append("th")
			.each(function(d, i) {
				if (i > 0 && i < data[0].length-1) {
					d3.select(this)
						.attr("class", "NPMRDS-dataview-label")
						.on("click", dataview)
				}
			})
			.classed("NPMRDS-dataview-label-active", function(d, i) { return i==1; });
		columns.text(function(d) { return d; });

		var tbody = table.selectAll("tbody").data(data.length ? ["tbody"] : []);
			tbody.exit().remove();
			tbody.enter().append("tbody");

		var rows = tbody.selectAll("tr").data(data.slice(1));
		rows.exit().remove();
		rows.enter().append("tr");

		var columns = rows.selectAll("td").data(function(d) { return d; });
		columns.exit().remove();
		columns.enter().append("td")

		columns.each(function(d, i) {
			d3.select(this)
				.text(function(d) { return d; });
			if (i == 0) {
				d3.select(this)
					.style("background-color", function(d) { return TMCDataStore.getTMCcolor(d); })
					.append("span").attr("class", "glyphicon glyphicon-remove NPMRDS-tmc-remove")
						.style({ "margin-right": "10px", float: "right" })
						.on("click", function() { remove(d); })
			}
		})
	}
	chart.id = function(id) {
		if (!arguments.length) {
			return selfID;
		}
		selfID = id;
		return chart;
	}
	chart.data = function(d) {
		if (!arguments.length) {
			return data;
		}
		data = d;
		return chart;
	}
	return chart;

	function remove(tmc) {
		TMCDataStore.removeTMC(tmc[0]);
	}
	function dataview(view) {
		TMCDataStore.changeDataView(view[0]);
		d3.select("#TMC-all-time-table-"+selfID).selectAll(".NPMRDS-dataview-label")
			.classed("NPMRDS-dataview-label-active", false);
		d3.select(this)
			.classed("NPMRDS-dataview-label-active", true);
	}
}