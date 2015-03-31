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
    
    // stores
    GeoStore = require("../stores/GeoStore"),
    UsageDataStore = require("../stores/UsageDataStore"),
    TMCDataStore = require("../stores/TMCDataStore");

var linkShader = UsageDataStore.linkShader(),
    roadPaths = null;

var MapView = React.createClass({
  
    getInitialState: function(){
        return {
            selectedTMCs: [],
            tabs: [],
            panels: [],
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
                                    
                                },
                                mouseout: function(e){
                                   
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
              
    },

    componentWillUnmount: function() {
        GeoStore.removeChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
        GeoStore.removeChangeListener(Events.STATE_CHANGE, this._onStateChange);
          
        UsageDataStore.removeChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);  
         
    },

    _onDisplayTMCdata: function(tmc) {
        //console.log("displayTMCdata")
        var state = this.state;
        state.selectedTMCs.push(tmc);
        this.setState(state);
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
        var page = this;
        this.state.selectedTMCs.forEach(function(tmc) {
            page.state.tabs.push(<NPMRDSTabSelector tmc={tmc} key={tmc}/>);
        });
        this.state.selectedTMCs.forEach(function(tmc) {
            page.state.panels.push(<NPMRDSTabPanel tmc={tmc} key={tmc}/>);
        });
        this.state.selectedTMCs = [];
        var style = {padding: "0px", overflow: "hidden", margin: "0px"};
        return (
            <div className="content container">
                <div className="row">
                    <div className="col-lg-2">
                      <ControlPanel loading={ this.props.loading }/>
                    </div>
                    <div className="col-lg-10" stye={style}>
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
            </div>
        );
    }

});

module.exports = MapView;