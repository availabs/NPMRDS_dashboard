'use strict';

var React = require('react'),
    Router = require("react-router"),

    d3 = require("d3"),

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
            routeId = this.getParams().id,
            route = savedRoutes.reduce(function(a, c) { return c.id == routeId ? c : a; }, null);

    	return {
            sessionUser: UserStore.getSessionUser(),
            preferences: UserStore.getPreferences(),
            route: route,
            routeCollection: null,
            monthData: null
        };
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this._getPreferences);

        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this._receiveSavedRoutes);
        RouteStore.addChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);

        RouteDataStore.addChangeListener(this.getMonthlyHoursData);

        if (this.state.route) {
            this.loadRouteCollection(this.state.route);
        }
    },
    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._getPreferences);

        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this._receiveSavedRoutes);
        RouteStore.removeChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);

        RouteDataStore.removeChangeListener(this.getMonthlyHoursData);
    },

// AM HOURS [6-9)
// PM HOURS [3-6)
    getMonthlyHoursData: function() {
        var data = RouteDataStore.getMonthlyHoursData(this.state.route.id);

        if (!data.data) return;

        if (data.month == -1) {
            var monthData = data.data.reduce(function(a, c) { return c.key > a.key ? c : a; }, {key: 0});
        }
        else {
            var monthData = data.data.reduce(function(a, c) { return c.key == data.month ? c : a; });
        }

        var flow = this.state.routeCollection.length / (this.state.routeCollection.speed*0.7) * 60,

            avgMonthly = d3.sum(monthData.values, function(d) { return d.y; }) / monthData.values.length,
            congestion = avgMonthly / flow,

            monthAMData = monthData.values.filter(function(d) { return d.x >= 6 && d.x < 9; }),
            avgMonthlyAM = d3.sum(monthAMData, function(d) { return d.y; }) / monthAMData.length,
            AMcongestion = avgMonthlyAM / flow,

            monthPMData = monthData.values.filter(function(d) { return d.x >= 3 && d.x < 6; }),
            avgMonthlyPM = d3.sum(monthPMData, function(d) { return d.y; }) / monthPMData.length,
            PMcongestion = avgMonthlyPM / flow;

        var monthData = {
            avgMonthly: avgMonthly,
            congestion: congestion,
            avgMonthlyAM: avgMonthlyAM,
            AMcongestion: AMcongestion,
            avgMonthlyPM: avgMonthlyPM,
            PMcongestion: PMcongestion
        }

        this.setState({
            sessionUser: this.state.sessionUser,
            preferences:  this.state.preferences,
            routeCollection: this.state.routeCollection,
            route: this.state.route,
            monthData: monthData
        })
    },

// retrieves data from RouteDataStore after change event is emitted
    // loadMonthlyGraphData: function() {
    //     var state = this.state;
    //     state.graphData = {
    //         monthly: RouteDataStore.getMonthlyData(this.getParams().id),
    //         monthlyAM: RouteDataStore.getMonthlyAMData(this.getParams().id),
    //         monthlyPM: RouteDataStore.getMonthlyPMData(this.getParams().id)
    //     }
    // },

// this function is called to initiate HERE API route creation
    loadRouteCollection: function(route) {
        RouteStore.clearPoints();

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

        this.loadRouteCollection(route);

        this.setState({
            sessionUser: this.state.sessionUser,
            preferences:  this.state.preferences,
            routeCollection: this.state.routeCollection,
            route: route,
            monthData: this.state.monthData
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
        speed /= speedLength;
        speed = speed * 3600 * METER_TO_MILE;

        collection.length = length;
        collection.speed = speed;

        var route = this.state.route;

        for (var key in route) {
            collection[key] = route[key];
        }

        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: this.state.preferences,
            routeCollection: collection,
            route: this.state.route,
            monthData: this.state.monthData
        })
    },

    _getPreferences: function(event) {
        this.setState({
            sessionUser: this.state.sessionUser,
            preferences: UserStore.getPreferences(),
            routeCollection: this.state.routeCollection,
            route: this.state.route,
            monthData: this.state.monthData
        })
    },

    render: function() {
        var heading = makeHeading(this.state.routeCollection),
            monthData = makeMonthData(this.state.monthData);

    	return (
            <div className="content container">
                <div className="row">

                    <div className="col-lg-6">
                        <div className="row">
                            <div className="col-lg-6">
                                <div className="widget">
            		    			<h4>{ this.state.route ? this.state.route.name : "loading..." }</h4>
                                    { heading }
                                </div>
        		    		</div>
                            <div className="col-lg-6">
                                { monthData }
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-12">
                                <RouteMap routeCollection={ this.state.routeCollection }/>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
            			<RouteMapSidebar routeCollection={ this.state.routeCollection }/>
                    </div>

		    	</div>
		    </div>
    	)
    }
})

function makeHeading(data) {
    var heading = [],
        format = d3.format("0.1f")
    if (data) {
        heading.push(<p key="length">Length: { format(data.length) } miles.</p>);
        heading.push(<p key="speed">Average posted speed limit: { format(data.speed) } mph.</p>);
    }
    return heading;
}

function makeMonthData(data) {
    if (!data) return null;
    var format = d3.format("0.1f");

    return (
        <div className="widget">
            <h4>Monthly Travel Time Averages</h4>
            <p>Month average: { format(data.avgMonthly) } minutes</p>
            <p>Month congestion: { format(data.congestion )}</p>
            <p>Month AM average: { format(data.avgMonthlyAM) } minutes</p>
            <p>AM congestion: { format(data.AMcongestion) }</p>
            <p>Month PM average: { format(data.avgMonthlyPM) } minutes</p>
            <p>PM congestion: { format(data.PMcongestion) }</p>
        </div>
    )
}

module.exports = RouteMapper;
