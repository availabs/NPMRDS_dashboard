var BIGquery = require("../../custom_modules/BigQuery")(),
	dataBuilder = TMCDataBuilder();

module.exports = {
	getTMCData: function(req, res) {
		var TMCs = req.param("id");

		if (!TMCs) {
			res.send({status: 404, error: "Missing required parameter: TMC code"});
			return;
		}
console.log("received request for TMCdata for", TMCs);

		if (!Array.isArray(TMCs)) {
			TMCs = [TMCs];
		}

		var response = {};
		for (var i = 0; i < TMCs.length; i++) {
			var tmc = TMCs[i];

			dataBuilder(TMCs[i], function(error, result) {
				if (error) {
console.log("error", error);
					res.send(error, 500);
					return
				}
				response[tmc] = result;

				if (i == TMCs.length) {
console.log("sending TMCdata for", TMCs);
					res.send(response);
				}
			})
		}
	},

    _config: {}
};

function TMCDataBuilder() {
	function builder(tmc, cb) {
		var response = {},
			totalJobs = 2,
			completedJobs = 0;

		var sql = "SELECT "+
				"nth(500, quantiles(travel_time_all,1000)) AS median, "+
		        "nth(800, quantiles(travel_time_all,1000)) AS eightieth, "+
		        "nth(950, quantiles(travel_time_all,1000)) AS nintyfifth, "+
		        "avg(travel_time_all) AS avgTime, "+
		        "stddev(travel_time_all) AS stdTime, "+
		        "avg(distance/(travel_time_all/3600)) AS avgSpeed, "+
		        "stddev(distance/(travel_time_all/3600)) AS stdSpeed, "+
		        "distance "+
			"FROM [HERE_traffic_data.HERE_NY] AS here "+
			"JOIN EACH [NPMRDS_LUT.TMC_ATTRIBUTES] AS lut on here.tmc = lut.tmc "+
			"WHERE here.tmc = '"+tmc+"' "+
			"AND weekday != 'saturday' "+
			"AND weekday != 'sunday' "+
			"GROUP BY distance";

		BIGquery(sql, function(error, result) {
			completedJobs++;
			if (error) {
				cb({error:error, status:500});
				return;
			}
console.log("completed query for all data")
			response["all"] = BIGquery.parseResult(result);
			if (completedJobs == totalJobs) {
				cb(error, response);
			}
		});

		sql = "select  NTH(500, quantiles(travel_time_all,1000)) as median, "+
		        "NTH(800, quantiles(travel_time_all,1000)) as eightieth, "+
		        "NTH(950, quantiles(travel_time_all,1000)) as nintyfifth, "+
		        "avg(travel_time_all) as avgTime, "+
		        "stddev(travel_time_all) as stdTime, "+
		        "avg(distance/(travel_time_all/3600)) as avgSpeed, "+
		        "stddev(distance/(travel_time_all/3600)) as stdSpeed, "+
		        "distance, "+
		        "INTEGER(date/10000) AS year, "+
		        "INTEGER(date/100)%100 AS month, "+
		        "INTEGER(date%100) AS day, "+
		        "epoch "+
			"from [HERE_traffic_data.HERE_NY] as here "+
			"join each [NPMRDS_LUT.TMC_ATTRIBUTES] as lut on here.tmc = lut.tmc "+
			"where here.tmc = '"+tmc+"' "+
			"AND weekday != 'saturday' "+
			"AND weekday != 'sunday' "+
			"group by year, month, day, epoch, distance";

		BIGquery(sql, function(error, result) {
			completedJobs++;
			if (error) {
				cb({error:error, status:500});
				return;
			}
console.log("completed query for monthly data")
			response["monthly"] = BIGquery.parseResult(result);
			if (completedJobs == totalJobs) {
				cb(error, response);
			}
		});
	}

	function processResult(result, resolution) {
		var row = result.rows[0];
	}
	return builder;
}
