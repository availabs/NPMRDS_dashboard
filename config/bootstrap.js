/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 */

var fs = require("fs"),
  topojson = require("topojson");

module.exports.bootstrap = function(cb) {
    loadMPOgeo();
    loadTestRoute();

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
                    fullName: "",
                    stateFIPS: 36
                }
                records.push(record);
                if (records.length == files.length) {
                    createMPOData(records);
                }
            })
        })
    })
}

function loadTestRoute(){

    Routedata.create([
    {
      "points": "[[42.75432327356435,-74.05938506126404],[42.66678560336089,-73.79156112670898]]",
      "tmc_codes":"['120N12009', '120N07906', '120N12010', '120N07908', '120N07907', '120N12012', '120N07905', '120N12150', '120N07909', '120N12011']",
      "owner": '1',
      "name": "western N",
    },
    {
      "points": "[[42.75432327356435,-74.05938506126404],[42.66678560336089,-73.79156112670898]]",
      "tmc_codes":"['120N12009', '120N07906', '120N12010', '120N07908', '120N07907', '120N12012', '120N07905']",
      "owner": 'nymtc',
      "name": "western N2",
    },
    {
      "points": "[[42.75432327356435,-74.05938506126404],[42.66678560336089,-73.79156112670898]]",
      "tmc_codes":"['120P07903', '120P07904', '120P07906', '120P07905', '120P12012', '120P12152', '120P12151', '120P07907', '120P07908', '120P12011', '120P07909', '120P12010']",
      "owner": "1",
      "name": "western P",
    },
    {
      "points": "[[42.75432327356435,-74.05938506126404],[42.66678560336089,-73.79156112670898]]",
      "tmc_codes":"['120P07903', '120P07904', '120P07906', '120P07905', '120P12012', '120P12152', '120P12151']",
      "owner": "nymtc",
      "name": "western P2",
    },
  ]).exec(function(err, res) {
      console.log(err || (res.length+" routes added."));
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
