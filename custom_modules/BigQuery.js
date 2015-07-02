/*
This convenience module is used to query Google's BigQuery service.
*/

var googleapis = require('googleapis'),
	bigQuery = googleapis.bigquery('v2');

/*
#############
TODO
#############
Implement a more convient means of linking Google account information.
#############
*/

var jwt = new googleapis.auth.JWT(
        '748884541822-qirdunlbhosdte2h8tbjq59otnr4k1cu@developer.gserviceaccount.com',
        					// ^ this is the google service account email ^
        'npmrds.pem',		// point this to the path of required .pem file
        null,
        ['https://www.googleapis.com/auth/bigquery']);
jwt.authorize(function(error, result) {
	console.log(error, result);
});

function BigQuery() {
	var projectId = 'npmrds';

	function query(sql, cb) {
	/*
	This function is used to send a query request to BigQuery.

	sql: The SQL statement to be executed.
	cb: callback function executed upon query completion. The callback
		function should accept (error, result) as parameters.
	*/	
		bigQuery.jobs.query({
		    	kind: "bigquery#queryRequest",
		    	projectId: projectId,
		    	timeoutMs: '10000',
		    	resource: { query: sql, projectId: 'npmrds' },
		    	auth: jwt },
		    function(error, result) {
		    	if (error) {
		    		cb(error);
		    		return;
		    	}

		    	if (!result["jobComplete"]) {
		    		setTimeout(wait, 500, result, cb);
		    		return;
		    	}

				if (!result.rows) {
					cb("empty response from BigQuery");
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
	/*
	This function is used to check the status of a job to determine if
		the job has finished or if it still running.

	jobId: the google service jobId returned by google from the initial request.
		If a job runs for too long on Google's servers, a status update is returned.
		This request should be repeated until the job completes.
	cb: callback function executed upon completion. The callback 
		function should accept (error, result) as parameters.

	result: The result is an updated object containing updated
		information about the job status.
	*/
		bigQuery.jobs.get({ projectId: projectId, jobId: jobId, auth: jwt }, cb);
	}
	query.parseResult = function(BQresult) {
	/*
	This convenience methos is used to parse a default BigQuery result into 
		a nicer format.

	BQresult: this parameter is an unmodified BigQuery query response.

	return: returns an object containing the rows of data along with additional
		metadata.
	*/
		var response = {
			schema: [],			// This array contains the attribute names, in queried order.
			numRows: 0,			// The total number of rows returned.
			rows: [],			// This contains all of the data. Each element of rows is
									// itself an array containing the raw data for a
									// single record. The order of the data for each record
									// corresponds to the order of the schema elements,
									// i.e. the data is in queried order.
			types: []			// This array contains the types of each attribute,
									// in queried order.
		}

		BQresult.schema.fields.forEach(function(field, i) {
			response.schema.push(field.name);
			response.types.push(field.type);
		})

		response.rows = BQresult.rows.map(function(row) {
			return row.f.map(function(d) { return d.v; });
		});

		response.numRows = response.rows.length;

		return response;
	}

	return query;

	function wait(QBresponse, cb) {
	/*
	This private function is used internally when a query job returns unfinished.
	
	QBresult: the response from Google containing information on the unfinished job.
	cb: this is a callback function that is passed on to the function that retrieves
		query results after the job completes.
	*/
		query.checkJob(QBresponse["jobReference"]["jobId"], function(error, status) {
			var state = status["status"]["state"];
			if (state == "RUNNING") {
console.log("<BigQuery> Job still running:", QBresponse["jobReference"]["jobId"]);
				setTimeout(wait, 2000, QBresponse, cb);
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
				cb(error);
				return;
			}

			if (!result.rows) {
				cb("empty response from BigQuery");
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
console.log("<BigQuery> Getting more rows:", params.jobId);
		bigQuery.jobs.getQueryResults(params, function(error, data) {
			if(error) {
				cb(error);
				return;
			}
console.log("<BigQuery> Received additional rows:", params.jobId);

			if (data.rows.length) {
				// data.rows.forEach(function(row) {
				// 	result.rows.push(row);
				// })
				result.rows = result.rows.concat(data.rows);
console.log("<BigQuery> Combined rows:", params.jobId);
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

module.exports = BigQuery;