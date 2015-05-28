

module.exports = {
	attributes: {
		id: {
  			type: 'integer',
  			unique: true,
  			primaryKey: true
		},
		waypoints: {
        	type: 'text'
		},
		tmc_codes: {
			type: 'text'
		},
		linkids: {
			type: 'text'
		}
  	},
  	migrate: "drop"
};