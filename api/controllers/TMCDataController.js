/*
This controller is used for retrieving data for TMC codes.
*/

var BIGquery = require("../../custom_modules/BigQuery")(),
	dataBuilder = TMCDataBuilder();

module.exports = {
	getTMCData: function(req, res) {
	/*
	This route is used to receive TMC data for a single TMC or an array of TMCs.

	tmc: this parameter is either a single string for a single TMC or an array of
		TMC strings. If an array is sent it should be sent as a JSON string, e.g. 
		using JSON.stringify(array).

	return: the returned object is a simplified BigQuery object created by
		the BigQuery module. A detailed explanation of what this response
		looks like can be found there in the BigQuery module.
	*/
		var TMCs = JSON.parse(req.param("tmc"));

		if (!Array.isArray(TMCs)) {
			TMCs = [TMCs];
		}

console.log("TMC data requested for", TMCs);

		dataBuilder(TMCs, function(error, result) {
			if (error) {
				res.serverError(error);
			}
			else {
console.log("Sending TMC data for", TMCs);
				res.ok(result);
			}
		})
	},

	TMClookup: function(req, res) {
	/*
	This route is used to retrieve a list of all TMC codes attached to the
		requested link or links.

	links: a single linkID or an array of linkIDs. An array should be sent
		as a JSON string, e.g. using JSON.stringify(array).

	return: an object indexed by TMC codes associated with
		the requested linkIDs. Each TMC index is an object containing
		directional data for the specific link and tmc.
	*/
		var links = JSON.parse(req.param("links"));

		if (!Array.isArray(links)) {
			links = [links];
		}

		var sql = "SELECT lut.tmc AS tmc, lut.dir AS linkDir "+
		            "FROM [NPMRDS_LUT.NPMRDS_LUT] AS lut "+
		            "WHERE lut.link_id IN ("+ links.join() +") "+
		            "GROUP BY tmc, linkDir;";

		BIGquery(sql, function(error, result) {
			if (error) {
				res.serverError(error);
			}
			else {
				res.ok(BIGquery.parseResult(result));
			}
		});
	},

    _config: {}
};

function TMCDataBuilder() {
/*
Tihs module is used to create TMC data requests.
*/
	function builder(tmc, cb) {
	/*
	This function generates a BigQuery query for TMC data.

	tmc: an array of 1 or more TMC codes to receive data for.
	cb: callback function executed upon query completion. The callback
		function should accept (error, result) as parameters.

	result: The data for all of the queried TMCs are combined into a
		single, simplified BigQuery object.
	*/
		var sql = "SELECT travel_time_all, travel_time_truck, date, epoch, distance, weekday, road_name, here.tmc AS tmc "+
			"FROM [HERE_traffic_data.HERE_NY] AS here "+
			"JOIN EACH [NPMRDS_LUT.TMC_ATTRIBUTES] AS lut ON here.tmc = lut.tmc "+
			"WHERE here.tmc __WHERE_CLAUSE__;";

		if (tmc.length == 1) {
			sql = sql.replace("__WHERE_CLAUSE__", "= '"+tmc[0]+"'");
		}
		else {
			sql = sql.replace("__WHERE_CLAUSE__", "IN ("+tmc.map(function(d) { return "'"+d+"'"; })+")");
		}

		BIGquery(sql, function(error, result) {
			if (error) {
				cb(error);
			}
			else {
				cb(error, BIGquery.parseResult(result));
			}
		});
	}

	return builder;
}