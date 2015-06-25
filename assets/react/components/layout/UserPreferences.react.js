'use strict';

var React = require('react'),

    SailsWebApi = require("../../utils/api/SailsWebApi"),

    d3 = require("d3"),

    Events = require('../../constants/AppConstants').EventTypes,

    UserStore = require("../../stores/UserStore");

var USER_TYPES = [null, "mpo_user", "state_user"],
    USER_TYPES_STRINGS = ["choose your user type", "mpo user", "state user"];

var UserPreferences = React.createClass({
  
    getInitialState: function() {
    	return {
    		sessionUser: UserStore.getSessionUser()
    	};
    },

    componentDidMount: function() {
        d3.select("#mpo-preferences").style("display", "none");
    },
    componentWillUnmount: function() {
    },

    handleSubmit: function() {
        var userTypeValue = d3.select("#user-type").property("value"),
            userType = USER_TYPES[userTypeValue],
            mpoCode = userType == "mpo_user" ? +d3.select("#mpo-code").property("value") : -1;

        if (userTypeValue && ((userType=="mpo_user" && mpoCode > 0) || userType=="state_user")) {
            console.log("saving user preferences", userType, mpoCode);
            SailsWebApi.savePreferences(this.state.sessionUser.id, userType, mpoCode);
        }
        else {
            console.log("oops!!!")
        }
    },

    render: function() {
        var options = USER_TYPES_STRINGS.map(function(reso, i) {
                return (<option key={i} value={i}>{reso}</option>);
            }),
            style = { width: "15%" };

    	return (

            <div className="widget">
                
                <div>
                    <h4>User Preferences</h4>
                    <p>Set your preferences</p>
                </div>

                <div style={ style }>

                    <div className="form-group">
                        <label htmlFor="user-type">User Type</label>
                        <select id="user-type" name="user-type" onChange={selectChange}>
                            { options }
                        </select>
                    </div>

                    <div className="form-group" id ="mpo-preferences">
                        <label htmlFor="mpo-code">MPO Area Code</label>
                        <input type="number" id="mpo-code" name="mpo-code" />
                    </div>

                    <button className="btn btn-info" onClick={this.handleSubmit}>Submit</button>

                </div>

    		</div>
    	)
    }
})

module.exports = UserPreferences;

function selectChange() {
    var userTypeValue = d3.select("#user-type").property("value"),
        userType = USER_TYPES[userTypeValue],
        display = userType == "mpo_user" ? "block" : "none";

    d3.select("#mpo-preferences").style("display", display);
}