"use strict"

var d3 = require("d3");

function HERE_API() {
	var app_code = "LHHDRm5y0A8pvPto4gOtUg",
		app_id = "J0eIIcv5ApgGff35leix",
		request = null;

	function here() {
	}
	here.calculateRoute = function(points, options) {
		options = options || {};

		var baseURL = options.baseURL || "http://route.cit.api.here.com",
			path = options.path || "/routing/7.2/",
			resource = "calculateroute",
			format = options.format || ".json",
			mode = options.mode || "fastest;car;traffic:disabled",
			routeAttributes = options.routeAttributes || "none,legs",
			legAttributes = options.legAttributes || "links",
			linkAttributes = options.linkAttributes || "shape,length";

		request = baseURL+path+resource+format+
			"?app_id="+app_id+
			"&app_code="+app_code+
			"&mode="+mode+
			"&routeAttributes="+routeAttributes+
			"&legAttributes="+legAttributes+
			"&linkAttributes="+linkAttributes;

		points.forEach(function(point, i) {
			request += "&waypoint"+i+"=geo!"+point;
		});
		return here;
	}
	here.call = function(func) {
		if (request) {
			d3.json(request, func);
		}
		request = null;
		return here;
	}
	return here;
}

module.exports = HERE_API;