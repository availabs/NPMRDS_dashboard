"use strict"
var React = require('react'),
    TMCDataStore = require("../../stores/TMCDataStore");

var NPMRDSTabSelector = React.createClass({
	remove: function() {
		TMCDataStore.removeTMC(this.props.tmc);
	},
	render : function() {
		var tabID = "tab-"+this.props.tmc,
			href = "#"+tabID,
			style = {"marginLeft": "20px"};
		return (
            <li role="presentation">
            	<a href={href} aria-controls={tabID} role="tab" data-toggle="tab">
            		{this.props.tmc}
            		<span onClick={this.remove} className="glyphicon glyphicon-remove NPMRDS-tab-close" aria-hidden="true" style={style}></span>
            	</a>
            </li>
		)
	}
});

module.exports = NPMRDSTabSelector;