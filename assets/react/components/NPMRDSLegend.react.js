var React = require('react'),
    d3 = require("d3"),

	Events = require('../constants/AppConstants').EventTypes,

    UsageDataStore = require("../stores/UsageDataStore");

var linkShader = UsageDataStore.linkShader();

var scale = null,
	selection = null,
	legendLabel,
	minimized = false,
	height = 0,
	label = "None",
	labelDiv,
	minimized = false;

var NPMRDSLegend = React.createClass({
	getInitialState: function() {
		return {
			display: {display: "none"}
		}
	},
  	componentDidMount: function() {
      	UsageDataStore.addChangeListener(Events.USAGE_DATA_PROCESSED, this._onUsageDataProcessed);

      	scale = linkShader.scale();
  	},

  	componentWillUnmount: function() {
      	UsageDataStore.removeChangeListener(Events.USAGE_DATA_PROCESSED, this._onUsageDataProcessed);
  	},

  	_onUsageDataProcessed: function() {
  		var state = this.state;

  		state.display = {display: "block"};

  		this.setState(state);
  	},

	render: function() {
		var bins = [];
		if (scale) {
			 bins = scale.range().map(function(d, i) {
				var v = scale.invertExtent(d),
					text;
				if (i == 0) {
					text = "["+Math.floor(v[0])+", "+Math.round(v[1])+")";
				}
				else if (i == scale.range().length-1) {
					text = "["+Math.round(v[0])+", "+Math.ceil(v[1])+")";
				}
				else {
					text = "["+Math.round(v[0])+", "+Math.round(v[1])+")";
				}
				var bgColor = {"background-color":d};
				return (
					<div className="NPMRDS-legend-bin" style={bgColor}>{text}</div>
				)
			})
		}
		return (
			<div style={this.state.display} className="NPMRDS-legend">
				<div className="NPMRDS-legend-label" data-toggle="collapse" data-target="#NPMRDS-Legend-Collapse">Legend</div>
				<div id="NPMRDS-Legend-Collapse" className="collapse in">
					{bins}
				</div>
			</div>
		)
	}
})

module.exports = NPMRDSLegend;