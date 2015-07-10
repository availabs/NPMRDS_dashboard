module.exports = {
	saveRoute: function(req, res) {
		var owner = req.param("owner"),
			name = req.param("name"),
			points = JSON.stringify(req.param("points"));

		Route.find({ owner: owner, name: name }).exec(function(error, result) {
			if (error) {
				res.serverError(error);
			}
			else if (!result.length) {
				Route.create({ owner: owner, name: name, points: points })
		        	.exec(function(error, result) {
			            if (error) {
			            	console.log(error);
			            	res.serverError(error);
			            }
			            else {
			            	res.ok(result);
			            }
			    	});
		    }
		    else {
				Route.update({ owner: owner, name: name }, { points: points })
		        	.exec(function(error, result) {
			            if (error) {
			            	console.log(error);
			            	res.serverError(error);
			            }
			            else {
			            	res.ok(result);
			            }
			    	});
		    }
		})
	},
	loadRoute: function(req, res) {
		var owner = req.param("owner"),
			name = req.param("name");

		Route.find({ owner: owner, name: name }).exec(function(error, result) {
            if (error) {
            	console.log(error);
			    res.serverError(error);
            }
			else if (!result.length) {
				res.badRequest("no route named: "+name);
			}
			else {
				var data = result.pop();
				data.points = JSON.parse(data.points);
				data.tmc_codes = JSON.parse(data.tmc_codes);
				res.ok(data);
			}
		})
	},
	getSavedRoutes: function(req, res) {
		var owner = req.param("owner"),
			mpo_array = req.param("mpo_array");

		try {
			mpo_array = JSON.parse(mpo_array);
		}
		catch(e) {
			res.badRequest("You must send an array of MPO names as a JSON string.")
		}
		mpo_array.push(owner);

		Route.find({ owner: mpo_array }).exec(function(error, result) {
            if (error) {
            	console.log(error);
			    res.serverError(error);
            }
			else if (!result.length) {
				res.ok([]);
			}
			else {
				result.forEach(function(data) {
					data.points = JSON.parse(data.points);
					data.tmc_codes = JSON.parse(data.tmc_codes);
				})
				res.ok(result);
			}
		})
	}
}
