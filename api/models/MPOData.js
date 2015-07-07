module.exports = {
	attributes: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		geography: {					// MPO's shape stored as a JSON.stringified topojson object
			type: "string",
			required: true
		},
		shortName: {					// MPO's name abreviation
			type: "string",
			required: true
		},
		fullName: {						// MPO's full name
			type: "string"
		},
		stateFIPS: {					// the state FIPS code where the MPO is located
			type: "integer"
		}
  	},
  	migrate: 'drop'
};
