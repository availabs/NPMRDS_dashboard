var React = require('react'),
	d3 = require("d3"),
    ServerActionCreators = require('../actions/ServerActionsCreator'),

    UsageDataStore = require("../stores/UsageDataStore"),


	DataViews = UsageDataStore.getDataViews().DataViews,
    dataView = UsageDataStore.getDataViews().current;

var DataView = React.createClass({
	render: function() {
		var views = DataViews.map(function(view) {
			return (
				<div onClick={changeView} className="NPMRDS-data-view-label" data-bind={view}>{view}</div>
			);
		});
		return (
			<div className="NPMRDS-data-view">
				{views}
			</div>
		);
	}
})

function changeView(e) {
	var view = d3.select(e.target).attr("data-bind");
	ServerActionCreators.changeDataView(view);
}

module.exports = DataView;