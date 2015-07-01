var React = require('react'),
    Link = require('react-router').Link,
    
    // -- Stores
    UserStore = require('../../stores/UserStore');



function getSessionUserfromStore(){
    return {
        sessionUser: UserStore.getSessionUser(),
    }
};

var Header = React.createClass({
    getInitialState: function() {
        return getSessionUserfromStore();
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        UserStore.removeChangeListener(this._onChange);
    },
    _onChange :function(){
        this.setState(getSessionUserfromStore());
    },
    render: function() {
        var padding = {"marginRight": "10px"}
        return (
            <header className="page-header">
                <div className="navbar">
                    <ul className="nav navbar-nav navbar-right pull-right">
                        <li className="hidden-xs dropdown">
                            <a href="#" title="Links" id="npmrds-links" className="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                <span className="glyphicon glyphicon-th-list" />
                            </a>
                            <ul className="dropdown-menu account" role="menu">
                                <li role="presentation">
                                    <a href="/#/mapView">
                                        <span style={padding} className="glyphicon glyphicon-picture" />
                                        NPMRDS Map
                                    </a>
                                </li>
                            </ul>
                        </li>
                        
                        <li className="hidden-xs dropdown">
                            <a href="#" title="Account" id="account" className="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                <i className="glyphicon glyphicon-user"></i>
                            </a>
                            <ul id="account-menu" className="dropdown-menu account" role="menu">
                                <li role="presentation" className="account-picture">
                                    {this.state.sessionUser.name}
                                </li>
                                <li role="presentation">
                                    <a href="/#/user/settings">
                                        <i style={padding} className="glyphicon glyphicon-cog"></i>
                                        Settings
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li className="hidden-xs">
                            <a href="/logout" title="Logout">
                                <i className="glyphicon glyphicon-log-out" />
                            </a>
                        </li>
                    </ul>
                </div>
            </header>
        );
    }
});

module.exports = Header;
