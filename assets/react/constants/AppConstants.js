

var keyMirror = require('keymirror');

module.exports = {

  ActionTypes: keyMirror({
    
    //-------------------------------------------------------
    //View actions 
    //-------------------------------------------------------
    SELECT_USER: null,
    CREATE_USER:null,
    GET_PREFERENCES: null,

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

    RECEIVE_TMC_LOOKUP: null,

    CONTROL_PANEL_PARAMS_LOADED: null,

    ROUTE_SAVED: null,
    ROUTE_LOADED: null,
    RECEIVED_SAVED_ROUTES: null
  }),

  EventTypes: keyMirror({
    COUNTY_CHANGE: null,
    STATE_CHANGE: null,
    CHANGE_EVENT: null,

    USAGE_DATA_PROCESSED: null,

    DATA_POINT_SLIDER_SHOW: null,
    DATA_POINT_SLIDER_UPDATE: null,

    DISPLAY_TMC_DATA: null,
    REMOVE_TMC_DATA: null,

    DISPLAY_AGGREGATED_DATA: null,

    TMC_DATAVIEW_CHANGE: null,

    SAILS_WEB_API_LOADING_START: null,
    SAILS_WEB_API_LOADING_STOP: null,

    ROUTE_CREATED: null,
    INTERSECTS_CREATED: null,
    
    ROUTE_SAVED: null,
    ROUTE_LOADED: null,
    RECEIVE_SAVED_ROUTES: null
  }),

  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })

};
