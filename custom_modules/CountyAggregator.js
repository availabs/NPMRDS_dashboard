var CacheManager = require("./CacheManager"),
    BIGquery = require("./BigQuery"),
    TopologyBuilder = require("./TopologyBuilder");

function CountyAggregator() {
    var bigQuery = BIGquery(),
        cacheManager = CacheManager(),
        topologyBuilder = TopologyBuilder();

    function aggregator(error, res, working, topologySet) {
        if (error) {
            res.send({status:500, error:error, msg:"OOPS! Something went wrong!"});
            return;
        }
        if (!working) {
            res.send(topologySet);
            //makeBigQuery(topologySet, res);
        }
    }

    aggregator.query = function(FIPS, res) {
        var fips,
            topologySet = [];

        while (FIPS.length) {
            fips = FIPS.pop();
            cacheManager.get(fips, function(error, result) {
                if (error) {
                    aggregator(error);
                    return;
                }
                else if (!result.length) {
                    topologyBuilder(fips, function(error, topology) {
                        topologySet.push(topology);
                        aggregator(error, res, FIPS.length, topologySet);
                        cacheManager.cache(fips, topology);
                    })
                }
                else {
                    topologySet.push(JSON.parse(result[0].links));
                    aggregator(error, res, FIPS.length, topologySet);
                    cacheManager.updateCount(fips, result[0].requests+1);
                }
            });
        }
    }
    
    return aggregator;

    function makeBigQuery(topologySet, res) {
        var links = [],
            linkIDs = new Object(null);

        topologySet.forEach(function(topology) {
            topology.objects.geo.geometries.forEach(function(geomObject) {
                if (!(geomObject.properties.linkID in linkIDs)) {
                    linkIDs[geomObject.properties.linkID] = [];
                    links.push(geomObject.properties.linkID);
                }
                linkIDs[geomObject.properties.linkID].push(geomObject.properties);
            })
        })
        var sql = "SELECT lut.link_id, avg(here.travel_time_all) as travel_time "+
                    "FROM [HERE_traffic_data.HERE_NY] AS here "+
                        "JOIN EACH [NPMRDS_LUT.NPMRDS_LUT] AS lut "+
                        "ON here.TMC = lut.tmc "+
                    "WHERE lut.link_id IN ("+links.join()+") "+
                    "GROUP BY lut.link_id;";

        bigQuery(sql, function(error, result) {
            if (error) {
                console.log(error);
                return;
            }
            processBigQuery(result, linkIDs, function() { console.log("sending topology"); res.send(topologySet); });
        });
    }

    function processBigQuery(result, linkIDs, cb) {
        if (result.rows) {
            result.rows.forEach(function(row, i) {
                var linkID = row.f[0].v,
                    //tmc = row.f[1].v,
                    travelTime = row.f[1].v;

                linkIDs[linkID].forEach(function(geomObject) {
                    //geomObject.tmc = tmc;
                    geomObject.travelTime = travelTime;
                    geomObject.congestion = travelTime / geomObject.length;
                })
            })
        }
        cb();
    }
}

module.exports = CountyAggregator;