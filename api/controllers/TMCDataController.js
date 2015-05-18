var BIGquery = require("../../custom_modules/BigQuery")(),
	dataBuilder = TMCDataBuilder();

module.exports = {
	getTMCData: function(req, res) {
		var TMCs = req.param("id");

		if (!TMCs) {
			res.send({status: 404, error: "Missing required parameter: TMC code"});
			return;
		}
console.log("TMC data requested for", TMCs);

		if (!Array.isArray(TMCs)) {
			TMCs = [TMCs];
		}

		var response = {},
			num = 0;

		makeRequest(0);

		function makeRequest(i) {
console.log("sending query for", TMCs[i]);
			dataBuilder(TMCs[i], function(error, result, tmc) {
				++num;
				if (error) {
		console.log("error", error);
					res.send(error, 500);
					return
				}
				response[tmc] = result;

				if (num == TMCs.length) {
console.log("sending TMC data for", TMCs);
					res.send(response);
				}
			})
			if (++i < TMCs.length) {
				setTimeout(makeRequest, 250, i);
			}
		}
	},

    _config: {}
};

function TMCDataBuilder() {
	function builder(tmc, cb) {
		var sql = "SELECT travel_time_all, travel_time_truck, date, epoch, distance, weekday "+
			"FROM [HERE_traffic_data.HERE_NY] AS here "+
			"JOIN EACH [NPMRDS_LUT.TMC_ATTRIBUTES] AS lut on here.tmc = lut.tmc "+
			"WHERE here.tmc = '"+tmc+"' ";

		BIGquery(sql, function(error, result) {
			if (error) {
				cb({error:error, status:500});
				return;
			}
console.log("completed query for", tmc);
			cb(error, BIGquery.parseResult(result), tmc);
		});
	}

	return builder;
}