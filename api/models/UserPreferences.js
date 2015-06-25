module.exports = {
	attributes: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		user_type: {						// dictates landing page type, mpo_user or state_user
			type: "string",
			required: true
		},
		mpo_id: {						// -1 if userType == state_user
			type: "integer",
			defaultsTo: -1
		},
		owner: {						// username
			type: 'integer',
        	required: true
		}
  	},
  	migrate: "drop"
};
