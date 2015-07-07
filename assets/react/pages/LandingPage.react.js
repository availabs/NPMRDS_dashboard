'use strict';

var React = require('react'),

	MPO_LandingPage = require("../components/landing/MPO_LandingPage.react"),
    State_LandingPage = require("../components/landing/State_LandingPage.react"),
    UserPreferences = require("../components/landing/UserPreferences.react"),

    UserStore = require("../stores/UserStore");

var PleaseWait = React.createClass({
    render: function() {
        return (<div className="col-lg-12">Please Wait...</div>);
    }
})


var LandingPage = React.createClass({

    getInitialState: function() {
    	return {
    		sessionUser: UserStore.getSessionUser(),
            preferences: UserStore.getPreferences()
    	};
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this._getPreferences);
    },
    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._getPreferences);
    },

    _getPreferences: function() {
        var state = this.state;

        state.preferences = UserStore.getPreferences();

        this.setState(state);
    },

    getPageState: function(prefs) {
        switch (prefs.user_type) {
            case "not_set":
                return <UserPreferences user={this.state.sessionUser} />;
            case "state_user":
                return <State_LandingPage user={this.state.sessionUser} prefs={this.state.preferences} />;
            case "mpo_user":
                return <MPO_LandingPage user={this.state.sessionUser} prefs={this.state.preferences} />;
            default:
                return <PleaseWait />;
        }
    },

    render: function() {
    	return (
            <div className="content container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="widget">
    		    			<h4>{"Welcome back, " + this.state.sessionUser.name + "."}</h4>
                        </div>
		    		</div>
		    	</div>
		    	{ this.getPageState(this.state.preferences) }
		    </div>
    	)
    }
})

module.exports = LandingPage;
