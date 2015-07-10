/*
This convenience module is used to query Google's BigQuery service.
*/

var googleapis = require('googleapis'),
	bigQuery = googleapis.bigquery('v2');

var AUTH = false,
	JWT = null;

function BigQuery() {
	var projectId = 'npmrds';

	function query(sql, cb) {
	/*
	This function is used to send a query request to BigQuery.

	sql: The SQL statement to be executed.
	cb: callback function executed upon query completion. The callback
		function should accept (error, result) as parameters.
	*/
		if (!AUTH) {
			console.error("You must first authorize BigQuery: require('/path/to/BigQuery')().auth();")
			cb("BigQuery services were not authorized")
		}
		bigQuery.jobs.query({
		    	kind: "bigquery#queryRequest",
		    	projectId: projectId,
		    	timeoutMs: '10000',
		    	resource: { query: sql, projectId: 'npmrds' },
		    	auth: JWT },
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

	query.auth = function(cb) {
		if (AUTH) return;

		JWT = new googleapis.auth.JWT(
		        process.env.BQ_EMAIL,//'748884541822-qirdunlbhosdte2h8tbjq59otnr4k1cu@developer.gserviceaccount.com',
		        					// ^ this is the google service account email ^

		        process.env.BQ_PEM,//'npmrds.pem',		// < point this to the path of required .pem file
		        null,
		        ['https://www.googleapis.com/auth/bigquery']);
		JWT.authorize(function(error, result) {
			cb(error, result);
			console.log("BigQuery auth result: %s, %s", error ? "failure" : "success", error || result);
		});

		AUTH = true;
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
		bigQuery.jobs.get({ projectId: projectId, jobId: jobId, auth: JWT }, cb);
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

// PRIVATE FUNCTIONS FOLLOW

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
	/*
	This private function is used internally after waiting for an unfinished query job.

	status: the status object for a completed job returned by Google.
	cb: callback function executed upon completion. The callback
		function should accept (error, result) as parameters.
	*/
		var params = {
			jobId: status.jobReference.jobId,
			projectId: projectId,
			startLine: 0,
			auth: JWT
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

	function getMoreRows(response, pageToken, cb) {
	/*
	This private function is used internally to receive additional
		pages of results if a query response has more than 100,000 rows.

	response: a query response returned by Google. Additional data is
		added into this object's rows.
	pageToken: the pageToken identifying the last page of read received.
		Google uses this to receive the next page of data.
	cb: callback function executed upon completion. The callback
		function should accept (error, result) as parameters.
	*/
		var params = {
			jobId: response.jobReference.jobId,
			projectId: projectId,
			auth: JWT,
			pageToken: pageToken
		}
console.log("<BigQuery> Getting more rows:", params.jobId);
		bigQuery.jobs.getQueryResults(params, function(error, data) {
			if(error) {
				cb(error);
				return;
			}

			if (!response.rows) {
				cb("empty response from BigQuery");
				return;
			}

			if (data.rows.length) {
				response.rows = response.rows.concat(data.rows);
			}

	    	if (response.totalRows > response.rows.length) {
	    		getMoreRows(response, data.pageToken,  cb);
	    	}
	    	else {
	    		cb(error, response);
	    	}
		})
	}
}

module.exports = BigQuery;
