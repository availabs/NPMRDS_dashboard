module.exports = {
	savePreferences: function(req, res) {
		var user_type = req.param("type"),
			mpo_name = req.param("mpo"),
			owner = req.param("id");

		UserPreferences.findOneByOwner(owner)
			.exec(function(error, result) {
				if (error) {
					res.serverError(error);
				}
				else if (!result) {
					UserPreferences.create({ user_type: user_type,
												mpo_name: mpo_name,
												owner: owner })
						.exec(function(error, result) {
							if (error) {
								res.serverError(error);
							}
							else {
								res.ok(result)
							}
						})
				}
				else if (result) {
					UserPreferences.update({ id: result.id },
											{ user_type: user_type,
												mpo_name: mpo_name,
												owner: owner })
						.exec(function(error, result) {
							if (error) {
								res.serverError(error);
							}
							else {
								res.ok(result.pop());
							}
						})
				}
			})
	},
	getPreferences: function(req, res) {
		var owner = req.param("id");

		UserPreferences.findOneByOwner(owner)
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
