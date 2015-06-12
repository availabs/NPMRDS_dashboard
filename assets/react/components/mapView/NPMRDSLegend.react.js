var React = require('react'),
    d3 = require("d3"),

	Events = require('../../constants/AppConstants').EventTypes,

    UsageDataStore = require("../../stores/UsageDataStore"),

	linkShader = UsageDataStore.linkShader();

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
		var views = UsageDataStore.getDataViews();
		return {
			display: { display: "none" },
			dataView: views.current
		}
	},
  	componentDidMount: function() {
      	UsageDataStore.addChangeListener(Events.USAGE_DATA_PROCESSED, this._onUsageDataProcessed);
      	UsageDataStore.addChangeListener(Events.TMC_DATAVIEW_CHANGE, this._onDataViewChange);

      	scale = linkShader.scale();
  	},

  	componentWillUnmount: function() {
      	UsageDataStore.removeChangeListener(Events.USAGE_DATA_PROCESSED, this._onUsageDataProcessed);
      	UsageDataStore.removeChangeListener(Events.TMC_DATAVIEW_CHANGE, this._onDataViewChange);
  	},
  	_onDataViewChange: function(view) {
  		var state = this.state;

  		state.dataView = view;

  		this.setState(state);
  	},

  	_onUsageDataProcessed: function() {
  		var state = this.state;

  		state.display = {display: "block"};

  		this.setState(state);
  	},

	render: function() {
		var bins = [],
		scaleType='';
		["Speed", "Congestion", "Time", "Flow"]
		if(this.state.dataView === 'Speed' || this.state.dataView === 'Flow'){
			scaleType = ' mph'
		}
		else if(this.state.dataView === 'Congestion'){
			scaleType = '%'
		}
		else if(this.state.dataView === 'Time'){
			scaleType = ' seconds'
		}
		
		if (scale) {
			 bins = scale.range().map(function(d, i) {
				var v = scale.invertExtent(d),
					text;
				if (i == 0) {
					text = ""+Math.floor(v[0])+" - "+Math.round(v[1])+scaleType;
				}
				else if (i == scale.range().length-1) {
					text = ""+Math.round(v[0])+" - "+Math.ceil(v[1])+scaleType;
				}
				else {
					text = ""+Math.round(v[0])+" - "+Math.round(v[1])+scaleType;
				}
				var bgColor = {"backgroundColor":d};
				return (
					<div className="NPMRDS-legend-bin" style={bgColor}  key={i}>{text}</div>
				)
			})
		}
		return (
			<div style={this.state.display} className="NPMRDS-legend">
				<div className="NPMRDS-legend-label" data-toggle="collapse" data-target="#NPMRDS-Legend-Collapse">{this.state.dataView} Legend</div>
				<div id="NPMRDS-Legend-Collapse" className="collapse in">
					{bins}
				</div>
			</div>
		)
	}
})

module.exports = NPMRDSLegend;