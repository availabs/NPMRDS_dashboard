module.exports = {
	attributes: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		points: {					// an array of [lat, lng] points, converted to string with JSON.stringify.
        	type: 'string',
        	required: true
		},
		tmc_codes: {				// an array of TMC codes, converted to string with JSON.stringify.
			type: 'string'
		},
		owner: {					// owner account id or MPO short name
			type: 'text',
        	required: true
		},
		name: {						// name of the route defined by the owner.
			type: 'string',
        	required: true
		}
  	},
  	migrate: "drop"
};