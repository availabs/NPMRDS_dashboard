'use strict';

var React = require('react'),

    SailsWebApi = require("../utils/api/SailsWebApi"),

	MPO_LandingPage = require("../components/layout/MPO_LandingPage.react"),
    State_LandingPage = require("../components/layout/State_LandingPage.react"),
    UserPreferences = require("../components/layout/UserPreferences.react"),

    Events = require('../constants/AppConstants').EventTypes,

    UserStore = require("../stores/UserStore");

var PleaseWait = React.createClass({
    render: function() {
        return (<div className="col-lg-12">Please Wait...</div>);
    }
})


var LandingPage = React.createClass({
  
    getInitialState: function() {
console.log("<LandingPage.getInitialState> preferences", UserStore.getPreferences() || "unloaded")
    	return {
    		sessionUser: UserStore.getSessionUser(),
            preferences: UserStore.getPreferences()
    	};
    },

    componentDidMount: function() {
    	console.log("<LandingPage.componentDidMount> sessionUser", this.state.sessionUser);

        UserStore.addChangeListener(this._getPreferences);
    },
    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._getPreferences);
    },

    _getPreferences: function() {
console.log("<LandingPage._getPreferences>")
        var state = this.state;

        state.preferences = UserStore.getPreferences();

        this.setState(state);
    },

    render: function() {
    	return (
            <div className="content container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="widget">
    		    			<h4>{"Welcome, "+this.state.sessionUser.name}</h4>
                        </div>
		    		</div>
		    	</div>
		    	<div className="row">
                    <div className="col-lg-12">
		    		    { getPageState(this.state.preferences) }
                    </div>
		    	</div>
		    </div>
    	)
    }
})

module.exports = LandingPage;

function getPageState(prefs) {
console.log("<LandingPage.getPageState> preferences",prefs)
    switch (prefs.user_type) {
        case "not_set":
            return <UserPreferences />;
        case "state_user":
            return <State_LandingPage />;
        case "mpo_user":
            return <MPO_LandingPage />;
        default:
            return <PleaseWait />;
    }
}