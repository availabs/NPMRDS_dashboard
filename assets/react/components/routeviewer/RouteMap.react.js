'use strict';
var React = require('react'),

    d3 = require("d3"),

    LeafletMap = require("../../components/utils/LeafletMap.react"),

    RouteMapSidebar = require("./RouteMapSidebar.react");

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
                        // onEachFeature: function (feature, layer) {

                        //     layer.on({
                        //         click: function(e){
                        //             if (mapView.state.input.keyDown("ctrl")) {
                        //                 mapView.addRoutePoint(e.latlng.lat, e.latlng.lng);
                        //             }
                        //         },
                        //         mouseover: function(e){
                        //             this.setStyle({
                        //                 weight:3,
                        //                 color:'#400'
                        //             });
                        //         },
                        //         mouseout: function(e){
                        //               this.setStyle({
                        //                 weight:1,
                        //                 color:'#004'
                        //             });

                        //         }
                        //     });

                        // }
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
                                color: "#000"
                            }
                        },
                         // onEachFeature: function (feature, layer) {

                         //    layer.on({

                         //        click: function(e){
                         //          if (feature.properties.tmc) {
                         //            TMCDataStore.addTMC(feature.properties.tmc);
                         //          }
                         //        }
                         //    });

                        // }
                    }
                }
            }
        }
    },

    componentWillReceiveProps: function(newProps) {
        var state = this.state;

        if (newProps.routeCollection) {
            state.layers.route.id++;
            state.layers.route.geo = newProps.routeCollection;

            var markerData = [{
                    id: newProps.routeCollection.name,
                    latlng: newProps.routeCollection.points[0],
                    options: { draggable: false },
                }]
            state.markers = markerData;
        }

        this.setState(state);
    },

    render: function() {
        return (
            <LeafletMap height="70%" layers={ this.state.layers } markers={ this.state.markers } />
        );
    }

});
module.exports = RouteMap;
