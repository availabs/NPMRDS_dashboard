"use strict"

var turf = require("turf"),
	HERE_API = require("./HERE_API");

function RouteCreator() {
	var points = [],
		here = HERE_API(),
		routeCollection = {},
		bufferedRoute = {};

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
			bufferedRoute = routeCollection;
			func(null, routeCollection);
		}
		return router;
	}
	router.route = function(r) {
		if (!arguments.length) {
			return { route: routeCollection, buffer: bufferedRoute };
		}
		routeCollection = r;
		bufferedRoute = router.buffer(r);
		return router;
	}
	router.buffer = function(r, dist, units) {
		dist = dist || 5;
		units = units || "feet";
		return turf.buffer(r, dist, units);
	}
	router.intersect = function(r) {
		return turf.intersect(bufferedRoute.features[0], r);
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

		result.response.route[0].leg.forEach(function(leg) {
			leg.link.forEach(function(link) {
				var feature = {
						type: "Feature",
						properties: {
							linkID: link.linkId
						},
						geometry: {
							type: "LineString",
							coordinates: []
						}
					},
					shape = link.shape.map(function(string) {
						return string.split(",").reverse().map(function(d){return +d;});
					});
				feature.geometry.coordinates = shape;
				routeCollection.features.push(feature);
			});
		});
		bufferedRoute = router.buffer(routeCollection);
		return routeCollection;
	}
}

module.exports = RouteCreator;