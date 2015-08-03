var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {
	setControlPanelParams: function(params) {
	    AppDispatcher.handleViewAction({
	    	type: ActionTypes.CONTROL_PANEL_PARAMS_LOADED,
	      	params: params
	    });
	},

	monthlyHoursDataLoaded: function(id, data) {
		rawData.flow = flow;
	    AppDispatcher.handleViewAction({
	    	type: ActionTypes.MONTHLY_HOURS_DATA_LOADED,
			id: id,
	      	data: data
	    });
	},

	routeDataMonthChange: function(month) {
	    AppDispatcher.handleViewAction({
	    	type: ActionTypes.ROUTE_DATA_MONTH_CHANGE,
			month: month
	    });
	}
}
