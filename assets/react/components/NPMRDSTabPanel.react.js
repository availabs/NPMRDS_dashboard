"use strict"
var React = require('react');

var NPMRDSTabPanel = React.createClass({
	render : function() {
		var tabID = "tab-"+this.props.tmc,
			style = {padding: "0px", overflow: "hidden", margin: "0px"};
		return (
            <div role="tabpanel" className="tab-pane row" id={tabID} style={style}>
                <div className="col-lg-12" stye={style}>
                	STUFF GOES HERE FOR LINK: {this.props.tmc}
                </div>
            </div>
		)
	}
});

module.exports = NPMRDSTabPanel;