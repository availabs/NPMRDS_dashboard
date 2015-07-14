'use strict';

var React = require('react'),

    //--Components
    ToolTip = require('./ToolTip.react'),

    //--Utils
    L = require('leaflet'),
    d3 = require('d3'),
    colorbrewer = require('colorbrewer'),
    topojson = require('topojson');

L.Icon.Default.imagePath = '/images';

var map = null,
    layers = {};

var mapMarkers = {};

var Map = React.createClass({

    getDefaultProps:function(){
        return {
            height : '500px',
            ToolTip : {display:'none'},
            layerrs :{}
        }
    },

    componentDidMount: function() {
        this.renderMap();
    },

    componentWillReceiveProps: function(nextProps) {
        var scope = this;
        if(nextProps.layers){

            Object.keys(nextProps.layers).forEach(function(key){
                var currLayer = nextProps.layers[key];
                if(layers[key]){
                    //if layer existed previously check version ids
                    if(currLayer.id !== layers[key].id) {// && currLayer.geo.features.length > 0){
                        scope._updateLayer(key,currLayer)
                    }
                }else if(currLayer.geo.features.length > 0){
                    //layer is new and has features
                    scope._updateLayer(key,currLayer)
                }else{
                    console.log('MAP/recieve props/ DEAD END')
                }
            });
        }
        if (nextProps.markers) {
            var activeMarkers = {};
            nextProps.markers.forEach(function(data, i) {
                activeMarkers[data.id] = true;

                if (!(data.id in mapMarkers)) {
                    var options = data.options || {},
                        marker = new L.Marker(data.latlng, options);
                        if (data.events) {
                            for (var key in data.events) {
                                marker.on(key, data.events[key]);
                            }
                        }
                        mapMarkers[data.id] = marker;
                        map.addLayer(marker);
                }
            })

            for (var id in mapMarkers) {
                if (!activeMarkers[id]) {
                    map.removeLayer(mapMarkers[id]);
                    delete mapMarkers[id];
                }
            }
        }
    },

    _updateLayer : function(key,layer){
        if(map.hasLayer(layers[key].layer)){
            map.removeLayer(layers[key].layer)
        }
        layers[key] = {id:layer.id};
        if (!layer.geo.features.length) {
            return;
        }
        layers[key].layer = new L.geoJson(layer.geo,layer.options);

        map.addLayer(layers[key].layer);
        if(layer.options.zoomOnLoad && layer.geo.features.length > 0){
            var ezBounds = d3.geo.bounds(layer.geo);
            map.fitBounds([ezBounds[0].reverse(),ezBounds[1].reverse()]);
        }
    },

    _updateMarker: function(marker) {

    },

    render: function() {
        return (
            <div className="map" id="map">
                <ToolTip config={this.props.ToolTip}/>
            </div>

        );
    },

    renderMap:function(){
        var scope = this,
            mapDiv = document.getElementById('map'),
            height = this.props.height,
            regex = /\d+%$/;
        if (regex.test(height)) {
            this.props.height = Math.max((parseInt(height)*(0.01)*(window.innerHeight)), 500)+"px";
        }
        mapDiv.setAttribute("style","height:"+this.props.height);
        var key = 'erickrans.4f9126ad',//am3081.kml65fk1,
            mapquestOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/"+key+"/{z}/{x}/{y}.png");

        map = L.map("map", {
          center: this.props.center || [39.8282, -98.5795],
          zoom: 4,
          layers: [mapquestOSM],//[mapquestOSM],
          zoomControl: true,
          attributionControl:false
        });

// add event listener to map object
        if (this.props.onMapEvent) {
            for (var key in this.props.onMapEvent) {
                map.on(key, this.props.onMapEvent[key]);
            }
        }

        if(this.props.layers){
            Object.keys(this.props.layers).forEach(function(key){

                var currLayer = scope.props.layers[key];
                layers[key] =  {
                    id:currLayer.id,
                    layer: L.geoJson(currLayer.geo,currLayer.options)
                };
                map.addLayer(layers[key].layer);
                if(currLayer.options.zoomOnLoad && currLayer.geo.features.length > 0){
                    var ezBounds = d3.geo.bounds(currLayer.geo);
                    map.fitBounds([ezBounds[0].reverse(),ezBounds[1].reverse()]);
                }

            });
        }

    }
});


module.exports = Map;
