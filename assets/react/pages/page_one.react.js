var React = require('react'),
    LeafletMap = require("../components/utils/LeafletMap.react"),
    d3 = require("d3"),

    Events = require('../constants/AppConstants').EventTypes,

    NPMRDSLegend = require("../components/NPMRDSLegend.react"),

// stores
    GeoStore = require("../stores/GeoStore"),
    UsageDataStore = require("../stores/UsageDataStore");

var linkShader = UsageDataStore.linkShader();

var SamplePage = React.createClass({
 
  getInitialState: function(){   
    return {
        roads: GeoStore.getLoadedRoads(),
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
                            className: 'roads',
                            stroke:true,
                            color: linkShader(feature)
                        }
                    },
                     onEachFeature: function (feature, layer) {
                        
                        layer.on({

                            click: function(e){
                                //console.log('county clicked',e.target.feature.id);
                                //GeoStore.toggleCounty(e.target.feature.id)
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
      GeoStore.addChangeListener(Events.CHANGE_EVENT, this._onChange);
      GeoStore.addChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
      GeoStore.addChangeListener(Events.STATE_CHANGE, this._onStateChange);
      
      UsageDataStore.addChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);
  },

  componentWillUnmount: function() {
      GeoStore.removeChangeListener(Events.CHANGE_EVENT, this._onChange);
      GeoStore.removeChangeListener(Events.COUNTY_CHANGE, this._onCountyChange);
      GeoStore.removeChangeListener(Events.STATE_CHANGE, this._onStateChange);
      
      UsageDataStore.removeChangeListener(Events.DATA_POINT_SLIDER_UPDATE, this._onDataPointSliderUpdate);
  },

  _onCountyChange: function() {
    console.log("COUNTY_CHANGE");
    var newState = this.state;

    newState.layers.roads.id++;
    newState.layers.roads.geo.features = GeoStore.getLoadedRoads();
    newState.layers.roads.options.zoomOnLoad = true;

    this.setState(newState);
  },

  _onDataPointSliderUpdate: function() {
    console.log("DATA_POINT_SLIDER_UPDATE");
    var newState = this.state;

    newState.layers.roads.id++;
    newState.layers.roads.geo.features = GeoStore.getLoadedRoads();
    newState.layers.roads.options.zoomOnLoad = false;

    this.setState(newState);
  },

  _onStateChange: function() {
    console.log("STATE_CHANGE");
    var newState = this.state;

    newState.layers.county.id++;
    newState.layers.county.geo = GeoStore.getState(36);

    this.setState(newState);
  },
  
  _onChange: function(){
    console.log("CHANGE_EVENT");
  },

  render: function() {
    return (
        <div className="content container">
            <div className="row">
                <div className="col-lg-12">
                    <LeafletMap height="600px" layers={this.state.layers}/>
                    <NPMRDSLegend />
                </div>
            </div>
        </div>
    );
  }
});

module.exports = SamplePage;