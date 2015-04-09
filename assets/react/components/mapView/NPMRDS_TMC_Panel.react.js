"use strict"

var React = require('react'),

	Chart = require("./NPMRDS_TMC_Chart.react"),
	Graph = require("./NPMRDS_TMC_Graph.react"),

    Events = require('../../constants/AppConstants').EventTypes,
    TMCDataStore = require("../../stores/TMCDataStore"),

	NPMRDSChart = require("../utils/NPMRDS_TMC_Chart"),
	NPMRDSGraph = require("../utils/NPMRDS_TMC_Graph");

var NPMRDSTMCPanel = React.createClass({
	componentDidMount: function() {
		TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this.addTMC);
		TMCDataStore.addChangeListener(Events.REMOVE_TMC_DATA, this.removeTMC);
	},
	componentWillUnmount: function() {
		TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this.addTMC);
		TMCDataStore.removeChangeListener(Events.REMOVE_TMC_DATA, this.removeTMC);
	},
	addTMC: function(data) {
		if (data.tmc in this.state.selectedTMCs) {
			return;
		}
		this.state.selectedTMCs[data.tmc] = true;
		var chartData = this.state.chart.data();
		chartData.push(data);
		this.state.chart.data(chartData)();

		//this.state.graph.data(chartData);
	},
	removeTMC: function(tmc) {
		delete this.state.selectedTMCs[tmc];
	},
	getInitialState: function() {
		var graph = NPMRDSGraph(),
			chart = NPMRDSChart()
				.setCallback(this.removeTMC)
				.setGraph(graph);

		chart.on("dataclick", graph);
		return {
			chart: chart,
			graph: graph,
			selectedTMCs: {}
		}
	},
	render: function() {
		return (
			<div className="col-lg-12" id="NPMRDS-TMC-panel">
	            <div id={this.state.chart.id()} ></div>
	            <div id={this.state.graph.id()} ></div>
            </div>
		)
	}
});

module.exports = NPMRDSTMCPanel;