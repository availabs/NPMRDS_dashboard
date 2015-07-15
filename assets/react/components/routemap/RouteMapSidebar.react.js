"use strict"

var React = require('react'),

	MonthGraph = require("./MonthGraph.react"),

	RouteDataStore = require("../../stores/RouteDataStore");

module.exports = React.createClass({
	render: function() {
		return (
			<div className="route-map-sidebar">
				<MonthGraph url={ '/routes/brief/recent/month/' } 
					title="All Times" TMCcodes={ this.props.TMCcodes } 
					collection={ this.props.collection }/>
				<MonthGraph url={ '/routes/brief/recent/month/AM/' } 
					title="AM Peak" TMCcodes={ this.props.TMCcodes } 
					collection={ this.props.collection }/>
				<MonthGraph url={ '/routes/brief/recent/month/PM/' } 
					title="PM Peak" TMCcodes={ this.props.TMCcodes } 
					collection={ this.props.collection }/>
			</div>
		)
	}
})
