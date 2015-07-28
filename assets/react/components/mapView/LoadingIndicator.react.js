var React = require('react'),
	d3 = require("d3"),
    Constants = require('../../constants/AppConstants'),
    UsageDataStore = require("../../stores/UsageDataStore"),
    SailsWebApi = require("../../utils/api/SailsWebApi"),

    Events = Constants.EventTypes;

var LoadingIndicator = React.createClass({
	getInitialState: function() {
		return {
			loading: false
		}
	},
	componentDidMount: function() {
		SailsWebApi.addChangeListener(Events.SAILS_WEB_API_LOADING_START, this._onDataLoadingStart);
		SailsWebApi.addChangeListener(Events.SAILS_WEB_API_LOADING_STOP, this._onDataLoadingStop);
	},
	componentWillUnmount: function() {
		SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_START, this._onDataLoadingStart);
		SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_STOP, this._onDataLoadingStop);
	},
	_onDataLoadingStart: function() {
		var state = this.state;
		state.loading = true;
		this.setState(state);
	},
	_onDataLoadingStop: function() {
		var state = this.state;
		state.loading = false;
		this.setState(state);
	},
	render: function() {
		if (!this.state.loading) {
			return (<span />);
		}
		else {
			return (
				<div className="loading-indicator-div">
		            <div><span className="fa fa-spinner fa-pulse fa-2x" /><span className="loading-data">Loading Data...</span></div>
				</div>
			);
		}
	}
})

module.exports = LoadingIndicator;
