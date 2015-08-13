var React = require('react'),
    d3 = require("d3"),

    ViewActionsCreator = require("../../actions/ViewActionsCreator"),

    RouteStore = require("../../stores/RouteStore"),
    GeoStore = require("../../stores/GeoStore"),
    UserStore = require("../../stores/UserStore"),
    TMCDataStore = require("../../stores/TMCDataStore"),

    SailsWebApi = require("../../utils/api/SailsWebApi"),

    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes,
    ActionTypes = Constants.ActionTypes;

var RoutePanel = React.createClass({
    getInitialState: function() {
        return {
            savedRoutes: []
        }
    },
    componentDidMount: function() {
        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);

        UserStore.addChangeListener(this.getSavedRoutes);

        var owner = UserStore.getSessionUser().id,
            mpo = UserStore.getPreferences().mpo_name || null;

        if (mpo) {
            SailsWebApi.getSavedRoutes(owner, mpo);
        }
    },
    componentWillUnmount: function() {
        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);

        UserStore.removeChangeListener(this.getSavedRoutes);
    },

    getSavedRoutes: function(event) {
        if (event == Events.RECEIVED_USER_PREFERENCES) {
            var owner = UserStore.getSessionUser().id,
                mpo = UserStore.getPreferences().mpo_name || "not_set";
            // retrieve new list of roads to populate dropdown;
            SailsWebApi.getSavedRoutes(owner, mpo);
        }
    },

    displaySavedRoutes: function(routes) {
        var state = this.state;
        state.savedRoutes = routes;
        this.setState(state);
    },

    loadRoute: function(data) {
        var name = d3.select("#savedRoutes").property("value").trim(),
            route = this.state.savedRoutes.reduce(function(a,c) { return c.name == name ? c : a; }, {});

        SailsWebApi.loadRoute(route);
        RouteStore.activeRoute(route);
    },

    render: function() {
        var options = this.state.savedRoutes.map(function(route, i) {
            return (<option key={i} >{route.name}</option>);
        });
        var routeTypes = ["choose a route type", "personal", "MPO route"].map(function(type, i) {
            return (<option key={i} >{type}</option>);
        });
    	return (
          	<section className="widget">
                <header>
                    <h4>Route Control</h4>
                    <p>Load saved routes</p>
                </header>
	            <div className="body">
                    <div className="form-group">
                        <label htmlFor="savedRoutes">Saved Routes</label>
                        <select id="savedRoutes" className="form-control" onChange={this.loadRoute}>
                             <option >{ this.state.savedRoutes.length ? "choose a route..." : "no saved routes" }</option>
                            {options}
                        </select>
                    </div>
	            </div>
            </section>
    	)
    }
})

module.exports = RoutePanel;

function checkRoute() {
	var	route = RouteStore.getRoute();

	if (!route.features || !route.features.length) {
		return false;
	}
	return true;
}

// <div className="form-group">
//     <label htmlFor="routeType">Route Type</label>
//     <select id="routeType" className="form-control" >
//         {routeTypes}
//     </select>
// </div>
