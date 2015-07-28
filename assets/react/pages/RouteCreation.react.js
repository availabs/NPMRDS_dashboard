'use strict';
var React = require('react'),

    //-utils
    d3 = require("d3"),

    //--Flux
    SailsWebApi = require("../utils/api/SailsWebApi"),
    Events = require('../constants/AppConstants').EventTypes,

    //--Components
    LeafletMap = require("../components/utils/LeafletMap.react"),


    ControlPanel = require("../components/mapView/ControlPanel.react"),
    RouteControl = require("../components/mapView/RouteControl.react"),
    DataPointSlider = require("../components/mapView/DataPointSlider.react"),

    NPMRDSLegend = require("../components/mapView/NPMRDSLegend.react"),
    DataView = require("../components/mapView/NPMRDSDataView.react"),

    // NPMRDSTabPanel = require("../components/mapView/NPMRDSTabPanel.react"),
    // NPMRDSTabSelector = require("../components/mapView/NPMRDSTabSelector.react"),

    // stores
    GeoStore = require("../stores/GeoStore"),
    UsageDataStore = require("../stores/UsageDataStore"),
    TMCDataStore = require("../stores/TMCDataStore"),
    RouteStore = require("../stores/RouteStore"),

    Popup = require("../components/utils/NPMRDSpopup"),

    ViewActionsCreator = require("../actions/ViewActionsCreator"),

    // mapView components
    TMCsOverTime = require("../components/mapView/TMCsOverTime_Graph.react"),
    TMCsAllTime = require("../components/mapView/TMCsAllTime_Chart.react"),
    TMCMonthly = require("../components/mapView/TMCMonthly_Graph.react"),

    TMCMonthly_Aggregated = require("../components/mapView/TMCMonthly_Aggregated_Graph.react"),

    Input = require("../utils/Input");

var linkShader = UsageDataStore.linkShader(),
    roadPaths = null,
    UNIQUE_MARKER_IDs = 0;

var RouteCreation = React.createClass({
    getInitialState: function(){
        var mapView = this;
        return {
            input: Input(),
            popup: Popup(),
            markers: [],
            layers:{
                county:{
                    id:0,
                    geo:GeoStore.getState(36),
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
                                click: function(e){
                                    if (mapView.state.input.keyDown("ctrl")) {
                                        mapView.addRoutePoint(e.latlng.lat, e.latlng.lng);
                                    }
                                    else {
                                        GeoStore.toggleCounty(feature.id);
                                    }
                                },
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
                }
                route: {
                    id: 0,
                    geo: { type: "FeatureCollection", features: [] },
                    options: {
                        zoomOnLoad:true,
                        style: function(feature) {
                            return {
                                stroke:true,
                                color: "#009"
                            }
                        }
                    }
                }
            }
        }
    },

    componentDidMount: function() {
        RouteStore.clearPoints();

        RouteStore.addChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);
        RouteStore.addChangeListener(Events.INTERSECTS_CREATED, this._onIntersectsCreated);
        RouteStore.addChangeListener(Events.ROUTE_LOADED, this._onRouteLoaded);

        this.state.popup.init(d3.select("#NPMRDS-map-div"));

        this.state.input
            .init()
            .on("keyup", function(key) {
                if (key == "ctrl") {
                    RouteStore.calcRoute();
                }
            })
    },

    componentWillUnmount: function() {

        RouteStore.removeChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);
        RouteStore.removeChangeListener(Events.INTERSECTS_CREATED, this._onIntersectsCreated);
        RouteStore.removeChangeListener(Events.ROUTE_LOADED, this._onRouteLoaded);

        this.state.input.close();
    },

    _onStateChange: function() {
        console.log("STATE_CHANGE");
        var newState = this.state;

        newState.layers.county.id++;
        newState.layers.county.geo = GeoStore.getState(36);

        this.setState(newState);
    },

    _onCountyChange: function() {
        console.log("COUNTY_CHANGE");
        var newState = this.state;

        newState.layers.roads.id++;
        newState.layers.roads.geo.features = GeoStore.getLoadedRoads();
        newState.layers.roads.options.zoomOnLoad = true;

        this.setState(newState);

        roadPaths = null;

        if (!newState.layers.roads.geo.features.length) {
            this._onStateChange();
        }
    },

    _onRouteLoaded: function(points) {
        var mapView = this,
            state = this.state;

        RouteStore.clearPoints();

        var markerData = points.map(function(point) {
                var markerID = UNIQUE_MARKER_IDs++;
                RouteStore.addPoint(markerID, point);
                return {
                    id: markerID,
                    latlng: point,
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
            });

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

    render: function() {
        return (
            <div className="content container">
                <div className="row">

                    <div className="col-lg-2">
                        <section>
                            <header>
                                <ul className="nav nav-tabs">
                                    <li className="active">
                                        <a href="#control-panel" data-toggle="tab" aria-expanded="true">
                                            Main
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#route-panel" data-toggle="tab" aria-expanded="false">
                                            Routes
                                        </a>
                                    </li>
                                </ul>
                            </header>
                            <div className="body tab-content">
                                <div id="control-panel" className="tab-pane clearfix active">
                                    <ControlPanel />
                                </div>
                                <div id="route-panel" className="tab-pane">
                                    <RouteControl />
                                </div>
                            </div>
                        </section>
                    </div>
                    <div className="col-lg-10" id="NPMRDS-map-div">
                        <LeafletMap height="85%" layers={this.state.layers} markers={this.state.markers} />
                        <DataView />
                        <NPMRDSLegend />
                    </div>
                </div>

                <div className="row">
                    <div className="col-log-10">
                        <DataPointSlider />
                    </div>
                </div>

                <div vlassName="row">
                    <TMCMonthly_Aggregated/>
                </div>

                <div className="row">
                    <TMCMonthly/>
                </div>

                <div className="row">
                    <TMCsAllTime/>
                </div>

                <div className="row">
                    <TMCsOverTime/>
                </div>
            </div>
        );
    }

});

module.exports = RouteCreation;
