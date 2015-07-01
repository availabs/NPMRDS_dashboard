/**
This controller retrieves TMC data from the NPMRDS talbes in BigQuery.
*/

var Builder = require("../../custom_modules/UsageDataBuilder")();

module.exports = {
	getStateData: function(req, res) {
		var request = {
			type: "state",
			fips: req.param("id"),
			dateBounds: req.param("dateBounds"),
			timeBounds: req.param("timeBounds"),
			resolution: req.param("resolution")
		};

        if (!request.fips || request.fips.length != 2) {
            return res.badRequest('FIPS state codes must be 2 digits in length.');
        }

console.log("data requested for:", request.fips);

		Builder(request, function(error, result) {
			if (error) {
				res.serverError(error);
				return;
			}
console.log("sending data for ", request.fips);
			res.ok(result);
		});
	},

	getCountyData: function(req, res) {
	/*
	This route is used to get TMC data for the requested array of linkIDs.
	The required route parameter: id is the state FIPS code used to query
	the correct table.
	*/
		var request = {
			type: "county",
			fips: req.param("id"),
			dateBounds: req.param("dateBounds"),
			timeBounds: req.param("timeBounds"),
			resolution: req.param("resolution"),
			links: req.param("links"),
			weekdays: req.param("weekdays")
		};
		
console.log("data requested for:", request.fips);

		Builder(request, function(error, result) {
			if (error) {
				res.serverError(error);
				return;
			}
console.log("sending data for ", request.fips);
			res.ok(result);
		});
	}
};

