'use strict';

var React = require('react'),
    Router = require("react-router"),

	MPO_LandingPage = require("../components/landing/MPO_LandingPage.react"),
    State_LandingPage = require("../components/landing/State_LandingPage.react"),
    UserPreferences = require("../components/landing/UserPreferences.react"),

    UserStore = require("../stores/UserStore"),
    RouteStore = require("../stores/RouteStore"),

    RouteMap = require("../components/landing/RouteMap.react");

var RouteMapper = React.createClass({
    mixins: [ Router.State ],

    getInitialState: function() {
    	return {
            sessionUser: UserStore.getSessionUser()
        };
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this._getPreferences);
    },
    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._getPreferences);
    },

    _getPreferences: function(event) {
        var state = this.state;

        state.preferences = UserStore.getPreferences();

        this.setState(state);
    },

    render: function() {
    	return (
            <div className="content container">
                <RouteMap routeId={ this.getParams().id }/>
		    </div>
    	)
    }
})

module.exports = RouteMapper;

/*
                <div className="row">
                    <div className="col-lg-12">
                        <div className="widget">
                            <h4>{"Hey there, " + this.state.sessionUser.name + ". Let's take a look at your route."}</h4>
                        </div>
                    </div>
                </div>
                */
