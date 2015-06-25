'use strict';

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes,

    UserStore = require("../../stores/UserStore");


var State_LandingPage = React.createClass({
  
    getInitialState: function() {
    	return {
    		sessionUser: UserStore.getSessionUser()
    	};
    },

    componentDidMount: function() {
    },
    componentWillUnmount: function() {
    },

    render: function() {
    	return (
            <div className="widget">

                <p>You are a state user!!!</p>

    		</div>
    	)
    }
})

module.exports = State_LandingPage;