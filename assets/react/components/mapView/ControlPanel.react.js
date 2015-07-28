var React = require('react'),
    d3 = require("d3"),

    ViewActionsCreator = require("../../actions/ViewActionsCreator"),

    UsageDataStore = require("../../stores/UsageDataStore"),
    TMCDataStore = require("../../stores/TMCDataStore"),
    SailsWebApi = require("../../utils/api/SailsWebApi"),

    Constants = require('../../constants/AppConstants'),
    Events = Constants.EventTypes,

    _RESOLUTIONS_ = ["none", "year", "month", "day", "weekday", "hour", "15-minute"],
    _WEEKDAYS_ = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

var ControlPanel = React.createClass({
    getInitialState: function() {
        return {
            loading: false
        }
    },
    componentDidMount: function() {
        SailsWebApi.addChangeListener(Events.SAILS_WEB_API_LOADING_START, this._onDataLoadingStart);
        SailsWebApi.addChangeListener(Events.SAILS_WEB_API_LOADING_STOP, this._onDataLoadingStop);

        this.getParams();
    },
    componentWillUnmount: function() {
        SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_START, this._onDataLoadingStart);
        SailsWebApi.removeChangeListener(Events.SAILS_WEB_API_LOADING_STOP, this._onDataLoadingStop);

    },
    _onDataLoadingStart: function() {
        this.state.loading = true;
        d3.select("#NPMRDS-CP-submit").classed("NPMRDS-button-disabled", true);
    },
    _onDataLoadingStop: function() {
        this.state.loading = false;
        d3.select("#NPMRDS-CP-submit").classed("NPMRDS-button-disabled", false);
    },
    getParams: function() {
        var startDate = d3.select("#startDate").property("value").trim(),
            endDate = d3.select("#endDate").property("value").trim(),
            startTime = d3.select("#startTime").property("value").trim(),
            endTime = d3.select("#endTime").property("value").trim(),
            resolution = d3.select("#resolution").property("value").trim();

        var dateBounds = [];

        if (startDate.length) {
            var date = +startDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1$2$3");
            dateBounds.push(date);
        }
        if (endDate.length) {
            var date = +endDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1$2$3");
            dateBounds.push(date);
        }

        var timeBounds = []

        if (startTime.length) {
            var temp = startTime.split(":"),
                time = (+temp[0]*60)+(+temp[1]);
            timeBounds.push(time);
        }
        if (endTime.length) {
            var temp = endTime.split(":"),
                time = (+temp[0]*60)+(+temp[1]);
            timeBounds.push(time);
        }

        var params = {};

        if (dateBounds.length) {
            dateBounds.sort(function(a, b) { return a-b; });
            params.dateBounds = dateBounds;
        }

        if (timeBounds.length) {
            timeBounds.sort(function(a, b) { return a-b; });
            params.timeBounds = timeBounds;
        }

        if (resolution != "none") {
            params.resolution = resolution;
        }

        var weekdays = [];
        d3.select("#NPMRDS-weekday-selector")
            .selectAll("input")
            .each(function() {
                var input = d3.select(this);
                if (input.property("checked")) {
                    weekdays.push(input.attr("value"));
                }
            })
        params.weekdays = weekdays;

//console.log('<ControlPanel.getParams> params:', params);

        if (!this.state.loading) {
            ViewActionsCreator.setControlPanelParams(params);
        }
    },

    render: function() {
        var options = _RESOLUTIONS_.map(function(reso, i) {
            return (<option key={i}>{reso}</option>);
        });

        var checkboxes = _WEEKDAYS_.map(function(day, i) {
            return (
                <div key={i}>
                    <input type="checkbox" defaultChecked={i<_WEEKDAYS_.length-2} value={day} />
                    <span className="NPMRDS-checkbox">{day.slice(0, 2)}</span>
                </div>
            );
        })

        return (
          	<section className="widget">
                <div>
                    <h4>Control Panel</h4>
                    <p>Select NPMRDS data bounds</p>
                </div>
                <div className="body">
                    <div className="form-group">
                        <label htmlFor="search-input">Date Bounds</label>
                        <div className="input-group">
                            <input id="startDate" className='form-control' type="date" color="#000"/>
                            <input id="endDate" className='form-control' type="date" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="search-input">Time Bounds</label>
                        <div className="input-group">
                            <input className='form-control' id="startTime" type="time" />
                            <input className='form-control' id="endTime" type="time" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="search-input">Resolution</label>
                        <select id="resolution" className="form-control">
                            {options}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="search-input">Weekdays</label>
                        <br/>
                        <div id="NPMRDS-weekday-selector">
                            {checkboxes}
                        </div>
                    </div>
                    <div className="form-group">
                        <div id="NPMRDS-CP-submit" className="NPMRDS-submit NPMRDS-label" onClick={this.getParams}>Load Data</div>
                    </div>
                </div>
            </section>
        );
    }
});

module.exports = ControlPanel;
