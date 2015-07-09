'use strict';

var io = require('./sails.io.js')(),
    d3 = require("d3"),
    assign = require('object-assign'),
    ServerActionCreators = require('../../actions/ServerActionsCreator'),
    EventEmitter = require('events').EventEmitter,
    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes,
    AppDispatcher = require("../../dispatcher/AppDispatcher.js");

var LOADING = 0;

var SailsWebApi = assign(EventEmitter.prototype, {
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
            LOADING = Math.max(LOADING-1, 0);
            if (!LOADING) {
                this.emitEvent(Events.SAILS_WEB_API_LOADING_STOP);
console.log("SAILS_WEB_API_LOADING_STOP");
            }
        }
    },

    get: function(url, payload, setLoading) {
        if (setLoading) SailsWebApi.checkLoading(true);
        d3.json(this.makeURL(url), function(error, result) {
            if (setLoading) SailsWebApi.checkLoading(false);
            payload.data = result;
            AppDispatcher.handleServerAction(payload);
        })
    },
    post: function(url, data, payload, setLoading) {
        if (setLoading) SailsWebApi.checkLoading(true);
        d3.json(this.makeURL(url)).post(JSON.stringify(data), function(error, result) {
            if (setLoading) SailsWebApi.checkLoading(false);
            payload.data = result;
            AppDispatcher.handleServerAction(payload);
        })
    },
    makeURL: function(url) {
        var regex = /\w+\//;
        if (typeof url === "string") return url;
        return url.reduce(function(a,c) {
            if (typeof c === "string") {
                if (!regex.test(c)) {
                    return a+c+"/";
                }
                else {
                    return a+c;
                }
            }
            return a+JSON.stringify(c)+"/";
        }, "");
    },

  initAdmin: function(user){
    ServerActionCreators.setAppSection('admin');
    ServerActionCreators.setSessionUser(user);

    this.getPreferences(user.id);
    this.getMPONames();

    this.getCounties();

    this.read('user');
  },
  getPreferences: function(id) {
    SailsWebApi.checkLoading(true);
    d3.json("/preferences/get/"+id, function(error, result) {
        SailsWebApi.checkLoading(false);
        ServerActionCreators.receivePreferences(result);
    })
  },
  getMPONames: function() {
    d3.json("/mpo/getallnames", function(error, result) {
      if (error) {
        console.log(error);
      }
      else {
        ServerActionCreators.receiveMPONames(result);
      }
    })
  },
  savePreferences: function(id, type, mpo) {
    d3.xhr("/preferences/save/"+id+"/"+type+"/"+mpo)
        .response(function(request) { return JSON.parse(request.responseText); })
        .post(function(err, result) {
            ServerActionCreators.receivePreferences(result);
        });
  },
  initCmpgn: function(user,campaign){

    ServerActionCreators.setAppSection('cmpgn');
    ServerActionCreators.setSessionUser(user);
    ServerActionCreators.setSessionCampaign(campaign);

    this.read('user');
    this.recieveVoters(campaign.id)

  },

  saveRoute: function(routeData) {
    var url = "/routes/save/" + routeData.owner + "/" + routeData.name;
    d3.json(url).post(JSON.stringify(routeData), function(err, res) {
            ServerActionCreators.routeSaved(err, res);
        });
  },
  loadRoute: function(routeData) {
    var url = "/routes/load/" + routeData.owner + "/" + routeData.name;
    d3.json(url, function(err, res) {
            ServerActionCreators.routeLoaded(err, res);
        });
  },
  getSavedRoutes: function(userId, mpo_name) {
// console.log("<SailsWebApi::getSavedRoutes>")
      if (!Array.isArray(mpo_name)) {
          mpo_name = [mpo_name];
      }
      mpo_name = JSON.stringify(mpo_name);
      d3.json("/routes/getsaved/"+userId+"/"+mpo_name, function(err, res) {
          if (err) {
              console.log("Could not retrieve saved routes", err);
          }
          else {
              ServerActionCreators.receiveSavedRoutes(res);
          }
      })
  },

  getTMCdata: function(requestedTMCs, unloadedTMCs) {

    if (!Array.isArray(unloadedTMCs)) {
      unloadedTMCs = [unloadedTMCs];
    }

    var requests = [],
        i = 0,
        responses = 0,
        data = { rows: [], numRows: 0 },
        maxSize = 4;

    while (i < unloadedTMCs.length) {
        var size = (unloadedTMCs.length-i > maxSize) ? Math.min(maxSize, Math.ceil((unloadedTMCs.length-i)/2)) : maxSize;
        requests.push(unloadedTMCs.slice(i, i+size));
        i += size;
    }

    requests.forEach(function(request) {
        SailsWebApi.checkLoading(true);

console.log("SailsWebApi.getTMCdata: requesting data for", request);

        d3.json("/tmc/data/"+JSON.stringify(request), function(err, tmcData) {
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
    d3.json("/roads/geo/county/"+fips, function(err, topo) {
      ServerActionCreators.receiveCountyRoads(topo);
        SailsWebApi.checkLoading(false);
    })
  },

  getCountyUsageData: function(fips, params) {
    SailsWebApi.checkLoading(true);
    d3.xhr("/roads/usage/county/"+fips)
      .response(function(request) { return JSON.parse(request.responseText); })
      .post(JSON.stringify(params), function(err, data) {
        ServerActionCreators.receiveCountyData(fips, params, data);
        SailsWebApi.checkLoading(false);
      })
  },

  // getTMClookup: function(links) {
  //   SailsWebApi.checkLoading(true);
  //   var links = JSON.stringify(links);
  //   d3.json("/tmc/lookup/"+links, function(err, data) {
  //       ServerActionCreators.receiveTMClookup(data);
  //       SailsWebApi.checkLoading(false);
  //     })
  // },

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
