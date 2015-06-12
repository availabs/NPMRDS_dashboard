module.exports = {
	saveRoute: function(req, res) {
		var owner = req.param("owner"),
			name = req.param("name"),
			points = req.param("points");

		Routedata.find({ owner: owner, name: name }).exec(function(error, result) {
			if (!result.length) {
				Routedata.create({ owner: owner, name: name, points: points })
		        	.exec(function(error, result) {
			            if (error) {
			            	console.log(error);
			            	res.send(error, 500);
			            	return;
			            }
			            res.send({ error: error, result: result });
			    	});
		    }
		    else {
				Routedata.update({ owner: owner, name: name }, { points: points })
		        	.exec(function(error, result) {
			            if (error) {
			            	console.log(error);
			            	res.send(error, 500);
			            	return;
			            }
			            res.send(result);
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
            	res.send(error, 500);
            	return;
            }
			if (!result.length) {
				res.send({ error: "no route named: "+name }, 400);
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
            	res.send(error, 500);
            	return;
            }
			if (!result.length) {
				res.send([]);
			}
			else {
				res.send(result);
			}
		})

	}
}