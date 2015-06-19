'use strict';

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

  saveRoute: function(routeData) {
    var url = "/routes/save/" + routeData.owner + "/" + routeData.name + "/" + JSON.stringify(routeData.points);
    d3.xhr(url)
        .response(function(request) { return JSON.parse(request.responseText); })
        .get(function(err, res) {
            ServerActionCreators.routeSaved(err, res);
        });
  },
  loadRoute: function(routeData) {
    var url = "/routes/load/" + routeData.owner + "/" + routeData.name;
    d3.xhr(url)
        .response(function(request) { return JSON.parse(request.responseText); })
        .get(function(err, res) {
            ServerActionCreators.routeLoaded(err, res);
        });
  },
  getSavedRoutes: function(owner) {
    var url = "/routes/getsaved/"+owner;
    d3.xhr(url)
        .response(function(request) { return JSON.parse(request.responseText); })
        .get(function(err, res) {
            ServerActionCreators.receiveSavedRoutes(err, res);
        });
  },

  getTMCdata: function(requestedTMCs, unloadedTMCs) {

    if (!Array.isArray(unloadedTMCs)) {
      unloadedTMCs = [unloadedTMCs];
    }
console.log("SailsWebApi.getTMCdata: getting data for", unloadedTMCs);

    var requests = [],
        i = 0,
        responses = 0,
        data = { rows: [], numRows: 0 };

    while (i < unloadedTMCs.length) {
        requests.push(unloadedTMCs.slice(i, i+2));
        i += 2;
    }

    requests = [unloadedTMCs];

    requests.forEach(function(request) {
        SailsWebApi.checkLoading(true);

console.log("SailsWebApi.getTMCdata: requesting data for", request);

        d3.json("/tmcdata/"+JSON.stringify(request), function(err, tmcData) {
            SailsWebApi.checkLoading(false);
            data.rows = data.rows.concat(tmcData.rows);
            data.numRows += tmcData.numRows;

            if (++responses == requests.length) {
                data.schema = tmcData.schema;
                data.types = tmcData.types;

console.log("SailsWebApi.getTMCdata: recieved data for", unloadedTMCs);
                ServerActionCreators.receiveTMCdata(requestedTMCs, data);
            }
        });
    })
    
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
