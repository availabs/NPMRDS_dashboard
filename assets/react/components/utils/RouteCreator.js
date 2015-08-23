"use strict"

var HERE_API = require("./HERE_API");

function RouteCreator() {
	var points = [],
		here = HERE_API(),
		routeCollection = {};

	function router() {
		if (points.length < 2) {
			return;
		}
		here.calculateRoute(points)
			.call(makeRoute);
		points = [];
	}
	router.points = function(p) {
		if (!arguments.length) {
			return points;
		}
		points = p;
		return router;
	}
	router.call = function(func) {
		if (points.length >= 2) {
			here.calculateRoute(points)
				.call(function(error, result) {
					if (error) {
						func(error);
						return;
					}
					func(error, makeRoute(error, result));
				});
		}
		else {
			routeCollection = {
				type: "FeatureCollection",
				features: []
			}
			func(null, routeCollection);
		}
		return router;
	}
	router.route = function(r) {
		if (!arguments.length) {
			return routeCollection;
		}
		routeCollection = r;
		return router;
	}
	return router;

	function makeRoute(error, result) {
		if (error) {
			console.log(error);
			return;
		}
		routeCollection = {
			type: "FeatureCollection",
			features: []
		}
console.log("<RouteCreator::makeRoute>", result);

		result.Response.Route[0].Leg.forEach(function(leg) {
			leg.Link.forEach(function(link) {
				console.log(link.TMCCodes)
				var feature = {
						type: "Feature",
						properties: {
							linkID: link.LinkId,
							length: link.Length,
							speedLimit: link.SpeedLimit
						},
						geometry: {
							type: "LineString",
							coordinates: []
						}
					},
					shape = link.Shape.map(function(string) {
						return string.split(",").reverse().map(function(d){return +d;});
					});
				feature.geometry.coordinates = shape;
				routeCollection.features.push(feature);
			});
		});

		return routeCollection;
	}
}

module.exports = RouteCreator;
