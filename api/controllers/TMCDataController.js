var BIGquery = require("../../custom_modules/BigQuery")(),
	dataBuilder = TMCDataBuilder();

module.exports = {
	getTMCData: function(req, res) {
		var TMCs = JSON.parse(req.param("id"));

		if (!TMCs) {
			res.badRequest("Missing required parameter: TMC code");
			return;
		}
console.log("TMC data requested for", TMCs);

		if (!Array.isArray(TMCs)) {
			TMCs = [TMCs];
		}

		dataBuilder(TMCs, function(error, result) {
			if (error) {
				res.serverError(error);
			}
			else {
console.log("Sending TMC data for", TMCs);
				res.send(result);
			}
		})
	},

	TMClookup: function(req, res) {
		var links = req.param("links");

		if (!links || !Array.isArray(links)) {
			res.badRequest("Must include an array of linkIDs");
			return;
		}

		var sql = "SELECT lut.tmc AS tmc, lut.dir AS linkDir, attr.direction AS travelDir "+
		            "FROM [NPMRDS_LUT.NPMRDS_LUT] AS lut "+
		            "JOIN EACH [NPMRDS_LUT.TMC_ATTRIBUTES] AS attr ON lut.tmc = attr.tmc "+
		            "WHERE lut.link_id IN ("+ links.join() +") "+
		            "GROUP BY tmc, linkDir, travelDir;",
		    response = {};

		BIGquery(sql, function(error, result) {
			if (error) {
				res.serverError(error);
			}
			else {
				result.rows.forEach(function(row) {
					response[row.f[0].v] = { linkDir: row.f[1].v, travelDir: row.f[2].v };
				});

				res.send(response);
			}
		});
	},

    _config: {}
};

function TMCDataBuilder() {
	function builder(tmc, cb) {
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
				return;
			}
			cb(error, BIGquery.parseResult(result));
		});
	}

	return builder;
}