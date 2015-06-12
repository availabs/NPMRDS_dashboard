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
		owner: {
			type: 'string',
        	required: true
		},
		name: {
			type: 'string',
        	required: true
		}
  	},
  	migrate: "drop"
};