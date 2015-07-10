/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 */

var fs = require("fs"),
  topojson = require("topojson"),
  BQconfig = require("../BQconfig.json");

module.exports.bootstrap = function(cb) {
    loadMPOgeo();
    loadTestRoute();

    process.env.BQ_EMAIL = BQconfig.email;
    process.env.BQ_PEM = BQconfig.pem;

    require("../custom_modules/BigQuery")().auth();

  // It"s very important to trigger this callack method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it"s waiting on the bootstrap)
    User.count().exec(function(err,count){
      	if(err){
      		sails.log.error("Already boostrapping data");
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

    Route.create([
    {
      "points": '[[42.7508,-74.049],[42.696,-73.875]]',
      "tmc_codes":'["120N07904", "120N07905", "120N12012", "120N07906", "120N07907", "120N07908", "120N12011"]',
      "owner": "1",
      "name": "Western ave"
    },
    {
      "points": '[[42.76744642566998,-73.96295428276062],[42.66428868639134,-73.727918677032]]',
      "tmc_codes":'["120N05855", "120N05854", "120N05853", "120N05852", "120N05851", "120N05850","120N05849","120N05848","120N05847","120N05846","120N05845","120N05844"]',
      "owner": "nymtc",
      "name": "I90 Eastbound"
    },
    {
      "points": '[[42.664418859896095,-73.72785329818726],[42.767438549461595,-73.9623749256134]]',
      "tmc_codes":'["120N05845", "120N05846", "120N05847", "120N05848", "120N05849", "120N05850","120N05851","120N05852","120N05853","120N05854","120N05855","120N05856"]',
      "owner": "nymtc",
      "name": "I90 Westbound"
  },
    {
      "points": '[[42.793,-73.763],[42.674,-73.843],[42.528,-73.787]]',
      "tmc_codes":'["120N05865", "120N05864", "120N05863", "120N05862", "120N05861", "120N05860","120N05859","120N05837","120N05836","120N05835"]',
      "owner": "1",
      "name": "I87 Southbound"
    }
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
