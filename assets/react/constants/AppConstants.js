

var keyMirror = require('keymirror');

module.exports = {

  ActionTypes: keyMirror({

    //-------------------------------------------------------
    //View actions
    //-------------------------------------------------------
    SELECT_USER: null,
    CREATE_USER:null,
    RECEIVED_USER_PREFERENCES: null,

    //-------------------------------------------------------
    //Server actions
    //-------------------------------------------------------
    SET_APP_SECTION:null,

    //-------User--------------------------------------------
    RECEIVE_USERS: null,
    SET_SESSION_USER:null,



    RECEIVED_COUNTIES: null,
    RECEIVED_COUNTY_ROADS: null,

    RECEIVED_COUNTY_ROADS_DATA: null,
    RECEIVED_SHIFTED_COUNTY_ROADS:null,

    DATA_VIEW_CHANGED: null,

    RECEIVED_TMC_DATA: null,

    RECEIVED_TMC_LOOKUP: null,

    CONTROL_PANEL_PARAMS_LOADED: null,

    ROUTE_SAVED: null,
    ROUTE_LOADED: null,
    RECEIVED_SAVED_ROUTES: null,

    RECEIVED_MPO_NAMES: null,

    LOAD_MONTHLY_GRAPH_DATE: null,

    MONTHLY_HOURS_DATA_LOADED: null,

    ROUTE_DATA_MONTH_CHANGE: null
  }),

  EventTypes: keyMirror({
    RECEIVED_USER_PREFERENCES: null,

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
