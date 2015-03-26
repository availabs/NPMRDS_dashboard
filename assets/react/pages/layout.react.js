var React = require('react'),
    RouteHandler = require('react-router').RouteHandler,

    // -- App Templates
    Sidebar = require('../components/layout/Sidebar.react'),
    Logo = require('../components/layout/Logo.react'),
    Header = require('../components/layout/Header.react'),

    ControlPanel = require("../components/ControlPanel.react"),
    DataPointSlider = require("../components/DataPointSlider.react"),

    // -- Stores
    AppStore = require('../stores/AppStore');

var App = React.createClass({
 
  getInitialState: function(){   
    return {
      menu:AppStore.getMenu()
    };
  },
  
  componentDidMount: function() {
      AppStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
      AppStore.removeChangeListener(this._onChange);
  },
  
  _onChange: function(){
    console.log('on change layout');
    this.setState({menu:AppStore.getMenu()})
  },

  render: function() {
    return (
        <div>
            <Logo />
            <ControlPanel />
            <div className="wrap">
                <Header />
                  <RouteHandler />
            </div>
            <DataPointSlider />
        </div>
    );
  },

});

module.exports = App;