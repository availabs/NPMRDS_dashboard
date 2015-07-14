'use strict';
var React = require('react'),

    //-utils
    d3 = require("d3"),

    //--Components
    LeafletMap = require("../../components/utils/LeafletMap.react"),

    //RouteControl = require("../mapView/RouteControl.react"),
    RouteMapSidebar = require("./RouteMapSidebar.react"),

    UsageDataStore = require("../../stores/UsageDataStore");

var linkShader = UsageDataStore.linkShader(),
    roadPaths = null,
    UNIQUE_MARKER_IDs = 0;

var RouteMap = React.createClass({
    getInitialState: function(){
        var mapView = this;
        return {
            markers: [],
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

    componentWillReceiveProps: function(newProps) {
        var state = this.state;

        if (newProps.routeCollection.features) {
            state.layers.route.id++;
            state.layers.route.geo = newProps.routeCollection;
        }

        if (newProps.route.points) {
            var markerData = [{
                    id: "route-start",
                    latlng: newProps.route.points[0],
                    options: { draggable: false },
                }]

            state.markers = markerData;
        }

        this.setState(state);
    },

    render: function() {
        return (
            <div className="row">
                <div className="col-lg-8" id="route-map-div">
                    <LeafletMap height="75%" layers={ this.state.layers } markers={ this.state.markers } />
                </div>
                <div className="col-lg-4">
                    <RouteMapSidebar data={ this.props.data } collection={ this.props.routeCollection } TMCcodes={ this.props.route.tmc_codes || [] } />
	    		</div>
            </div>
        );
    }

});
module.exports = RouteMap;
