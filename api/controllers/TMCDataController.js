var BIGquery = require("../../custom_modules/BigQuery")();

module.exports = {
	getTMCData: function(req, res) {
		var TMCs = req.param("id");

		if (!TMCs) {
			res.send({status: 404, error: "Missing required parameter: TMC code"});
			return;
		}

		if (!Array.isArray(TMCs)) {
			TMCs = [TMCs];
		}

		var response = {};
		for (var i = 0; i < TMCs.length; i++) {
			TMCDataBuilder(TMCs[i], function(error, result) {
				if (error) {
					res.send(error, 500);
					return
				}
				response[TMCs[i]] = result;
				if (i == TMCs.length-1) {
					res.send(response);
				}
			})
		}
	},

    _config: {}
};

function TMCDataBuilder() {
	function builder(tmc, cb) {
		var response = {};

		var sql = "select "+
				"nth(500, quantiles(travel_time_all,1000)) median, "+
		        "nth(800, quantiles(travel_time_all,1000)) eightieth, "+
		        "nth(950, quantiles(travel_time_all,1000)) nintyfifth, "+
		        "avg(travel_time_all) as avgTime, "+
		        "stddev(travel_time_all) as stdTime, "+
		        "avg(distance/travel_time_all) as avgSpeed, "+
		        "stddev(distance/travel_time_all) as stdSpeed, "+
		        "distance "+
			"from [HERE_traffic_data.HERE_NY] as here "+
			"join each [NPMRDS_LUT.TMC_ATTRIBUTES] as lut on here.tmc = lut.tmc "+
			"where here.tmc = '"+tmc+"' "+
			"group by distance";

		BIGquery(sql, function(error, result) {
			if (error) {
				cb({error:error, status:500});
				return
			}
			var row = result.row.pop();
			response["all_time"] = processResult(result);
		})

		sql = "select  NTH(500, quantiles(travel_time_all,1000)) median, "+
		        "NTH(800, quantiles(travel_time_all,1000)) eightieth, "+
		        "NTH(950, quantiles(travel_time_all,1000)) nintyfifth, "+
		        "avg(travel_time_all) as avgTime, "+
		        "stddev(travel_time_all) as stdTime, "+
		        "avg(distance/travel_time_all) as avgSpeed, "+
		        "stddev(distance/travel_time_all) as stdSpeed, "+
		        "distance, "+
		        "INTEGER(date/10000) AS year, "+
		        "INTEGER(date/100)%100 AS month "+
			"from [HERE_traffic_data.HERE_NY] as here "+
			"join each [NPMRDS_LUT.TMC_ATTRIBUTES] as lut on here.tmc = lut.tmc "+
			"where here.tmc = '"+tmc+"' "+
			"group by year, month, distance";

		BIGquery(sql, function(error, result) {
			if (error) {
				cb({error:error, status:500});
				return
			}
			var row = result.row.pop();
			response["all_time"] = process
		})
	}

	function processResult(result, resolution) {

	}
	return builder;
}
