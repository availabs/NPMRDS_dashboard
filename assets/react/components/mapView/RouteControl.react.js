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
            loading: false,
            savedRoutes: []
        }
    },
    componentDidMount: function() {
        SailsWebApi.addChangeListener(Events.SAILS_WEB_API_LOADING_START, this._onDataLoadingStart);
        SailsWebApi.addChangeListener(Events.SAILS_WEB_API_LOADING_STOP, this._onDataLoadingStop);

        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);

        UserStore.addChangeListener(this.getSavedRoutes);

        var owner = UserStore.getSessionUser().id,
            mpo = UserStore.getPreferences().mpo_name || null;

        if (mpo) {
            SailsWebApi.getSavedRoutes(owner, mpo);
        }
    },
    componentWillUnmount: function() {
        SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_START, this._onDataLoadingStart);
        SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_STOP, this._onDataLoadingStop);

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

    _onDataLoadingStart: function() {
        this.state.loading = true;
        d3.select("#NPMRDS-RP-submit").classed("NPMRDS-button-disabled", true);
    },
    _onDataLoadingStop: function() {
        this.state.loading = false;
        d3.select("#NPMRDS-RP-submit").classed("NPMRDS-button-disabled", false);
    },

    displaySavedRoutes: function(routes) {
        var state = this.state;
        state.savedRoutes = routes;
        this.setState(state);
    },

	saveRoute: function() {
		var name = d3.select("#routeName").property("value").trim();

		if (!checkRoute()) {
			alert("You must create a route with at least 2 points.");
			return;
		}

		var regex = /^[_a-zA-Z][\w ]{4,}/;
		if (!regex.test(name)) {
			alert("Please give your route a name of at least 5 characters, starting with a letter or underscore.");
			return;
		}

        var data = {
            owner: UserStore.getSessionUser().id,
            name: name,
            points:  RouteStore.getRouteData().points
        }
        SailsWebApi.saveRoute(data);
	},
    loadRoute: function(data) {
        var name = d3.select("#savedRoutes").property("value").trim();

        var route = this.state.savedRoutes.reduce(function(a,c) { return c.name == name ? c : a; }, {});
console.log(name, route, this.state.savedRoutes);
        d3.select("#routeName").property("value", name);

        SailsWebApi.loadRoute(route);
    },

    loadRouteData: function() {
		var name = d3.select("#routeName").property("value").trim();

		if (!checkRoute()) {
			alert("You must create a route with at least 2 points.");
			return;
		}
        var tmcs = this.state.savedRoutes.reduce(function(a, c) { return c.name == name ? c.tmc_codes : a; }, []);
        TMCDataStore.addTMC(tmcs);
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
                    <p>Create and save routes</p>
                </header>
	            <div className="body">
                    <div className="form-group">
                        <label htmlFor="routeName">Route Name</label>
                        <div className="input-group">
                            <input id="routeName" className='form-control' type="text" color="#000"/>
                        </div>
                    </div>
	                <div className="form-group">
	                    <div className="form-group">
	                        <div className="NPMRDS-submit NPMRDS-label" onClick={this.saveRoute}>Save Route</div>
	                    </div>
	                </div>
                    <div className="form-group">
                        <label htmlFor="savedRoutes">Saved Routes</label>
                        <select id="savedRoutes" className="form-control" onChange={this.loadRoute}>
                             <option >{ this.state.savedRoutes.length ? "choose a route..." : "no saved routes" }</option>
                            {options}
                        </select>
                    </div>
	                <div className="form-group">
	                    <div className="form-group">
	                        <div id="NPMRDS-RP-submit" className="NPMRDS-submit NPMRDS-label" onClick={this.loadRouteData}>Load Data</div>
	                    </div>
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
