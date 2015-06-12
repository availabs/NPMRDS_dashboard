var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/AppConstants');

var ActionTypes = Constants.ActionTypes;

module.exports = {
	setControlPanelParams: function(params) {
console.log("ViewActionCreator: params", params)
	    AppDispatcher.handleViewAction({
	    	type: ActionTypes.CONTROL_PANEL_PARAMS_LOADED,
	      	params: params
	    });
	}
}