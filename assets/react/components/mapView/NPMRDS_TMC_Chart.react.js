"use strict"

var React = require('react'),
    Events = require('../../constants/AppConstants').EventTypes,

	TMCDataStore = require("../../stores/TMCDataStore");

var NPMRDSchart = React.createClass({
	componentDidMount: function() {
		this.props.chart
			.data(TMCDataStore.getTMCData(this.props.tmc))();
        // TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
	},
	componentWillUnmount: function() {
        // TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
	},
	// _onDisplayTMCdata: function(data) {
	// },
	render : function() {
		return (
            <div id={this.props.chart.id()} className="NPMRDS-chart-div"></div>
		)
	}
});

module.exports = NPMRDSchart;