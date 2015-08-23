"use strict"

var d3 = require("d3");

function HERE_API() {
	var app_code = "IA6ej_5mXDRvq9-JvxW7Nw",//"LHHDRm5y0A8pvPto4gOtUg",
		app_id = "3TwdLlcy62MKRJZmjipG",//"J0eIIcv5ApgGff35leix",
		request = null;

	function here() {
	}
	here.calculateRoute = function(points, options) {
		options = options || {};
//http://route.st.nlp.nokia.com/routing/6.2/calculateroute.json
		var baseURL = options.baseURL || "https://route.st.nlp.nokia.com",//"http://route.cit.api.here.com",
			path = options.path || "/routing/6.2",
			resource = "/calculateroute",
			format = options.format || ".json",
			mode = options.mode || "fastest;car;traffic:disabled",
			routeAttributes = options.routeAttributes || "none,legs,shape",
			legAttributes = options.legAttributes || "none,links,length,travelTime",
			linkAttributes = "all";//options.linkAttributes || "sh,le,fc,tm,sl";

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
// console.log("<HERE_API> request",request);
// var req = new XMLHttpRequest(),
// 	handler = getResponseHandler(func);
// req.addEventListener('load', handler);
// req.addEventListener('error', handler);
// req.open("get", request, true);
// req.send();
			//d3.json(request, func);
			d3.xhr("/routes/create")
				.response(function(d) { return JSON.parse(d.responseText); })
				.post(JSON.stringify({url:request}), func);
			request = null;
		}
		return here;
	}
	return here;
}

module.exports = HERE_API;

function getResponseHandler(callback) {
	return function(e) {
		console.log("XHR return", this, e);
		if (this.status == 200) {
			callback(null, JSON.parse(this.responseText));
		}
		else {
			callback("error: "+this.status);
		}
	}
}
