'use strict';

var React = require('react'),

    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes,
    Actions = Constants.ActionTypes,

    SailsWebApi = require("../../utils/api/SailsWebApi"),

    RouteStore = require("../../stores/RouteStore");

var RouteTable = React.createClass({
    render: function() {
        var widthStyle = { width: "200px" },

            header = this.props.header.map(function(h, i) {
                return (<th key={i}>{h}</th>);
            }),

            rows = this.props.rows.map(function(route, i) {
                return (
                    <tr key={i}>
                        <td style={ widthStyle }><a href="">{ route.name }</a></td>
                        <td>{"<super awesome data here!>"}</td>
                        <td>{"<even more awesomer data here!!!>"}</td>
                    </tr>
                );
            });
        return (
            <table className="table table-striped table-hover">
                <thead>
                    <tr>{ header }</tr>
                </thead>
                <tbody>{ rows }</tbody>
            </table>
        )
    }
})

module.exports = RouteTable;
