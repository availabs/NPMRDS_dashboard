function BigQueryTest() {
	var googleapis = require('googleapis'),
		bigQuery = googleapis.bigquery('v2');

	var jwt = new googleapis.auth.JWT(
	        '748884541822-qirdunlbhosdte2h8tbjq59otnr4k1cu@developer.gserviceaccount.com',
	        'npmrds.pem',
	        'f1550f94abf21829e6a631503c78f80a825bb9ff',
	        ['https://www.googleapis.com/auth/bigquery']);
	jwt.authorize();

	function BigQuery() {
		var projectId = 'npmrds';

		function query(sql, cb) {
			bigQuery.jobs.query({
			    	kind: "bigquery#queryRequest",
			    	projectId: projectId,
			    	timeoutMs: '10000',
			    	resource: { query: sql, projectId: 'npmrds' },
			    	auth: jwt },
			    function(error, result) {
			    	if (error) {
			    		console.log(error);
			    		cb(error);
			    		return;
			    	}

			    	if (!result["jobComplete"]) {
			    		setTimeout(wait, 2000, result, cb);
			    		return;
			    	}

			    	if (result.totalRows > result.rows.length) {
			    		getMoreRows(result, result.pageToken, cb);
			    	}
			    	else {
			    		cb(error, result);
			    	}
			    })
		}

		query.checkJob = function(jobId, cb) {
			bigQuery.jobs.get({ projectId: projectId, jobId: jobId, auth: jwt }, cb);
		}
		query.parseResult = function(result) {
			var response = {
				schema: [],
				numRows: 0,
				rows: []
			}

			result.schema.fields.forEach(function(field, i) {
				response.schema.push(field.name);
			})

			result.rows.forEach(function(row) {
				var array = [];

				response.schema.forEach(function(field, i) {
					array.push(row.f[i].v);
				})

				response.rows.push(array);
			})

			response.numRows = response.rows.length;

			return response;
		}

		return query;

		function wait(result, cb) {
			query.checkJob(result["jobReference"]["jobId"], function(error, status) {
				var state = status["status"]["state"];
				if (state == "RUNNING") {
					console.log("Job still running:", result["jobReference"]["jobId"]);
					setTimeout(wait, 2000, result, cb);
					return;
				}
				if (state == "DONE") {
					getResults(status, cb);
				}
			});
		}

		function getResults(status, cb) {
			var params = {
				jobId: status.jobReference.jobId,
				projectId: projectId,
				startLine: 0,
				auth: jwt
			}
			bigQuery.jobs.getQueryResults(params, function(error, result) {
				if(error) {
					console.log(error);
					return;
				}

				if (!result.rows) {
					cb("empty resonse from BigQuery");
					return;
				}

		    	if (result.totalRows > result.rows.length) {
		    		getMoreRows(result, result.pageToken, cb);
		    	}
		    	else {
		    		cb(error, result);
		    	}
			})
		}

		function getMoreRows(result, pageToken, cb) {
			var params = {
				jobId: result.jobReference.jobId,
				projectId: projectId,
				auth: jwt,
				pageToken: pageToken
			}
console.log(pageToken)
			bigQuery.jobs.getQueryResults(params, function(error, data) {
				if(error) {
					console.log(error);
					return;
				}

				if (data.rows.length) {
					data.rows.forEach(function(row) {
						result.rows.push(row);
					})
				}

		    	if (result.totalRows > result.rows.length) {
		    		getMoreRows(result, data.pageToken,  cb);
		    	}
		    	else {
		    		cb(error, result);
		    	}
			})
		}
	}

	return BigQuery;
}

module.exports = BigQueryTest();