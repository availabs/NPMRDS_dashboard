/*
Tihs object is used by the GeodataController for managing the Geodata model.
*/

function CacheManager() {
	var activeCacheTasks = new Object(null);

	return manager = {
		get: function(id, cb) {
		/*
		Retrieves a cached link collection.
		Returns an empty response if the requested collection
		has not been cached.

		id: the id of the collection (county fip or MPO name) requested.
		cb: callback function executed upon completion.
		*/
			if (id in activeCacheTasks) {
				cb(null, [activeCacheTasks[id]]);
			}
			else {
				Geodata.find({id: id}).exec(cb);
			}
		},
		cache: function(id, topology) {
		/*
		This function adds a topology collection into the Geodata model.

		id: the id of the collection (county fip or MPO name) to be cached.
		topology: the topology (topojson) of the links collection.
		*/
			if (id in activeCacheTasks) {
				return;
			}
			else {
				activeCacheTasks[id] = { status: 'caching', requests: 1, links: JSON.stringify(topology), id: id };
			}

			Geodata.find({id: id}).exec(function(error, result) {
				if (!result.length) {
			        Geodata.create({id: id, links: activeCacheTasks[id].links, requests: activeCacheTasks[id].requests})
			        	.exec(function(error, result) {
				            if (error) {
				            	console.log(error);
				            	return;
				            }
				            console.log("inserted new data into "+id);
				            delete activeCacheTasks[id];
				    	});
				}
		    })
		},
		updateCount: function(id) {
		/*
		This function increments the count of a links collection each time it is requested.

		id: the id of the collection (county fip or MPO name) requested.
		*/
			var sql = "SELECT requests FROM geodata WHERE id = '"+id+"';";
			Geodata.query(sql, {}, function(error, result) {
				if (error) {
					console.log(error);
				}
				else if (result.rows && result.rows.length) {
			        Geodata.update({id: id}, {requests:result.rows[0].requests+1}).exec(function(error, result) {
			            if (error) {
			            	console.log(error);
			            }
			            else {
			            	console.log("updated "+id+" to "+(result[0].requests)+" requests!");
			            }
			        });
			    }
			});
		}
	}
}

module.exports = CacheManager;