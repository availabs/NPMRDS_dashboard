

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

    DATA_VIEW_CHANGE: null
  }),

  EventTypes: keyMirror({
    COUNTY_CHANGE: "COUNTY_CHANGE",
    STATE_CHANGE: "STATE_CHANGE",
    CHANGE_EVENT: "CHANGE_EVENT",
    USAGE_DATA_PROCESSED: "USAGE_DATA_PROCESSED",
    DATA_POINT_SLIDER_SHOW: "DATA_POINT_SLIDER_SHOW",
    DATA_POINT_SLIDER_UPDATE: "DATA_POINT_SLIDER_UPDATE"
  }),

  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  })

};
