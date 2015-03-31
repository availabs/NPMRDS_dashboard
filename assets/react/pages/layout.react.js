var React = require('react'),
    RouteHandler = require('react-router').RouteHandler,
    // -- utils
    CHANGE_EVENT = 'change',
    // -- App Templates
    Sidebar = require('../components/layout/Sidebar.react'),
    Logo = require('../components/layout/Logo.react'),
    Header = require('../components/layout/Header.react'),

    //--Stores
    UsageDataStore = require('../stores/UsageDataStore');

var App = React.createClass({
 
    getInitialState: function() {
        return {
            dataLoading : UsageDataStore.getLoadingState(),
            dataView : UsageDataStore.getDataViews().current
        }
    },
    componentDidMount: function() {
        UsageDataStore.addChangeListener(CHANGE_EVENT,this._onChange);
    },

    componentWillUnmount: function() {
        UsageDataStore.removeChangeListener(CHANGE_EVENT,this._onChange);
    },

    _onChange:function(){
        //console.log('layout on change', UsageDataStore.getLoadingState())
        this.setState({
            dataLoading : UsageDataStore.getLoadingState(),
            dataView : UsageDataStore.getDataViews().current
        })
    },

    render: function() {
        return (
            <div>
                <Logo />
                <div className="wrap">
                    <Header />
                      <RouteHandler loading={this.state.dataLoading} dataView={this.state.dataView} />
                </div>
               
            </div>
        );
    },

});

module.exports = App;