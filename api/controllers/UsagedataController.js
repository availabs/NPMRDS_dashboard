/**
 * UsagedataController
 *
 * @description :: Server-side logic for managing Usagedatas
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Builder = require("../../custom_modules/UsageDataBuilder")();

module.exports = {
	getStateData: function(req, res) {
		var request = {
			fips: req.param("id"),
			type: "state",
			dateBounds: req.param("dateBounds"),
			timeBounds: req.param("timeBounds"),
			resolution: req.param("resolution")
		};

        if (!request.fips || request.fips.length != 2) {
            return res.send({status: 400, error: 'FIPS state codes must be 2 digits in length.'}, 400);
        }

console.log("data requested for:", request.fips);

		Builder(request, function(error, result) {
			if (error) {
				res.send(error, 500);
				return;
			}
			console.log("sending data for ", request.fips);
			res.send(result);
		});
	},

	getCountyData: function(req, res) {
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
				res.send(error, 500);
				return;
			}
			console.log("sending data for ", request.fips);
			res.send(result);
		});
	}
};

