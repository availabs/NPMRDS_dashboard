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
		mpo_name: {							// ignored if userType == state_user
			type: "string",
			defaultsTo: "state_user"
		},
		owner: {							// corresponds to the User model unique user ID
			type: 'integer',
        	required: true
		}
  	},
  	migrate: "drop"
};
