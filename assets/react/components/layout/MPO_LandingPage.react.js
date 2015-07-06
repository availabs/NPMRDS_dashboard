'use strict';

var React = require('react'),

    Events = require('../../constants/AppConstants').EventTypes;


var MPO_LandingPage = React.createClass({
  
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

                        <p>You are a MPO user!!!</p>
                        <p>Your designated MPO is: {this.props.prefs.mpo_name}.</p>

            		</div>
                </div>
            </div>
    	)
    }
})

module.exports = MPO_LandingPage;