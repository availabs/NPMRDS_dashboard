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

var METER_TO_MILE = 0.000621371;

var RouteMapper = React.createClass({
    mixins: [ Router.State ],

    getInitialState: function() {
        var savedRoutes = RouteStore.getSavedRoutes(),
            routeData = {};
        if (savedRoutes.length) {
            var routeId = this.getParams().id,
                route = savedRoutes.reduce(function(a, c) { return c.id == routeId ? c : a; }, {});
            routeData.name = route.name;
        }
    	return {
            sessionUser: UserStore.getSessionUser(),
            preferences: UserStore.getPreferences(),
            savedRoutes: savedRoutes,
            loadedRoute: {},
            routeData: routeData
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
        var routes = RouteStore.getSavedRoutes(),
            routeId = this.getParams().id,
            route = routes.reduce(function(a, c) { return c.id == routeId ? c : a; }, {});

        this.loadRouteCollection(routes);

        var data = this.state.routeData;
        data.name = route.name;

        this.setState({
            sessionUser: this.state.sessionUser,
            preferences:  this.state.preferences,
            savedRoutes: routes,
            loadedRoute: this.state.loadedRoute,
            routeData: data
        })
    },

    _onRouteCreated: function() {
        var collection = RouteStore.getRoute(),
            length = 0,
            num = 0,
            speed = 0;
        collection.features.forEach(function(feature) {
            length += feature.properties.length;
            num += feature.properties.speedLimit ? 1 : 0;
            speed += feature.properties.speedLimit || 30;
        })
        length *= METER_TO_MILE;
        length = Math.round(length*10)/10;
        speed /= num;
        speed = Math.round(speed * 3600 * METER_TO_MILE);
        var routeData = this.state.routeData;
        routeData.speed = speed;
        routeData.length = length;
        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: this.state.preferences,
            savedRoutes: this.state.savedRoutes,
            loadedRoute: collection,
            routeData: this.state.routeData
        })
    },

    _getPreferences: function(event) {
        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: UserStore.getPreferences(),
            savedRoutes: this.state.savedRoutes,
            loadedRoute: this.state.loadedRoute,
            routeData: this.state.routeData
        })
    },

    render: function() {
        var routeId = this.getParams().id,
            route = this.state.savedRoutes.reduce(function(a, c) { return c.id == routeId ? c : a; }, {});

        var data = this.state.routeData,
            heading = makeHeading(data);

    	return (
            <div className="content container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="widget">
    		    			<h4>{ data.name }</h4>
                            { heading }
                        </div>
		    		</div>
		    	</div>
                <RouteMap route={ route } data={ data } routeCollection={ this.state.loadedRoute }/>
		    </div>
    	)
    }
})

function makeHeading(data) {
    var heading = [];
    if (data.length) {
        heading.push(<h4 key="length">Length: { data.length } miles.</h4>);
    }
    if (data.speed) {
        heading.push(<h4 key="speed">Average speed limit: { data.speed } mph.</h4>);
    }
    return heading;
}

module.exports = RouteMapper;
