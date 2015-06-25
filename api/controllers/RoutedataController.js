module.exports = {
	saveRoute: function(req, res) {
		var owner = req.param("owner"),
			name = req.param("name"),
			points = req.param("points");

		Routedata.find({ owner: owner, name: name }).exec(function(error, result) {
			if (error) {
				res.serverError(error);
			}
			else if (!result.length) {
				Routedata.create({ owner: owner, name: name, points: points })
		        	.exec(function(error, result) {
			            if (error) {
			            	console.log(error);
			            	res.serverError(error);
			            }
			            else {
			            	res.send({ error: error, result: result });
			            }
			    	});
		    }
		    else {
				Routedata.update({ owner: owner, name: name }, { points: points })
		        	.exec(function(error, result) {
			            if (error) {
			            	console.log(error);
			            	res.serverError(error);
			            }
			            else {
			            	res.send(result);
			            }
			    	});
		    }
		})
	},
	loadRoute: function(req, res) {
		var owner = req.param("owner"),
			name = req.param("name");

		Routedata.find({ owner: owner, name: name }).exec(function(error, result) {
            if (error) {
            	console.log(error);
			    res.serverError(error);
            }
			else if (!result.length) {
				res.badRequest("no route named: "+name);
			}
			else {
				res.send(result.pop());
			}
		})
	},
	getSavedRoutes: function(req, res) {
		var owner = req.param("owner");

		Routedata.find({ owner: owner }).exec(function(error, result) {
            if (error) {
            	console.log(error);
			    res.serverError(error);
            }
			else if (!result.length) {
				res.send([]);
			}
			else {
				res.send(result);
			}
		})

	}
}