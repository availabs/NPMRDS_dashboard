var React = require('react'),
	d3 = require("d3"),
    ServerActionCreators = require('../actions/ServerActionsCreator'),

    UsageDataStore = require("../stores/UsageDataStore"),


	DataViews = UsageDataStore.getDataViews().DataViews,
    dataView = UsageDataStore.getDataViews().current;

var DataView = React.createClass({
	componentDidMount: function() {
		d3.selectAll(".NPMRDS-data-view-label")
			.filter(function(s) { return d3.select(this).attr("data-bind") == dataView; })
			.classed("NPMRDS-data-view-label-selected", true);
	},
	render: function() {
		var views = DataViews.map(function(view) {
			return (
				<li onClick={changeView} className="NPMRDS-data-view-label" data-bind={view}>
					{view}
				</li>
			);
		});
		return (
			<div className="NPMRDS-data-view">
				<ul>
					{views}
				</ul>
			</div>
		);
	}
})

function changeView(e) {
	d3.selectAll(".NPMRDS-data-view-label")
		.classed("NPMRDS-data-view-label-selected", false);
	var selection = d3.select(e.target)
			.classed("NPMRDS-data-view-label-selected", true),
		view = selection.attr("data-bind");
	ServerActionCreators.changeDataView(view);
}

module.exports = DataView;