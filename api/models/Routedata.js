module.exports = {
	attributes: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		points: {
        	type: 'text',
        	required: true
		},
		tmc_codes: {
			type: 'text'
		},
		links: {
			type: 'text'
		},
		owner: {					// user account id
			type: 'integer',
        	required: true
		},
		name: {
			type: 'string',
        	required: true
		}
  	},
  	migrate: "drop"
};