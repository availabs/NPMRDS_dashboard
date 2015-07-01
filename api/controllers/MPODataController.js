module.exports = {
	getAllNames: function(req, res) {
	/*
	This route returns an array of objects, one for each loaded MPO.
	Each object returned contains the shortName and fullName for an MPO.
	*/
	This function returns all 
		MPOData.find({select: ['shortName', 'fullName']})
			.exec(function(error, result) {
				if (error) {
					res.serverError(error);
				}
				else {
					res.ok(result);
				}
			})
	}
}