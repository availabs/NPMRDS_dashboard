/*
This object is used by the GeodataController for creating the topojson objects
for a collection of links.
*/

var topojson = require("topojson");

function TopologyBuilder() {
	function manager(fips, cb) {
        Geodata.query(generateSQL(fips), {}, function(error, result) {
        	if (!error) {
        		result = makeCollection(fips, result);
        	}
        	cb(error, result);
        });
	}

	return manager;

	function makeCollection(fips, result) {
        var collection = {
                type: "FeatureCollection",
                features: [],
                id: fips
            };

        result.rows.forEach(function(row) {
            var feature = {
                type: "Feature",
                geometry: JSON.parse(row.geom),
                properties: {
                    linkID: row.link_id,
                    featureID: row.feat_id,
                    length: +row.len,
                    name: row.st_name,
                    direction: row.direction
                }
            };
            collection.features.push(feature);
        });

        return convert(collection);
	}

    function generateSQL(fips) {
        var _TABLE_, _JOIN_;

        var query = 'SELECT ST_AsGeoJSON(nhs.the_geom) as geom, "LINK_ID" AS link_id, '+
                        '"FEAT_ID" AS feat_id, "ST_NAME" AS st_name, '+
                        'ST_Length(ST_Transform(nhs.the_geom, 2163)) AS len, '+
                        '"DIR_TRAVEL" AS direction '+
                    'FROM "NHS_NPMRDS_Shape_file_HERE_Q2_2013" AS nhs '+
                    'JOIN _TABLE_ AS bounds ON _JOIN_ '+
                    'WHERE ST_Intersects(bounds.the_geom, nhs.the_geom);';

        if (fips.length == 2) {
            _TABLE_ = '"tl_2013_us_state"';
            _JOIN_ = "statefp = '"+fips+"'";
        }
        else {
            _TABLE_ = '"tl_2013_us_county"';
            _JOIN_ = "countyfp = '"+fips.slice(2)+"' AND statefp = '"+fips.slice(0, 2)+"'";
        }

        return query.replace('_TABLE_', _TABLE_)
                    .replace('_JOIN_', _JOIN_);
    }

	// converts a geoJSON FeatureCollection to the specified type
	function convert(collection) {
	    return  topojson.simplify(topojson.topology({geo: collection}, {"property-transform": preserve, "quantization": 1e6}),
	                                                {"minimum-area": 7e-7, "coordinate-system": "cartesian"});
	}

	// This method is used by the topojson topology conversion in order to preserve the geoJSON properties
	function preserve(feature) {
	    return feature.properties;
	}
}

module.exports = TopologyBuilder;