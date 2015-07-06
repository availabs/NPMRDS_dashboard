'use strict';

var React = require('react'),

    SailsWebApi = require("../utils/api/SailsWebApi"),

    UserPreferences = require("../components/layout/UserPreferences.react"),

    Events = require('../constants/AppConstants').EventTypes,

    UserStore = require("../stores/UserStore");

var PleaseWait = React.createClass({
    render: function() {
        return (<div className="col-lg-12">Please Wait...</div>);
    }
})


var UserSettings = React.createClass({
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
console.log("<UserSettings> _getPreferences>")
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
    		    			<h4>{"Hello "+this.state.sessionUser.name+". Need to change your settings?"}</h4>
                        </div>
		    		</div>
		    	</div>
		    	<UserPreferences user={this.state.sessionUser}/>
		    </div>
    	)
    }
})

module.exports = UserSettings;