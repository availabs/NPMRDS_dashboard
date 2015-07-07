var React = require('react'),
    d3 = require("d3"),

    ViewActionsCreator = require("../../actions/ViewActionsCreator"),

    RouteStore = require("../../stores/RouteStore"),
    GeoStore = require("../../stores/GeoStore"),
    UserStore = require("../../stores/UserStore"),

    SailsWebApi = require("../../utils/api/SailsWebApi"),

    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes;

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

        RouteStore.addChangeListener(Events.ROUTE_SAVED, this.routeSaved);
        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);

        var owner = UserStore.getSessionUser().id;
        SailsWebApi.getSavedRoutes(owner);
    },
    componentWillUnmount: function() {
        SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_START, this._onDataLoadingStart);
        SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_STOP, this._onDataLoadingStop);
        
        RouteStore.removeChangeListener(Events.ROUTE_SAVED, this.routeSaved);
        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);
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
        routes = ["select a route..."].concat(routes.map(function(d) { return d.name; }));

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
console.log("RouteControl, saving route:",name);

        var data = {
            owner: UserStore.getSessionUser().id,
            name: name,
            points:  RouteStore.getRouteData().points
        }
        SailsWebApi.saveRoute(data);
	},
    routeSaved: function() {
console.log("route saved!!!");
        var owner = UserStore.getSessionUser().id;
        SailsWebApi.getSavedRoutes(owner);
    },
    loadRoute: function(data) {
        var name = d3.select("#savedRoutes").property("value").trim(),
            currentRouteName = d3.select("#routeName").property("value").trim();

        if (name == this.state.savedRoutes[0]) {// || name == currentRouteName) {
            // d3.select("#savedRoutes").property("selectedIndex", 0);
            return;
        }

        var data = {
            owner: UserStore.getSessionUser().id,
            name: name
        }
        SailsWebApi.loadRoute(data);

        d3.select("#routeName").property("value", name);
        d3.select("#savedRoutes").property("selectedIndex", 0);
    },

    render: function() {
        var options = this.state.savedRoutes.map(function(route, i) {
            return (<option key={i} >{route}</option>);
        });
        var routeType = ["choose a route type", "personal", "MPO route"];
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
                        <label htmlFor="routeType">Route Name</label>
                        <select id="routeType" className="form-control" onChange={}>
                            {routeTypes}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="savedRoutes">Saved Routes</label>
                        <select id="savedRoutes" className="form-control" onChange={this.loadRoute}>
                            {options}
                        </select>
                    </div>
	                <div className="form-group">
	                    <div className="form-group">
	                        <div className="NPMRDS-submit NPMRDS-label" onClick={this.saveRoute}>Save Route</div>
	                    </div>
	                </div>
	                <div className="form-group">
	                    <div className="form-group">
	                        <div id="NPMRDS-RP-submit" className="NPMRDS-submit NPMRDS-label" onClick={getIntersects}>Load Data</div>
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

function getIntersects() {
	if (!checkRoute()) {
		alert("You must create a route with at least 2 points.");
		return;
	}
	RouteStore.getIntersects(GeoStore.getRoads());
}