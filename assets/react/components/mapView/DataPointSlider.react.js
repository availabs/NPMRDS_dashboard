var React = require('react'),
	d3 = require("d3"),

	Events = require('../../constants/AppConstants').EventTypes,

	UsageDataStore = require("../../stores/UsageDataStore");

var DataPointSlider = React.createClass({
	getInitialState: function() {
		return {
			display: {display: "none"}
		}
	},
  	componentDidMount: function() {
  		UsageDataStore.setSVG(d3.select("#NPMRDS-data-point-slider"))
      	UsageDataStore.addChangeListener(Events.DATA_POINT_SLIDER_SHOW, this._onDataSliderUpdate);
  	},

  	componentWillUnmount: function() {
      	UsageDataStore.removeChangeListener(Events.DATA_POINT_SLIDER_SHOW, this._onDataSliderUpdate);
  	},
  	_onDataSliderUpdate: function(bool) {
  		var state = this.state,
  			display = bool ? {display: "block"} : {display: "none"};

  		state.display = display;

  		this.setState(state);
  	},
	render: function() {
		return(
			<div id="NPMRDS-data-point-slider-div" style={this.state.display}>
				<svg id="NPMRDS-data-point-slider">
				</svg>
			</div>
		)
	}
});

module.exports = DataPointSlider;