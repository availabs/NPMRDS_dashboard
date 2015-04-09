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
			expanded = this.props.active?"true":"false",
			style={"marginLeft":"20px"};
		return (
            <li className={this.props.active?"active":""}>
            	<a href={href} aria-controls={tabID} role="tab" data-toggle="tab" aria-expanded={expanded} className="NPMRDS-tab">
        			{this.props.tmc}
        			<span onClick={this.remove} className="glyphicon glyphicon-remove NPMRDS-tab-close" style={style}></span>
            	</a>
            </li>
		)
	}
});

module.exports = NPMRDSTabSelector;