'use strict';
/*
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 *.
 */

var io = require('./sails.io.js')(),
    d3 = require("d3"),
    assign = require('object-assign'),
    ServerActionCreators = require('../../actions/ServerActionsCreator'),
    EventEmitter = require('events').EventEmitter,
    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes;

var LOADING = 0;

var SailsWebApi = assign({}, EventEmitter.prototype, {
    emitEvent: function(Event, data) {
        this.emit(Event, data);
    },
    addChangeListener: function(Event, callback) {
        this.on(Event, callback);
    },
    removeChangeListener: function(Event, callback) {
      this.removeListener(Event, callback);
    },
    checkLoading: function(loading) {
        if (loading) {
            if (!LOADING) {
                this.emitEvent(Events.SAILS_WEB_API_LOADING_START);
                console.log("SAILS_WEB_API_LOADING_START");
            }
            ++LOADING;
        }
        else if (!loading) {
            --LOADING;
            if (!LOADING) {
                this.emitEvent(Events.SAILS_WEB_API_LOADING_STOP);
                console.log("SAILS_WEB_API_LOADING_STOP");
            }
        }
    },

  initAdmin: function(user){

    ServerActionCreators.setAppSection('admin');
    ServerActionCreators.setSessionUser(user);
    this.getCounties();

    this.read('user');
  },
  initCmpgn: function(user,campaign){

    ServerActionCreators.setAppSection('cmpgn');
    ServerActionCreators.setSessionUser(user);
    ServerActionCreators.setSessionCampaign(campaign);
    
    this.read('user');
    this.recieveVoters(campaign.id)
  
  },
  //------------
  // get county geography
  //------------

  getTMCdata: function(tmc, data) {
    SailsWebApi.checkLoading(true);

    if (!Array.isArray(tmc)) {
      tmc = [tmc];
    }
console.log("SailsWebApi.getTMCdata: getting data", tmc, data);

    d3.xhr(/tmcdata/)
        .response(function(request) { return JSON.parse(request.responseText); })
        .post(JSON.stringify({id: tmc}), function(err, tmcData) {
console.log("SailsWebApi.getTMCdata", err, tmcData);
            for (var k in data) {
                tmcData[k] = data[k];
            }
            ServerActionCreators.receiveTMCdata(tmc, tmcData);
            SailsWebApi.checkLoading(false);
        });
  },

  getCounties: function() {
    SailsWebApi.checkLoading(true);
    d3.json("/geo_data/us_counties.json", function(err, topo) {
      ServerActionCreators.receiveCounties(topo);
        SailsWebApi.checkLoading(false);
    })
  },

  getCountyRoads: function(fips) {
    SailsWebApi.checkLoading(true);
    d3.json("/geo/getcounty/"+fips, function(err, topo) {
      ServerActionCreators.receiveCountyRoads(topo);
        SailsWebApi.checkLoading(false);
    })
  },

  getCountyUsageData: function(fips, params) {
    SailsWebApi.checkLoading(true);
    d3.xhr("/usage/getcounty/"+fips)
      .response(function(request) { return JSON.parse(request.responseText); })
      .post(JSON.stringify(params), function(err, data) {
        ServerActionCreators.receiveCountyData(fips, params, data);
        SailsWebApi.checkLoading(false);
      })
  },

  getTMClookup: function(links) {
    SailsWebApi.checkLoading(true);
    d3.xhr("/tmclookup")
      .response(function(request) { return JSON.parse(request.responseText); })
      .post(JSON.stringify({links:links}), function(err, data) {
        ServerActionCreators.receiveTMClookup(data);
        SailsWebApi.checkLoading(false);
      })
  },

  //---------------------------------------------------
  // Sails Rest Route
  //---------------------------------------------------
  create: function(type,data){
    io.socket.post('/'+type,data,function(resData){
      //ToDo Check for Errors and Throw Error Case
      //console.log('utils/sailsWebApi/createUser',resData);

      //add new user back to store through 
      ServerActionCreators.receiveData(type,[resData]);
    });
  },
  
  read: function(type) {
    io.socket.get('/'+type,function(data){     
      //console.log('utils/sailsWebApi/getUsers',data);
      ServerActionCreators.receiveData(type,data);
    });
  },


  update: function(type,data){
    io.socket.put('/'+type+'/'+data.id,data,function(resData){
      //ToDo Check for Errors and Throw Error Case
      //console.log('utils/sailsWebApi/updateData',resData);

      //add new user back to store through 
      ServerActionCreators.receiveData(type,[resData]);
    });
  },

  delete: function(type,id){
    io.socket.delete('/'+type+'/'+id,function(resData){
      //ToDo Check for Errors and Throw Error Case
      console.log('utils/sailsWebApi/delete',resData,id);

      //Delete 
      ServerActionCreators.deleteData(type,id);
    });
  },
});

module.exports = SailsWebApi;
