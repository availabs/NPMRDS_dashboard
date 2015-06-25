'use strict';

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes,

    UserStore = require("../../stores/UserStore");


var MPO_LandingPage = React.createClass({
  
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

                <p>You are a MPO user!!!</p>

    		</div>
    	)
    }
})

module.exports = MPO_LandingPage;