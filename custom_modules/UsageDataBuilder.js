var BIGquery = require("./BigQuery")();

function UsageDataBuilder() {

	function builder(request, cb) {
		var sql;
		if (request.type == "state") {
			sql = makeStateSQL(request, cb);
		}
		else {
			sql = makeCountySQL(request, cb);
		}
//console.log(sql.replace(/\([\w,]*\)/, "(...)"))
//console.log(sql)
        BIGquery(sql, function(error, result) {
        	if (error) {
        		cb(error);
        	}
        	else if (!result["jobComplete"]) {
        		waitForJob(request, result, cb);
        		cb({ msg: "Problem with BigQuery", result: result });
        	}
        	else {
        		cb(error, processResult(request, result));
        	}
        });
	}

	return builder;

	function waitForJob(request, result, cb) {
		BIGquery.checkJob(result["jobReference"]["jobId"], function(error, status) {
			var state = status["status"]["state"];
			if (state == "RUNNING") {
				setTimeout(waitForJob, [5000, request, result, cb]);
				return
			}
			
		});
	}

	function processResult(request, result) {
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

	function makeCountySQL(request, cb) {
		request.weekdays = request.weekdays.map(function(d) { return "'"+d+"'"; });

        var sql = "SELECT lut.link_id AS link_id, here.tmc AS tmc, avg(here.travel_time_all) AS travel_time, "+
        			"atts.distance AS length, atts.direction AS travel_direction, lut.dir AS link_direction, "+
        			" min(here.travel_time_all) AS freeflow "+
        			"_RESOLUTION_ "+
                    "FROM [HERE_traffic_data.HERE_NY] AS here "+
                        "JOIN EACH [NPMRDS_LUT.NPMRDS_LUT] AS lut ON here.TMC = lut.tmc "+
                        "JOIN EACH [NPMRDS_LUT.TMC_ATTRIBUTES] AS atts ON here.TMC = atts.tmc "+
                    "WHERE lut.link_id IN ("+ request.links.join() +") "+
                    "AND weekday IN ("+request.weekdays.join()+")"+
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
    		case "minute":
	        	_RESOLUTION_ = ", INTEGER(epoch/3) AS minute";
	        	_GROUP_BY_ = "minute, "+_GROUP_BY_;
	        	break;
    	}

    	_GROUP_BY_ += ", travel_direction, length, link_direction"

        return sql.replace("_RESOLUTION_", _RESOLUTION_)
        		.replace("_DATE_BOUNDS_", _DATE_BOUNDS_)
        		.replace("_TIME_BOUNDS_", _TIME_BOUNDS_)
        		.replace("_GROUP_BY_", _GROUP_BY_);
	}

	function makeStateSQL(request, cb) {
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
    		case "minute":
	        	_RESOLUTION_ = ", INTEGER(epoch/3) AS minute";
	        	_GROUP_BY_ = "minute, "+_GROUP_BY_;
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