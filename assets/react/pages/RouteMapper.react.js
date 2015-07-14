'use strict';

var React = require('react'),
    Router = require("react-router"),

    Events = require('../constants/AppConstants').EventTypes,

	MPO_LandingPage = require("../components/landing/MPO_LandingPage.react"),
    State_LandingPage = require("../components/landing/State_LandingPage.react"),
    UserPreferences = require("../components/landing/UserPreferences.react"),

    UserStore = require("../stores/UserStore"),
    RouteStore = require("../stores/RouteStore"),

    RouteMap = require("../components/landing/RouteMap.react");

var RouteMapper = React.createClass({
    mixins: [ Router.State ],

    getInitialState: function() {
    	return {
            sessionUser: UserStore.getSessionUser(),
            preferences: UserStore.getPreferences(),
            savedRoutes: RouteStore.getSavedRoutes(),
            loadedRoute: {}
        };
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this._getPreferences);
        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this._receiveSavedRoutes);
        RouteStore.addChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);

        if (this.state.savedRoutes.length) {
            this.loadRouteCollection(this.state.savedRoutes);
        }
    },
    loadRouteCollection(routes) {
        routes = routes || RouteStore.getSavedRoutes();

        RouteStore.clearPoints();

        var routeId = this.getParams().id,
            route = routes.reduce(function(a, c) {
                return c.id == routeId ? c : a;
            }, {});

        route.points.forEach(function(d, i) {
            RouteStore.addPoint(i, d);
        })

        RouteStore.calcRoute();
    },
    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._getPreferences);
        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this._receiveSavedRoutes);
        RouteStore.removeChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);
    },

    _receiveSavedRoutes: function() {
        this.loadRouteCollection();
        this.setState({
            sessionUser: this.state.sessionUser,
            preferences:  this.state.preferences,
            savedRoutes: RouteStore.getSavedRoutes(),
            loadedRoute: this.state.loadedRoute
        })
    },

    _onRouteCreated: function() {
        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: this.state.preferences,
            savedRoutes: this.state.savedRoutes,
            loadedRoute: RouteStore.getRoute()
        })
    },

    _getPreferences: function(event) {
        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: UserStore.getPreferences(),
            savedRoutes: this.state.savedRoutes,
            loadedRoute: this.state.loadedRoute
        })
    },

    render: function() {
        var routeId = this.getParams().id,
            route = this.state.savedRoutes.reduce(function(a, c) { return c.id == routeId ? c : a; }, {});
    	return (
            <div className="content container">
                <RouteMap route={ route } routeCollection={ this.state.loadedRoute }/>
		    </div>
    	)
    }
})

module.exports = RouteMapper;
