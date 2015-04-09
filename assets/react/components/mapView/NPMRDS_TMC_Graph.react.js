"use strict"
var React = require('react'),
    Events = require('../../constants/AppConstants').EventTypes,

	TMCDataStore = require("../../stores/TMCDataStore");

var NPMRDSgraph = React.createClass({
	componentDidMount: function() {
		this.props.graph
			.data(TMCDataStore.getTMCData(this.props.tmc))
			.height(this.props.height)
			.init()("median");
        // TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
	},
	componentWillUnmount: function() {
        // TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
	},
	// _onDisplayTMCdata: function(data) {
	// },
	render : function() {
		return (
            <div id={this.props.graph.id()} className="NPMRDS-graph-div" ></div>
		)
	}
});

module.exports = NPMRDSgraph;