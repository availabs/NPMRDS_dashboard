/**
 * GeographyController
 *
 * @module      :: Controller
 * @description :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var cacheManager = require("../../custom_modules/CacheManager")(),
    topologyBuilder = require("../../custom_modules/TopologyBuilder")();

module.exports = {

    /**
     * This route returns an array of topology objects for links for each requested county.
     */
    getCountyTopology: function(req, res) {
        // get the fips parameter
        var FIPS = req.param('id') || req.param('idset');

        if (!FIPS) {
            return res.send({status: 400, error: 'Must include at least 1 FIPS code.'});
        }

        // put fips into an array if it is not an array
        if (!Array.isArray(FIPS)) {
            FIPS = [FIPS];
        }

        // check to ensure all fips codes are length 5
        if (!FIPS.reduce(function(prev, curr) { return prev && curr.length == 5; }, true)) {
            return res.send({status: 400, error: 'FIPS county codes must be 5 digits in length.'});
        }

console.log("topology requested for: "+FIPS);
console.time("sending topology for: "+FIPS);

        var topologySet = [];

        FIPS.forEach(function(fips) {
            cacheManager.get(fips, function(error, result) {
                if (error) {
                    res.send({status:500, error:error, msg:"OOPS! Something went wrong!"});
                    return;
                }
                if (!result.length) {
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
                res.send(topologySet);
            }
        }
    },

    getStateTopology: function(req, res) {
        var fips = req.param("id");

        // check to ensure fips code is length 2
        if (!fips.length == 2) {
            return res.send({status: 400, error: 'FIPS state codes must be 2 digits in length.'});
        }

console.log("topology requested for:", fips);
console.time("finished: "+fips);

        cacheManager.get(fips, function(error, result) {
            if (error) {
                res.send({status:500, error:error, msg:"OOPS! Something went wrong!"});
                return;
            }
            if (!result.length) {
                topologyBuilder(fips, function(error, topology) {
                    res.send(topology);
                    cacheManager.cache(fips, topology);
                })
            }
            else {
                res.send(JSON.parse(result[0].links));
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
