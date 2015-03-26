var CacheManager = require("./CacheManager"),
	TopologyBuilder = require("./TopologyBuilder"),
    BIGquery = require("./BigQuery");

function StateManager() {
	var topologyBuilder = TopologyBuilder(),
        cacheManager = CacheManager(),
        bigQuery = BIGquery();

	function manager(fips, bounds, res) {
        cacheManager.get(fips, function(error, result) {
            if (error) {
            	console.log("state cache error")
                return aggregator(error);
            }
            else if (!result.length) {
            	console.log("building state topology")
		        topologyBuilder(fips, function(error, topology) {
		            if (error) {
		                res.send({status: 500, error: "Internal server error"});
		                console.log(error);
		                return;
		            }
		            cacheManager.cache(fips, topology);
		            makeBigQuery(topology, bounds, res);
		        })
            }
            else {
            	makeBigQuery(JSON.parse(result[0].links), bounds, res);
                cacheManager.updateCount(fips, result[0].requests+1);
            }
        })
	}

	return manager;

	function makeBigQuery(topology, bounds, res) {
        var linkIDs = new Object(null);

        topology.objects.geo.geometries.forEach(function(geomObject) {
            if (!(geomObject.properties.linkID in linkIDs)) {
                linkIDs[geomObject.properties.linkID] = [];
            }
            linkIDs[geomObject.properties.linkID].push(geomObject.properties);
        })
        var sql = "SELECT lut.link_id, avg(here.travel_time_all) as travel_time "+
                    "FROM [HERE_traffic_data.HERE_NY] AS here "+
                        "JOIN EACH [NPMRDS_LUT.NPMRDS_LUT] AS lut "+
                        "ON here.TMC = lut.tmc "+
                    // "WHERE here.date >= 1002014 "+
                    // "AND here.date <= 12312014 "+
                    "GROUP BY lut.link_id;";

        bigQuery(sql, function(error, result) {
	        if (error) {
	            console.log(error);
	            return;
	        }
	        if (result.rows) {
console.log("big query rows:", result.rows.length);
	            result.rows.forEach(function(row, i) {
	                var linkID = row.f[0].v,
	                    //tmc = row.f[1].v,
	                    travelTime = row.f[1].v;

	                if (linkID in linkIDs) {
		                linkIDs[linkID].forEach(function(geomObject) {
		                    //geomObject.tmc = tmc;
		                    geomObject.travelTime = travelTime;
		                    geomObject.congestion = travelTime / geomObject.length;
		                })
	                }
	            })
	        }
	        res.send(topology);
	        console.log("sent state topology");
        });
	}
}

module.exports = StateManager;