'use strict';
var React = require('react'),

    //-utils
    d3 = require("d3"),

    //--Flux
    SailsWebApi = require("../utils/api/SailsWebApi"),
    Events = require('../constants/AppConstants').EventTypes,

    //--Components
    LeafletMap = require("../components/utils/LeafletMap.react"),

    RouteCreationControl = require("../components/routecreation/RouteCreationControl.react"),

    // stores
    GeoStore = require("../stores/GeoStore"),
    UsageDataStore = require("../stores/UsageDataStore"),
    TMCDataStore = require("../stores/TMCDataStore"),
    RouteStore = require("../stores/RouteStore"),

    Popup = require("../components/utils/NPMRDSpopup"),

    ViewActionsCreator = require("../actions/ViewActionsCreator"),

    Input = require("../utils/Input");

var UNIQUE_MARKER_IDs = 0;

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
                },
                roads:{
                    id:0,
                    geo:{type:'FeatureCollection',features:[]},
                    options:{
                        zoomOnLoad:true,
                        style:function (feature) {
                            return {
                                className: 'roads id-'+feature.properties.linkID+' tmc-'+feature.properties.tmc,
                                stroke:true,
                                color: "#000"//linkShader(feature)
                            }
                        },
                         onEachFeature: function (feature, layer) {

                            layer.on({

                                click: function(e){
                                  if (feature.properties.tmc) {
                                    TMCDataStore.addTMC(feature.properties.tmc);
                                  }
                                },
                                mouseover: function(e){
                                    mapView.state.popup(feature);
                                },
                                mouseout: function(e){
                                    mapView.state.popup.display(false);
                                }
                            });

                        }
                    }
                },
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

        GeoStore.addChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
        GeoStore.addChangeListener(Events.STATE_CHANGE, this._onStateChange);

        RouteStore.addChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);
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
        GeoStore.removeChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
        GeoStore.removeChangeListener(Events.STATE_CHANGE, this._onStateChange);

        RouteStore.removeChangeListener(Events.ROUTE_CREATED, this._onRouteCreated);
        RouteStore.removeChangeListener(Events.ROUTE_LOADED, this._onRouteLoaded);

        this.state.input.close();
    },

    _onStateChange: function() {
        var newState = this.state;

        newState.layers.county.id++;
        newState.layers.county.geo = GeoStore.getState(36);

        this.setState(newState);
    },

    _onCountyChange: function() {
        var newState = this.state;

        newState.layers.roads.id++;
        newState.layers.roads.geo.features = GeoStore.getLoadedRoads();
        newState.layers.roads.options.zoomOnLoad = true;

        this.setState(newState);

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
                        <RouteCreationControl />
                    </div>
                    <div className="col-lg-10" id="NPMRDS-map-div">
                        <LeafletMap height="85%" layers={this.state.layers} markers={this.state.markers} />
                    </div>
                </div>
            </div>
        );
    }

});

module.exports = RouteCreation;
