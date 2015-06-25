module.exports = {
	savePreferences: function(req, res) {
		var user_type = req.param("type"),
			mpo_id = req.param("mpo"),
			owner = req.param("id");

console.log("savePrefs", owner, user_type, mpo_id);
		
		UserPreferences.create({ user_type: user_type, mpo_id: mpo_id, owner: owner })
			.exec(function(error, result) {
				if (error) {
					res.serverError(error);
				}
				else {
					res.ok(result)
				}
			})
	},
	getPreferences: function(req, res) {
		var userID = req.param("id");

		UserPreferences.findOneByOwner(userID)
			.exec(function(error, result) {
				if (error) {
					res.serverError(error);
				}
				else if(!result) {
					res.ok({ user_type: "not_set" });
				}
				else {
					res.ok(result);
				}
			})
	}
}