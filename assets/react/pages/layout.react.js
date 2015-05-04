var React = require('react'),
    RouteHandler = require('react-router').RouteHandler,
    
    // -- App Templates
    Sidebar = require('../components/layout/Sidebar.react'),
    Logo = require('../components/layout/Logo.react'),
    Header = require('../components/layout/Header.react');

var App = React.createClass({

    render: function() {
        return (
            <div>
                <Logo />
                <div className="wrap">
                    <Header />
                      <RouteHandler />
                </div>
               
            </div>
        );
    },

});

module.exports = App;