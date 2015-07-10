var BIGquery = require("../../custom_modules/BigQuery")(),
    fs = require("fs");

module.exports = {
    getData: function(req, res) {
        var date = +req.param("date"),
            tmc_array = req.param("tmc_array");

        if (!Array.isArray(tmc_array)) {
            try {
                tmc_array = JSON.parse(tmc_array);
            }
            catch(e) {
                res.badRequest("You must send an array of TMC codes.");
            }
        }
        var sql = makeSQL(date, tmc_array);
        BIGquery(sql, function(err, rslt) {
            if (err) {
                res.serverError(err);
            }
            else {
                rslt = BIGquery.parseResult(rslt);

                var buf = new Buffer(JSON.stringify(rslt), "utf-8");

                stream = new ReadStream(buf, {encoding: "utf-8"});

                stream.pipe(res);

                //res.ok(rslt);
            }
        })
    }
}

var Readable = require('stream').Readable;

function ReadStream(buf, opts) {
    if (!(this instanceof ReadStream)) return new ReadStream(buf, opts);

    Readable.call(this, opts);

    this.maxPush = 4096;
    this.data = buf;
    this.pos = 0;
}
ReadStream.prototype = Object.create(Readable.prototype);
ReadStream.prototype.constructor = ReadStream;

ReadStream.prototype._read = function() {
    this.push(this.data.slice(this.pos, this.pos+this.maxPush));
    this.pos += this.maxPush;
    if (this.pos >= this.data.length) {
        this.push(null);
    }
}

function makeSQL(date, tmc_array) {
    return "SELECT integer(date/100) AS month, sum(travel_time_all) AS total, count(*) AS num "+
        "FROM [HERE_traffic_data.HERE_NY] "+
        "WHERE date >= " +(date-10000)+ " "+
        "AND weekday NOT IN ('saturday', 'sunday') "+
        "AND tmc IN ("+tmc_array.map(function(d) { return "'"+d+"'"; })+") "+
        "GROUP BY month, travel_time_all;";
}
