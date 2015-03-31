"use strict"
var React = require('react'),
    LeafletMap = require("../components/utils/LeafletMap.react"),
    d3 = require("d3"),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    Events = require('../constants/AppConstants').EventTypes,

    NPMRDSLegend = require("../components/NPMRDSLegend.react"),
    DataView = require("../components/NPMRDSDataView.react"),
    NPMRDSTabPanel = require("../components/NPMRDSTabPanel.react"),
    NPMRDSTabSelector = require("../components/NPMRDSTabSelector.react"),

// stores
    GeoStore = require("../stores/GeoStore"),
    UsageDataStore = require("../stores/UsageDataStore"),
    TMCDataStore = require("../stores/TMCDataStore");

var linkShader = UsageDataStore.linkShader(),
    roadPaths = null;

var SamplePage = React.createClass({
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
                            weight: 2,
                            stroke:true
                        }
                    },
                     onEachFeature: function (feature, layer) {
                        
                        layer.on({

                            click: function(e){
                                GeoStore.toggleCounty(feature.id)
                            },
                            mouseover: function(e){

                            },
                            mouseout: function(e){
                               
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
      
      TMCDataStore.addChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
      TMCDataStore.addChangeListener(Events.REMOVE_TMC_DATA, this._onRemoveTMCdata);
  },

  componentWillUnmount: function() {
      GeoStore.removeChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
      GeoStore.removeChangeListener(Events.STATE_CHANGE, this._onStateChange);
      
      UsageDataStore.removeChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);
      
      TMCDataStore.removeChangeListener(Events.DISPLAY_TMC_DATA, this._onDisplayTMCdata);
      TMCDataStore.removeChangeListener(Events.REMOVE_TMC_DATA, this._onRemoveTMCdata);
  },

  _onDisplayTMCdata: function(tmc) {
console.log("displayTMCdata")
    var state = this.state;
    state.selectedTMCs.push(tmc);
    this.setState(state);
  },

  _onRemoveTMCdata: function(TMC) {
    var state = this.state,
        tabs = [],
        panels = [];

    state.tabs.forEach(function(tab) {
        if (TMC != tab.key) {
          tabs.push(tab);
        }
    });
    state.panels.forEach(function(panel) {
        if (TMC != panel.key) {
          panels.push(panel);
        }
    });

    state.tabs = tabs;
    state.panels = panels;

    var activeTab = d3.select("#NPMRDS-tab-content").selectAll(".active");

    if (activeTab.attr("id").substr(TMC)) {
        var tabs = d3.select("#NPMRDS-tab-content").selectAll(".tab-pane"),
            index = 0;

        tabs.each(function(d, i) {
            if (d3.select(this).classed("active")) {
                index = i;
            }
        })

        tabs.each(function(d, i) {
            if (i == index-1) {
                d3.select(this).classed("active", true);
                index = i;
            }
        });
        d3.select("#NPMRDS-tab-list").selectAll("li").each(function(d, i) {
            if (i == index) {
                d3.select(this).classed("active", true);
            }
        })
    }

    this.setState(state);
  },

  _onCountyChange: function() {
    console.log("COUNTY_CHANGE");
    var newState = this.state;

    newState.layers.roads.id++;
    newState.layers.roads.geo.features = GeoStore.getLoadedRoads();
    newState.layers.roads.options.zoomOnLoad = true;

    this.setState(newState);

    roadPaths = null;
  },

  _onDataPointSliderUpdate: function() {
    console.log("DATA_POINT_SLIDER_UPDATE");

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
          <ul className="nav nav-tabs" role="tablist" id="NPMRDS-tab-list">
            <li role="presentation" className="active"><a href="#map-div" aria-controls="map-div" role="tab" data-toggle="tab">Home</a></li>
            {this.state.tabs}
          </ul>
          <div className="tab-content" style={style} id="NPMRDS-tab-content">
            <div role="tabpanel" className="tab-pane active row" id="map-div" style={style}>
                <div className="col-lg-12" stye={style}>
                    <LeafletMap height="600px" layers={this.state.layers}/>
                    <DataView />
                    <NPMRDSLegend />
                </div>
            </div>
            {this.state.panels}
          </div>
        </div>
    );
  }
});

module.exports = SamplePage;