'use strict';
var React = require('react'),

    //-utils
    d3 = require("d3"),

    //--Flux
    SailsWebApi = require("../../utils/api/SailsWebApi"),
    Events = require('../../constants/AppConstants').EventTypes,

    //--Components
    LeafletMap = require("../../components/utils/LeafletMap.react"),

    //RouteControl = require("../mapView/RouteControl.react"),
    RouteMapSidebar = require("./RouteMapSidebar.react"),

    GeoStore = require("../../stores/GeoStore"),
    TMCDataStore = require("../../stores/TMCDataStore"),
    RouteStore = require("../../stores/RouteStore"),
    UsageDataStore = require("../../stores/UsageDataStore"),
    UserStore = require("../../stores/UserStore"),

    ViewActionsCreator = require("../../actions/ViewActionsCreator"),

    LoadingIndicator = require("../mapView/LoadingIndicator.react"),

    Input = require("../../utils/Input"),

    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes,
    ActionTypes = Constants.ActionTypes;

var linkShader = UsageDataStore.linkShader(),
    roadPaths = null,
    UNIQUE_MARKER_IDs = 0;

var RouteMap = React.createClass({
    getInitialState: function(){
        var mapView = this;
        return {
            input: Input(),
            markers: [],
            route: {},
            userPrefs: UserStore.getPreferences(),
            layers:{
                mpo:{
                    id:0,
                    geo: {type:'FeatureCollection',features:[]},
                    options:{
                        zoomOnLoad:true,
                        style:function (feature) {
                            return {
                                className: 'county',
                                fillColor:'#009',
                                color: "#004",
                                weight: 1,
                                fillOpacity:0,
                                stroke:true
                            }
                        },
                        onEachFeature: function (feature, layer) {

                            layer.on({
                                // click: function(e){
                                //     if (mapView.state.input.keyDown("ctrl")) {
                                //         mapView.addRoutePoint(e.latlng.lat, e.latlng.lng);
                                //     }
                                // },
                                mouseover: function(e){
                                    this.setStyle({
                                        weight:3,
                                        color:'#400'
                                    });
                                },
                                mouseout: function(e){
                                      this.setStyle({
                                        weight:1,
                                        color:'#004'
                                    });

                                }
                            });

                        }
                    }
                },
                route:{
                    id:0,
                    geo:{type:'FeatureCollection',features:[]},
                    options:{
                        zoomOnLoad:true,
                        style:function (feature) {
                            return {
                                className: 'roads id-'+feature.properties.linkID+' tmc-'+feature.properties.tmc,
                                stroke:true,
                                color: linkShader(feature)
                            }
                        },
                         onEachFeature: function (feature, layer) {

                            layer.on({

                                // click: function(e){
                                //   if (feature.properties.tmc) {
                                //     TMCDataStore.addTMC(feature.properties.tmc);
                                //   }
                                // }
                            });

                        }
                    }
                }
            }
        }
    },

    componentDidMount: function() {
        // GeoStore.addChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
        // GeoStore.addChangeListener(Events.STATE_CHANGE, this._onStateChange);
        //
        // UsageDataStore.addChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);
        //
        // TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
        // TMCDataStore.addChangeListener(Events.REMOVE_TMC_DATA, this._onRemoveTMCdata);
        //
        RouteStore.addChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);
        RouteStore.addChangeListener(Events.INTERSECTS_CREATED, this._onIntersectsCreated);
        RouteStore.addChangeListener(Events.ROUTE_LOADED, this._onRouteLoaded);
        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this.receivedSavedRoutes);

        var routes = RouteStore.getSavedRoutes();
console.log("<RouteMap::componentDidMount> routes", routes);
        if (routes.length) {
            this.receivedSavedRoutes(routes);
        }

        this.state.input
            .init()
            .on("keyup", function(key) {
                if (key == "ctrl") {
                    RouteStore.calcRoute();
                }
            })
    },

    componentWillUnmount: function() {
        // GeoStore.removeChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
        // GeoStore.removeChangeListener(Events.STATE_CHANGE, this._onStateChange);
        //
        // UsageDataStore.removeChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);
        //
        // TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
        // TMCDataStore.removeChangeListener(Events.REMOVE_TMC_DATA, this._onRemoveTMCdata);
        //
        RouteStore.removeChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);
        RouteStore.removeChangeListener(Events.INTERSECTS_CREATED, this._onIntersectsCreated);
        RouteStore.removeChangeListener(Events.ROUTE_LOADED, this._onRouteLoaded);
        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this.receivedSavedRoutes);

        this.state.input.close();
    },

    receivedSavedRoutes: function(routes) {
        var routeId = this.props.routeId,

            route = routes.filter(function(route) { return route.id == routeId; }).pop();

        this._onRouteLoaded(route.points, route);
    },

    _onRouteLoaded: function(points, route) {
        var mapView = this,
            state = this.state;

        RouteStore.clearPoints();

        var markerData = points.map(function(point) {
                var markerID = UNIQUE_MARKER_IDs++;
                RouteStore.addPoint(markerID, point);
                return {
                    id: markerID,
                    latlng: point,
                    options: { draggable: false },
                    // events: {
                    //     dragend: function(e) {
                    //         RouteStore.addPoint(markerID, [e.target._latlng.lat, e.target._latlng.lng]);
                    //         RouteStore.calcRoute();
                    //     },
                    //     click: function(e) {
                    //         if (mapView.state.input.keyDown("ctrl")) {
                    //             mapView.state.markers = mapView.state.markers.filter(function(d) { return d.id != markerID; });
                    //             RouteStore.addPoint(markerID, []);
                    //             RouteStore.calcRoute();
                    //         }
                    //     }
                    // }
                };
            });
        markerData = markerData.slice(0,1);

        state.route = route;

        state.markers = markerData;
        RouteStore.calcRoute();
        this.setState(state);
    },

    addRoutePoint: function(lat, lng) {
        var mapView = this,
            state = this.state,
            markerID = UNIQUE_MARKER_IDs++,
            markerData = {
                id: markerID,
                latlng: [lat, lng],
                options: { draggable: true },
                events: {
                    dragend: function(e) {
                        RouteStore.addPoint(markerID, [e.target._latlng.lat, e.target._latlng.lng]);
                        RouteStore.calcRoute();
                    },
                    click: function(e) {
                        if (mapView.state.input.keyDown("ctrl")) {
                            mapView.state.markers = mapView.state.markers.filter(function(d) { return d.id != markerID; });
                            RouteStore.addPoint(markerID, []);
                            RouteStore.calcRoute();
                        }
                    }
                }
            };
        RouteStore.addPoint(markerID, [lat, lng]);

        state.markers.push(markerData);
        this.setState(state);
    },

    _onRouteCreated: function(route) {
        var newState = this.state;

        newState.layers.route.id++;
        newState.layers.route.geo = route;

        this.setState(newState);
    },

    _onIntersectsCreated: function(intersects) {
        var newState = this.state;

        newState.layers.intersects.id++;
        newState.layers.intersects.geo.features = intersects;

        this.setState(newState);
    },

    render: function() {
        console.log("<RouteMap::render>", this.state.route);
        return (
            <div className="row">
                <LoadingIndicator />

                <div className="col-lg-8" id="route-map-div">
                    <LeafletMap height="85%" layers={this.state.layers} markers={this.state.markers} />
                </div>
                <div className="col-lg-4">
                    <div className="widget">
                        <RouteMapSidebar TMCcodes={ this.state.route.tmc_codes || [] } />
                    </div>
	    		</div>
            </div>
        );
    }

});
module.exports = RouteMap;
