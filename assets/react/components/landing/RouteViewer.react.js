'use strict';

var React = require('react'),

    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes,
    Actions = Constants.ActionTypes,

    SailsWebApi = require("../../utils/api/SailsWebApi"),

    RouteStore = require("../../stores/RouteStore"),

    RouteTable = require("./RouteTable.react");

var RouteViewer = React.createClass({
    render: function() {
        var mpo = this.props.mpo,

            mpoRows = this.props.routes
                .filter(function(d) {
                    return d.owner == mpo;
                }),

            personalRows = this.props.routes
                .filter(function(d) {
                    return d.owner != mpo;
                });
        return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="widget">

                        <RouteTable header={["MPO Routes"]} rows={ mpoRows } />

                        <RouteTable header={["Personal Routes"]} rows={ personalRows } />

            		</div>
                </div>
            </div>
        )
    }
})

module.exports = RouteViewer;
