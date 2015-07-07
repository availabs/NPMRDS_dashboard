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

        var owner = this.props.user.id,
            mpo = this.props.prefs.mpo_name;
console.log("<MPO_LandingPage> componentDidMount", owner, mpo);
        SailsWebApi.get(["/routes/getsaved/",owner,[mpo]], { type: Actions.RECEIVE_SAVED_ROUTES });
    },
    componentWillUnmount: function() {
        RouteStore.removeChangeListener(Events.RECEIVED_SAVED_ROUTES, this.displaySavedRoutes);
    },

    displaySavedRoutes: function(routeData) {
console.log("<MPO_LandingPage> savedRoutes", routeData);

        this.setState({ routes: routeData });
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
