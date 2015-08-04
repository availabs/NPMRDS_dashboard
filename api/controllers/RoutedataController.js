var BIGquery = require("../../custom_modules/BigQuery")(),
    fs = require("fs"),
    // zlib = require("zlib"),
    GzipCacher = require("../../custom_modules/GzipCacher")();

module.exports = {
    getBriefMonthlyHours: function(req, res) {
        var tmc_array = req.param("tmc_array");

        if (!Array.isArray(tmc_array)) {
            try {
                tmc_array = JSON.parse(tmc_array);
            }
            catch(e) {
                res.badRequest("You must send an array of TMC codes.");
            }
        }
        var sql = "SELECT tmc, integer(date/100) as month, integer(epoch/12) as hour, sum(travel_time_all) as sum, count(*) as count "+
            "FROM [HERE_traffic_data.HERE_NY] AS here "+
            "WHERE tmc in ("+tmc_array.map(function(d) { return "'"+d+"'"; })+") "+
            "GROUP BY tmc, month, hour, travel_time_all";

        var id = "/routes/brief/monthly/hours/"+JSON.stringify(TMCSort(tmc_array));
        GzipCacher.find(id, function(err, data) {
            if (err) {
                res.serverError(err);
            }
            else if (!data) {
                BIGquery(sql, function(err, rslt) {
                    if (err) {
                        res.serverError(err);
                    }
                    else {
                        rslt = BIGquery.parseResult(rslt);

                        res.ok(rslt);

                        GzipCacher.cache(id, rslt);
                    }
                })
            }
            else {
                res.ok(data);
            }
        })
    },
    getBriefData: function(req, res) {
        var date = req.param("date"),
            hours = req.param("hours"),
            weekdays = req.param("weekdays"),
            tmcArray = req.param("tmcArray");

        if (!Array.isArray(tmcArray)) {
            try {
                tmcArray = JSON.parse(tmcArray);
            }
            catch(e) {
                res.badRequest("You must send an array of TMC codes in JSON format.");
            }
        }

        var monthRegex = /^\d{6}$/,
            dayRegex = /^\d{8}$/;

        if (date.toLowerCase() === "recent") {
            var resolution = "month";
            date = "(SELECT INTEGER(date/100) AS recent FROM [HERE_traffic_data.HERE_NY] ORDER BY date DESC LIMIT 1)";
        }
        else if (monthRegex.test(date)) {
            var resolution = "month";
        }
        else if (dayRegex.test(date)) {
            var resolution = "day";
        }

        var _RESOLUTION_,
            _DATE_,
            _HOURS_ = "";

        weekdays = weekdays || ["monday", "tuesday", "wednesday", "thursday", "friday"];

        var sql = "SELECT tmc, _RESOLUTION_ AS resolution, sum(travel_time_all) AS sum, count(*) AS count "+
                    "FROM [HERE_traffic_data.HERE_NY] "+
                    "WHERE _DATE_ = "+date+
                    " AND tmc IN (" +tmcArray.map(function(d) { return "'"+d+"'"; }).join()+ ") "+
                    "AND weekday IN (" +weekdays.map(function(d) { return "'"+d+"'"; }).join()+ ") "+
                    "_HOURS_ "+
                    "GROUP BY tmc, resolution, travel_time_all";

        switch (resolution) {
            case "month":
                _RESOLUTION_ = "date";
                _DATE_ = "INTEGER(date/100)";
                break;

            case "day":
                _RESOLUTION_ = "INTEGER(epoch/12)";
                _DATE_ = "date";
                break;

            default:
                res.badRequest("Invalid date parameter supplied.");
                return;
        }

        if (hours) {
            _HOURS_ = "AND epoch >= " +hours[0]+ " AND epoch < " +hours[1];
        }

        sql = sql.replace("_RESOLUTION_", _RESOLUTION_)
                    .replace("_DATE_", _DATE_)
                    .replace("_HOURS_", _HOURS_);

        BIGquery(sql, function(err, rslt) {
            if (err) {
                res.serverError(err);
            }
            else {
                res.ok(BIGquery.parseResult(rslt));
            }
        })
    }
}

function TMCSort(tmcArray) {
    var regex = /\d{3}([NnPp])(\d{5})/
    return tmcArray.sort(function(a, b) {
        var aMatch = regex.exec(a),
            bMatch = regex.exec(b);

        if (aMatch[1].toLowerCase() != bMatch[1].toLowerCase()) {
            return aMatch[1] == "N" ? -1 : 1;
        }
        return +aMatch[2] - +bMatch[2];
    })
}

// var Readable = require('stream').Readable;
//
// function ReadStream(buf, opts) {
//     if (!(this instanceof ReadStream)) return new ReadStream(buf, opts);
//
//     Readable.call(this, opts);
//
//     this.maxPush = 4096;
//     this.data = buf;
//     this.pos = 0;
// }
// ReadStream.prototype = Object.create(Readable.prototype);
// ReadStream.prototype.constructor = ReadStream;
//
// ReadStream.prototype._read = function() {
//     this.push(this.data.slice(this.pos, this.pos+this.maxPush));
//     this.pos += this.maxPush;
//     if (this.pos >= this.data.length) {
//         this.push(null);
//     }
// }
