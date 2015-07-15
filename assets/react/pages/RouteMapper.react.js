'use strict';

var React = require('react'),
    Router = require("react-router"),

    Events = require('../constants/AppConstants').EventTypes,

	MPO_LandingPage = require("../components/landing/MPO_LandingPage.react"),
    State_LandingPage = require("../components/landing/State_LandingPage.react"),
    UserPreferences = require("../components/landing/UserPreferences.react"),

    UserStore = require("../stores/UserStore"),
    RouteStore = require("../stores/RouteStore"),
    RouteDataStore = require("../stores/RouteDataStore"),

    RouteMap = require("../components/routemap/RouteMap.react"),
    RouteMapSidebar = require("../components/routemap/RouteMapSidebar.react");

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
            routeData: routeData,
            graphData: {
                monthly: null,
                monthlyAM: null,
                monthlyPM: null
            }
        };
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this._getPreferences);

        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this._receiveSavedRoutes);
        RouteStore.addChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);

        RouteDataStore.addChangeListener(this.loadMonthlyGraphData);

        if (this.state.savedRoutes.length) {
            this.loadRouteCollection(this.state.savedRoutes);
        }
    },
    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._getPreferences);

        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this._receiveSavedRoutes);
        RouteStore.removeChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);

        RouteDataStore.removeChangeListener(this.loadMonthlyGraphData);
    },

// retrieves data from RouteDataStore after change event is emitted
    loadMonthlyGraphData: function() {
        var state = this.state;
        state.graphData = {
            monthly: RouteDataStore.getMonthlyData(this.getParams().id),
            monthlyAM: RouteDataStore.getMonthlyAMData(this.getParams().id),
            monthlyPM: RouteDataStore.getMonthlyPMData(this.getParams().id)
        }
    },

// this function is called to initiate HERE API route creation
    loadRouteCollection: function(routes) {
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

// occurs when user's saved routes are received
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
            routeData: data,
            graphData: this.state.graphData
        })
    },

// occurs when RouteStore generates a feature collection from HERE API route data
    _onRouteCreated: function() {
        var collection = RouteStore.getRoute(),
            length = 0,
            speedLength = 0,
            speed = 0;

        collection.features.forEach(function(feature) {
            length += feature.properties.length;
            if (feature.properties.speedLimit) {
                speedLength += feature.properties.length;
                speed += feature.properties.speedLimit*feature.properties.length;
            }
        })
        length *= METER_TO_MILE;
        length = Math.round(length*10)/10;
        speed /= speedLength;
        speed = speed * 3600 * METER_TO_MILE;

        var routeData = this.state.routeData;
        routeData.speed = Math.round(speed);
        routeData.length = length;

        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: this.state.preferences,
            savedRoutes: this.state.savedRoutes,
            loadedRoute: collection,
            routeData: this.state.routeData,
            graphData: this.state.graphData
        })
    },

    _getPreferences: function(event) {
        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: UserStore.getPreferences(),
            savedRoutes: this.state.savedRoutes,
            loadedRoute: this.state.loadedRoute,
            routeData: this.state.routeData,
            graphData: this.state.graphData
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

                    <div className="col-lg-6">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="widget">
            		    			<h4>{ data.name }</h4>
                                    { heading }
                                </div>
        		    		</div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <RouteMap route={ route } routeCollection={ this.state.loadedRoute }/>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <RouteMapSidebar collection={ this.state.loadedRoute } TMCcodes={ route.tmc_codes || [] } />
                    </div>

		    	</div>
		    </div>
    	)
    }
})

function makeHeading(data) {
    var heading = [];
    if (data.length) {
        heading.push(<p key="length">Length: { data.length } miles.</p>);
    }
    if (data.speed) {
        heading.push(<p key="speed">Average speed limit: { data.speed } mph.</p>);
    }
    return heading;
}

module.exports = RouteMapper;
