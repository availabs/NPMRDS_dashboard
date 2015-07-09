'use strict';

var React = require('react'),

    SailsWebApi = require("../../utils/api/SailsWebApi"),

    d3 = require("d3"),

    Events = require('../../constants/AppConstants').EventTypes,

    UserStore = require("../../stores/UserStore");

// user type selection values
var USER_TYPES = [null, "mpo_user", "state_user"],
    USER_TYPES_STRINGS = ["choose your user type", "mpo user", "state user"];

var UserPreferences = React.createClass({
    getInitialState: function() {
    	return {
            MPONames: []
    	};
    },

    componentDidMount: function() {
        d3.select("#mpo-preferences-div").style("display", "none");
        UserStore.addChangeListener(this.getMPONames);
        this.getMPONames();
    },
    componentWillUnmount: function() {
        UserStore.removeChangeListener(this.getMPONames);
    },

    getMPONames: function() {
        var names = ["choose a MPO name"].concat(UserStore.getMPONames().map(function(d) { return d.shortName; }));

        if (names.length != this.state.MPONames.length) {
            var state = this.state
            state.MPONames = names;
            this.setState(state);
        }
    },

    handleSubmit: function() {
        var userTypeValue = d3.select("#user-type").property("value"),
            userType = USER_TYPES[userTypeValue],

            mpoNameValue = d3.select("#mpo-name").property("value"),
            mpoName = userType == "state_user" ? "state_user" : this.state.MPONames[mpoNameValue];

        if (userTypeValue && ((userType=="mpo_user" && mpoNameValue > 0) || userType=="state_user")) {
            UserStore.savePreferences(userType, mpoName);
        }
        else {
console.log("<UserPreferences> oops!!!")
        }
    },

    render: function() {
        var userOptions = USER_TYPES_STRINGS.map(function(type, i) {
                return (<option key={i} value={i}>{type}</option>);
            }),
            mpoNames = this.state.MPONames.map(function(name, i) {
                return (<option key={i} value={i}>{name}</option>);
            }),
            style = { width: "15%" };

    	return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="widget">

                        <div>
                            <h4>User Preferences</h4>
                            <p>Set your preferences</p>
                        </div>

                        <div style={ style }>

                            <div className="form-group">
                                <label htmlFor="user-type">User Type</label>
                                <select id="user-type" name="user-type" onChange={selectChange}>
                                    { userOptions }
                                </select>
                            </div>

                            <div className="form-group" id ="mpo-preferences-div">
                                <label htmlFor="mpo-name">MPO Name</label>
                                <select id="mpo-name" name="mpo-name">
                                    { mpoNames }
                                </select>
                            </div>

                            <button className="btn btn-info" onClick={this.handleSubmit}>Submit</button>

                        </div>

            		</div>
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

    d3.select("#mpo-preferences-div").style("display", display);
}
