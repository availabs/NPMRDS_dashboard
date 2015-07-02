/**
This controller retrieves TMC data from the NPMRDS talbes in BigQuery.
*/

var Builder = require("../../custom_modules/UsageDataBuilder")();

module.exports = {
	getStateData: function(req, res) {
	/*
	This route is used to get TMC data for the entire road system of a state.

	id: is the state FIPS code used to query the correct table.
	dateBounds: optional parameter. Should be an a rray of 1 or 2 dates
		in the form: yyyymmdd
	timeBounds: optional parameter. Should be an array of 1 or 2 integer
		representing minutes since 12:00 am.
	weekdays: optional parameter. Specifies weekdays to receive data from.

##############
NOTE
##############

This route may be removed since the amount of data it returns is quite large.
##############
	*/
		var request = {
			type: "state",
			fips: req.param("id"),
			dateBounds: req.param("dateBounds"),
			timeBounds: req.param("timeBounds"),
			weekdays: req.param("weekdays")
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

	id: is the state FIPS code used to query the correct table.
	links: the array of linkIDs to retrieve data for.
	dateBounds: optional parameter. Should be an a rray of 1 or 2 dates
		in the form: yyyymmdd
	timeBounds: optional parameter. Should be an array of 1 or 2 integer
		representing minutes since 12:00 am.
	resolution: optional parameter. Specifies query grouping.
	weekdays: optional parameter. Specifies weekdays to receive data from.
	*/
		var request = {
			type: "county",
			fips: req.param("id"),
			links: req.param("links"),
			dateBounds: req.param("dateBounds"),
			timeBounds: req.param("timeBounds"),
			resolution: req.param("resolution"),
			weekdays: req.param("weekdays")
		};
		
console.log("TMC usage data requested for:", request.fips);

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

