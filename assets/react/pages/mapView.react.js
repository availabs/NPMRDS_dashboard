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
    DataPointSlider = require("../components/mapView/DataPointSlider.react"),

    NPMRDSLegend = require("../components/mapView/NPMRDSLegend.react"),
    DataView = require("../components/mapView/NPMRDSDataView.react"),

    // NPMRDSTabPanel = require("../components/mapView/NPMRDSTabPanel.react"),
    // NPMRDSTabSelector = require("../components/mapView/NPMRDSTabSelector.react"),

    NPMRDSTMCPanel = require("../components/mapView/NPMRDS_TMC_Panel.react"),
    
    // stores
    GeoStore = require("../stores/GeoStore"),
    UsageDataStore = require("../stores/UsageDataStore"),
    TMCDataStore = require("../stores/TMCDataStore"),

    Popup = require("../components/utils/NPMRDSpopup");

var linkShader = UsageDataStore.linkShader(),
    roadPaths = null;

var MapView = React.createClass({
  
    getInitialState: function(){
        var mapView = this;
        return {
            popup: Popup(),
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
                                    GeoStore.toggleCounty(feature.id)
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
                                color: linkShader(feature)
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
                }
            }
        }
    },

    componentDidMount: function() {  //  Events.USAGE_DATA_PROCESSED
        GeoStore.addChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
        GeoStore.addChangeListener(Events.STATE_CHANGE, this._onStateChange);
        UsageDataStore.addChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);
              
        TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
        TMCDataStore.addChangeListener(Events.REMOVE_TMC_DATA, this._onRemoveTMCdata);

        this.state.popup.init(d3.select("#NPMRDS-map-div"));
    },

    componentWillUnmount: function() {
        GeoStore.removeChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
        GeoStore.removeChangeListener(Events.STATE_CHANGE, this._onStateChange);
          
        UsageDataStore.removeChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);  
         
        TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
        TMCDataStore.removeChangeListener(Events.REMOVE_TMC_DATA, this._onRemoveTMCdata);
    },

    _onDisplayTMCdata: function(data) {
console.log("DisplayTMCdata", data.tmc)
    },

    _onRemoveTMCdata: function(data) {
console.log("RemoveTMCdata", data.tmc)
    },

    _onCountyChange: function() {
        //console.log("COUNTY_CHANGE");
        var newState = this.state;

        newState.layers.roads.id++;
        newState.layers.roads.geo.features = GeoStore.getLoadedRoads();
        newState.layers.roads.options.zoomOnLoad = true;

        this.setState(newState);

        roadPaths = null;
    },

     _onDataPointSliderUpdate: function() {
        //console.log("DATA_POINT_SLIDER_UPDATE");

        if (!roadPaths) {
            var newState = this.state;

            newState.layers.roads.id++;
            newState.layers.roads.geo.features = GeoStore.getLoadedRoads();
            newState.layers.roads.options.zoomOnLoad = false;

            this.setState(newState);
              
            roadPaths = d3.selectAll(".roads")
            .datum(function() {
              var path = d3.select(this),
                  match = path.attr("class").match(/id-(\w+) tmc-(\w+)/),
                  linkID = +match[1],
                  tmc = match[2];
              return {
                properties: {
                  linkID:linkID,
                  tmc:tmc
                }
              };
            });
        }

        roadPaths
          .attr("stroke", linkShader);

        console.log("_onDataPointSliderUpdate completed")
    },

    _onStateChange: function() {
        console.log("STATE_CHANGE");
        var newState = this.state;

        newState.layers.county.id++;
        newState.layers.county.geo = GeoStore.getState(36);

        this.setState(newState);
    },

    render: function() {
        return (
            <div className="content container">
                <div className="row">
                    <div className="col-lg-2">
                      <ControlPanel loading={ this.props.loading }/>
                    </div>
                    <div className="col-lg-10" id="NPMRDS-map-div">
                        <LeafletMap height="600px" layers={this.state.layers}/>
                        <DataView />
                        <NPMRDSLegend dataView={this.props.dataView}/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-log-10">
                        <DataPointSlider />
                    </div>
                </div>
                <div className="row">
                    <NPMRDSTMCPanel />
                </div>
            </div>
        );
    }

});

module.exports = MapView;


                // <div className="row">
                //     <div className="col-lg-12">
                //         <section className="widget widget-tabs">
                //             <header>
                //                 <ul className="nav nav-tabs" id="NPMRDS-TMC-tabs">
                //                     {this.state.tabs}
                //                 </ul>
                //             </header>
                //             <div className="body tab-content">
                //                     {this.state.panels}
                //             </div>
                //         </section>
                //     </div>
                // </div>