

var keyMirror = require('keymirror');

module.exports = {

  ActionTypes: keyMirror({
    
    //-------------------------------------------------------
    //View actions 
    //-------------------------------------------------------
    SELECT_USER: null,
    CREATE_USER:null,

    //-------------------------------------------------------
    //Server actions 
    //-------------------------------------------------------
    SET_APP_SECTION:null,
    
    //-------User--------------------------------------------
    RECEIVE_USERS: null,
    SET_SESSION_USER:null,

    RECEIVE_COUNTIES: null,
    RECEIVE_COUNTY_ROADS: null,

    RECEIVE_COUNTY_DATA: null,
    RECEIVE_SHIFTED_COUNTY_ROADS:null,

    DATA_VIEW_CHANGE: null,

    RECEIVE_TMC_DATA: null,

    RECEIVE_TMC_LOOKUP: null
  }),

  EventTypes: keyMirror({
    COUNTY_CHANGE: "COUNTY_CHANGE",
    STATE_CHANGE: "STATE_CHANGE",
    CHANGE_EVENT: "CHANGE_EVENT",
    USAGE_DATA_PROCESSED: "USAGE_DATA_PROCESSED",

    DATA_POINT_SLIDER_SHOW: "DATA_POINT_SLIDER_SHOW",
    DATA_POINT_SLIDER_UPDATE: "DATA_POINT_SLIDER_UPDATE",

    DISPLAY_TMC_DATA: "DISPLAY_TMC_DATA",
    REMOVE_TMC_DATA: "REMOVE_TMC_DATA",

    DISPLAY_AGGREGATED_DATA: "DISPLAY_AGGREGATED_DATA",

    TMC_DATAVIEW_CHANGE: "TMC_DATAVIEW_CHANGE",

    SAILS_WEB_API_LOADING_START: "SAILS_WEB_API_LOADING_START",
    SAILS_WEB_API_LOADING_STOP: "SAILS_WEB_API_LOADING_STOP",

    ROUTE_CREATED: "ROUTE_CREATED",
    INTERSECTS_CREATED: "INTERSECTS_CREATED"
  }),

  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })

};
