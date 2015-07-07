'use strict';

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes;


var State_LandingPage = React.createClass({
  
    getInitialState: function() {
        return {};
    },

    componentDidMount: function() {
    },
    componentWillUnmount: function() {
    },

    render: function() {
    	return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="widget">

                        <p>You are a state user!!!</p>

            		</div>
                </div>
            </div>
    	)
    }
})

module.exports = State_LandingPage;