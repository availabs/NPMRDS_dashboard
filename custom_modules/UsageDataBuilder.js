/*
This object is used by the UsagedataController for retrieving usage data for a requested array of linkIDs.
*/

var BIGquery = require("./BigQuery")();

function UsageDataBuilder() {
	var DEFUALT_WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

	function builder(request, cb) {
	/*
	request: object holding all parameters for requested data.
	cb: callback function executed upon build completion.
	*/
		request.weekdays = request.weekdays || DEFUALT_WEEKDAYS;
		request.weekdays = request.weekdays || DEFUALT_WEEKDAYS;

		if (request.type == "state") {
			var sql = makeStateSQL(request);
		}
		else {
			var sql = makeCountySQL(request);
		}

        BIGquery(sql, function(error, result) {
        	if (error) {
        		cb(error);
        	}
        	else {
        		cb(error, processResult(request, result));
        	}
        });
	}

	return builder;

	function processResult(request, result) {
	/*
	This helper function receives the BigQuery result and parses it into a
	more user friendly format.

	request: object holding all parameters for requested data.
	result: the result form BigQuery.

	return: an array of data points. Each point represents a time grouping
		as specified by the request resolution. Each point consists of an
		object with keys point and links: {point: value, links: {}}. The point key
		contains the specific data point and the links key contains an object
		of link IDs as keys. Each of these linkIDs is itself an object that
		contains a key for each TMC code associated with the linkID. Each TMC
		object contains the aggegated data for the specified data point.

	example output:
	response = [
		{
			point: resolutionPoint1,							<-- the specific resolution point
			links: {
				123456: {										<-- linkID
					120P123456: {travel_time_all: 120, ...}		<-- TMC code with data
				},
				987654: {										<-- likID
					120P654321: {travel_time_all: 50, ...}		<-- TMC code with data
					120N654321: {travel_time_all: 220, ...}		<-- TMC code with data
				},
				...
			}
		},
		{
			point: resolutionPoint2,
			links: {
				...
			}
		},
		...
	]
	*/
		var response = [],
			schemaMap = {},
			resolution = request.resolution || "all";

		result.schema.fields.forEach(function(field, i) {
			schemaMap[field.name] = i;
		})

		var resolutionPoints = {};

		result.rows.forEach(function(row) {
			var point = row.f[schemaMap[request.resolution]] ? row.f[schemaMap[request.resolution]].v : "all",
				linkID = row.f[schemaMap["link_id"]].v,
				tmc = row.f[schemaMap["tmc"]].v,
				travelTime = +row.f[schemaMap["travel_time"]].v,
				length = +row.f[schemaMap["length"]].v,
				travelDirection = row.f[schemaMap["travel_direction"]].v,
				linkDirection = row.f[schemaMap["link_direction"]].v,
				freeflow = +row.f[schemaMap["freeflow"]].v;

			if (!(point in resolutionPoints)) {
				resolutionPoints[point] = {
					point: point,
					links: {}
				}
				response.push(resolutionPoints[point]);
			}

			if (!(linkID in resolutionPoints[point].links)) {
				resolutionPoints[point].links[linkID] = {};
			}

			var data = {
				travelTime: travelTime,
				length: length,
				travelDirection: travelDirection,
				linkDirection: linkDirection,
				freeflow: freeflow
			}
			resolutionPoints[point].links[linkID][tmc] = data;
		})

		return response;
	}

	function makeCountySQL(request) {
	/*
	This helper function receives the request object and dynamically
	generates an SQL call from it.

	request: object holding all parameters for requested data.
	*/
        var sql = "SELECT lut.link_id AS link_id, here.tmc AS tmc, avg(here.travel_time_all) AS travel_time, "+
        			"atts.distance AS length, atts.direction AS travel_direction, lut.dir AS link_direction, "+
        			" ff.free_flow AS freeflow "+
        			"_RESOLUTION_ "+
                    "FROM [HERE_traffic_data.HERE_NY] AS here "+
                        "JOIN EACH [NPMRDS_LUT.NPMRDS_LUT] AS lut ON here.TMC = lut.tmc "+
                        "JOIN EACH [NPMRDS_LUT.TMC_ATTRIBUTES] AS atts ON here.TMC = atts.tmc "+
						"JOIN (SELECT here.tmc AS tmc, NTH(70, QUANTILES(here.travel_time_all)) AS free_flow "+
								"FROM [HERE_traffic_data.HERE_NY] AS here "+
								"JOIN EACH [NPMRDS_LUT.NPMRDS_LUT] AS lut ON here.TMC = lut.tmc "+
								"WHERE lut.link_id IN ("+ request.links.join() +") "+
								"GROUP BY tmc) AS ff ON here.TMC = ff.tmc "+
                    "WHERE lut.link_id IN ("+ request.links.join() +") "+
                    "AND weekday IN ("+request.weekdays.map(function(d) { return "'"+d+"'"; }).join()+")"+
                    "_DATE_BOUNDS_ "+
                    "_TIME_BOUNDS_ "+
                    "GROUP BY _GROUP_BY_;";

        var _RESOLUTION_ = "",
        	_DATE_BOUNDS_ = "",
        	_TIME_BOUNDS_ = "",
        	_GROUP_BY_ = "link_id, tmc";

        if (request.dateBounds) {
        	if (request.dateBounds.length == 2) {
	        	_DATE_BOUNDS_ = "AND date >= "+request.dateBounds[0]+
	        						" AND date <= "+request.dateBounds[1];
	        }
	        else {
	        	_DATE_BOUNDS_ = "AND date = "+request.dateBounds[0];
	        }
        }

        if (request.timeBounds) {
        	if (request.timeBounds.length == 2) {
	        	_TIME_BOUNDS_ = "AND epoch >= "+Math.floor(request.timeBounds[0]/5)+
	        						" AND epoch < "+Math.floor(request.timeBounds[1]/5);
	        }
	        else {
	        	_TIME_BOUNDS_ = "AND epoch = "+request.timeBounds[0]/5;
	        }
        }

        switch (request.resolution) {
        	case "year":
	        	_RESOLUTION_ = ", INTEGER(date/10000) AS year";
	        	_GROUP_BY_ = "year, "+_GROUP_BY_;
	        	break;
        	case "month":
	        	_RESOLUTION_ = ", INTEGER(date/100)%100 AS month";
	        	_GROUP_BY_ = "month, "+_GROUP_BY_;
	        	break;
    		case "day":
	        	_RESOLUTION_ = ", date%100 AS day";
	        	_GROUP_BY_ = "day, "+_GROUP_BY_;
	        	break;
	        case "weekday":
	        	_RESOLUTION_ = ", here.weekday AS weekday";
	        	_GROUP_BY_ = "weekday, "+_GROUP_BY_;
	        	break;
    		case "hour":
	        	_RESOLUTION_ = ", INTEGER(epoch/12) AS hour";
	        	_GROUP_BY_ = "hour, "+_GROUP_BY_;
	        	break;
    		case "15-minute":
	        	_RESOLUTION_ = ", INTEGER(epoch/3) AS minute";
	        	_GROUP_BY_ = "minute, "+_GROUP_BY_;
	        	request.resolution = "minute";
	        	break;
    	}

    	_GROUP_BY_ += ", freeflow, travel_direction, length, link_direction"

        return sql.replace("_RESOLUTION_", _RESOLUTION_)
        		.replace("_DATE_BOUNDS_", _DATE_BOUNDS_)
        		.replace("_TIME_BOUNDS_", _TIME_BOUNDS_)
        		.replace("_GROUP_BY_", _GROUP_BY_);
	}

	function makeStateSQL(request) {
        var sql = "SELECT lut.link_id AS link_id, here.tmc AS tmc, avg(here.travel_time_all) AS travel_time, "+
        			"atts.distance AS length, atts.direction AS travel_direction, lut.dir AS link_direction "+
        			"_RESOLUTION_ "+
                    "FROM [HERE_traffic_data.HERE_NY] AS here "+
                        "JOIN EACH [NPMRDS_LUT.NPMRDS_LUT] AS lut ON here.TMC = lut.tmc "+
                        "JOIN EACH [NPMRDS_LUT.TMC_ATTRIBUTES] AS atts ON here.TMC = atts.tmc "+
                    "_DATE_BOUNDS_ "+
                    "_TIME_BOUNDS_ "+
                    "GROUP BY _GROUP_BY_;";

        var _RESOLUTION_ = "",
        	_DATE_BOUNDS_ = "",
        	_TIME_BOUNDS_ = ""
        	_GROUP_BY_ = "link_id, tmc";

        if (request.dateBounds) {
        	if (request.dateBounds.length == 2) {
	        	_DATE_BOUNDS_ = "WHERE date >= "+request.dateBounds[0]+
	        						" AND date <= "+request.dateBounds[1];
	        }
	        else {
	        	_DATE_BOUNDS_ = "WHERE date = "+request.dateBounds[0];
	        }
        }

        if (request.timeBounds) {
        	var connector = request.dateBounds ? "AND" : "WHERE";
        	if (request.timeBounds.length == 2) {
	        	_TIME_BOUNDS_ = connector+" epoch >= "+Math.floor(request.timeBounds[0]/5)+
	        						" AND epoch < "+Math.floor(request.timeBounds[1]/5);
	        }
	        else {
	        	_TIME_BOUNDS_ = connector+" epoch = "+request.timeBounds[0]/5;
	        }
        }

        switch (request.resolution) {
        	case "year":
	        	_RESOLUTION_ = ", date%10000 AS year";
	        	_GROUP_BY_ = "year, "+_GROUP_BY_;
	        	break;
        	case "month":
	        	_RESOLUTION_ = ", INTEGER(date/1000000) AS month";
	        	_GROUP_BY_ = "month, "+_GROUP_BY_;
	        	break;
    		case "day":
	        	_RESOLUTION_ = ", INTEGER(date/10000)%100 AS day";
	        	_GROUP_BY_ = "day, "+_GROUP_BY_;
	        	break;
    		case "hour":
	        	_RESOLUTION_ = ", INTEGER(epoch/12) AS hour";
	        	_GROUP_BY_ = "hour, "+_GROUP_BY_;
	        	break;
    		case "15-minute":
	        	_RESOLUTION_ = ", INTEGER(epoch/3) AS minute";
	        	_GROUP_BY_ = "minute, "+_GROUP_BY_;
	        	request.resolution = "minute";
	        	break;
    	}

    	_GROUP_BY_ += ", travel_direction, length, link_direction"

        return sql.replace("_RESOLUTION_", _RESOLUTION_)
        		.replace("_DATE_BOUNDS_", _DATE_BOUNDS_)
        		.replace("_TIME_BOUNDS_", _TIME_BOUNDS_)
        		.replace("_GROUP_BY_", _GROUP_BY_);
	}
}

module.exports = UsageDataBuilder;
