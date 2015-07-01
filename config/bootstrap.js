/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 */

var fs = require("fs"),
  topojson = require("topojson");

module.exports.bootstrap = function(cb) {
    loadMPOgeo();

  // It's very important to trigger this callack method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    User.count().exec(function(err,count){
      	if(err){
      		sails.log.error('Already boostrapping data');
      		return cb(err);
      	}
      	if(count > 0) return cb()
      	
      	User.create([{
      		"name":"AVAILabs",
      		"username":"avail",
    		"email":"testuser@availabs.org",
    		"password":"password",
    		"confirmation":"password"
      	}]).exec(cb);
    })
};

function loadMPOgeo() {
    var dir ="assets/geo_data/mpos/",
        records = [],
        regex = /^(\w+).geojson/;

    fs.readdir(dir, function(error, files) {
        files.forEach(function(file) {
            var path = dir+file,
                shortName = regex.exec(file)[1];

            fs.readFile(path, {encoding:"utf-8"},function(err, data) {
                var record = {
                    geography: JSON.stringify(convert(data)),
                    shortName: shortName,
                    fullName: ""
                }
                records.push(record);
                if (records.length == files.length) {
                    createMPOData(records);
                }
            })
        })
    })
}
function convert(collection) {
    return topojson.simplify(topojson.topology({geo: collection},
                {"property-transform": preserve, quantization: 1e6}),
                {"minimum-area": 7e-7, "coordinate-system": "cartesian"});
}
function preserve(feature) {
    return feature.properties;
}
function createMPOData(records) {
    MPOData.create(records).exec(function(err, res) {
        console.log(err || (res.length+" MPOs added."));
    })
}
