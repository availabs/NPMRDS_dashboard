/*
This model is used as a cache for roads requested for a county or MPO area.
*/

module.exports = {
	attributes: {
		id: {						// county FIPS code or MPO area that the links are contained within
  			type: 'string',
  			unique: true,
  			primaryKey: true
		},
		links: {					// the collection of links contained within this area,
									// stored as a JSON.stringified topojson object
        	type: 'string'
		},
		requests: {					// the number of times this collection of links has been requested
			type: 'integer'
		}
  	},
  	migrate: "drop"
};

