var cacheManager = require("../../custom_modules/CacheManager")(),
    topologyBuilder = require("../../custom_modules/TopologyBuilder")();

module.exports = {

    getCountyRoads: function(req, res) {
/**
 * This route returns an array of topology objects of links for each requested county.
 */
        // get the fips parameter
        var FIPS = req.param('id') || req.param('idset');

        // put fips into an array if it is not an array
        if (!Array.isArray(FIPS)) {
            FIPS = [FIPS];
        }

        // check to ensure all fips codes are length 5
        if (!FIPS.reduce(function(prev, curr) { return prev && curr.length == 5; }, true)) {
            return res.badRequest('FIPS county codes must be 5 digits in length.');
        }

console.log("topology requested for: "+FIPS);
console.time("sending topology for: "+FIPS);

        var topologySet = [];

        FIPS.forEach(function(fips) {
            cacheManager.get(fips, function(error, result) {
                if (error) {
                    res.serverError(error);
                }
                else if (!result.length) {
                    topologyBuilder(fips, function(error, topology) {
                        topologySet.push(topology);
                        checkDone();
                        cacheManager.cache(fips, topology);
                    })
                }
                else {
                    topologySet.push(JSON.parse(result[0].links));
                    checkDone();
                    cacheManager.updateCount(fips);
                }
            });
        })

        function checkDone() {
            if (topologySet.length == FIPS.length) {

console.timeEnd("sending topology for: "+FIPS);
                res.ok(topologySet);
            }
        }
    },

    getStateRoads: function(req, res) {
/**
 * This route returns a topology object of links for the requested state.
 * Use with caution, as the amount of data returned is massive.
 */
        var fips = req.param("id");

        // check to ensure fips code is length 2
        if (!fips.length == 2) {
            return res.badRequest('FIPS state codes must be 2 digits in length.');
        }

console.log("topology requested for:", fips);
console.time("finished: "+fips);

        cacheManager.get(fips, function(error, result) {
            if (error) {
                res.serverError(error);
            }
            else if (!result.length) {
                topologyBuilder(fips, function(error, topology) {
                    res.ok(topology);
                    cacheManager.cache(fips, topology);
                })
            }
            else {
                res.ok(JSON.parse(result[0].links));
                cacheManager.updateCount(fips);
            }
console.timeEnd("finished: "+fips);
        });
    },

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to GeographyController)
     */
    _config: {}
};
