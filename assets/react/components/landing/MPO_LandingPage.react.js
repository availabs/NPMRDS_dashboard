'use strict';

var React = require('react'),

    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes,
    Actions = Constants.ActionTypes,

    SailsWebApi = require("../../utils/api/SailsWebApi"),

    RouteStore = require("../../stores/RouteStore"),

    RouteViewer = require("./RouteViewer.react");

var MPO_LandingPage = React.createClass({

    getInitialState: function() {
        return {
            routes: []
        };
    },

    componentDidMount: function() {
        RouteStore.addChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);

        this.displaySavedRoutes();
    },
    componentWillUnmount: function() {
        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);
    },

    displaySavedRoutes: function(routes) {
        this.setState({ routes: routes || RouteStore.getSavedRoutes() });
    },

    render: function() {
    	return (
            <div className="content container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="widget">

                            <p>You are a MPO user!!!</p>
                            <p>Your designated MPO is: {this.props.prefs.mpo_name}.</p>

                		</div>
                    </div>
                </div>
                <RouteViewer routes={ this.state.routes } mpo={ this.props.prefs.mpo_name }/>
            </div>
    	)
    }
})

module.exports = MPO_LandingPage;
