"use strict"
var React = require('react'),

	Chart = require("./NPMRDS_TMC_Chart.react"),
	Graph = require("./NPMRDS_TMC_Graph.react"),

	NPMRDSChart = require("../utils/NPMRDS_TMC_Chart"),
	NPMRDSGraph = require("../utils/NPMRDS_TMC_Graph");

var NPMRDSTabPanel = React.createClass({
	getInitialState: function() {
		var chart = NPMRDSChart(),
			graph = NPMRDSGraph();

		chart.on("dataclick", graph);
		return {
			chart: chart,
			graph: graph
		}
	},
	render: function() {
		var tabID = "tab-"+this.props.tmc,
			className = this.props.active?"tab-pane clearfix active":"tab-pane";
		return (
            <div className={className} id={tabID}>
            	<div className="col-lg-12">
	                <Chart tmc={this.props.tmc} chart={this.state.chart} />
	                <Graph tmc={this.props.tmc} graph={this.state.graph} height="400px" />
	            </div>
            </div>
		)
	}
});

module.exports = NPMRDSTabPanel;