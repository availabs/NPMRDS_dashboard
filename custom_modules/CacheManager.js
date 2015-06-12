function CacheManager() {
	var activeCacheTasks = new Object(null),
		activeUpdateTasks = new Object(null);

	var manager = {};

	manager.get = function(id, cb) {
		if (id in activeCacheTasks) {
			cb(null, [activeCacheTasks[id]]);
		}
		else {
			Geodata.find({id: id}).exec(cb);
		}
	}
	manager.cache = function(id, topology) {
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

			            if (id in activeUpdateTasks) {
			            	manager.update(id);
			            	delete activeUpdateTasks[id];
			            }
			    	});
			}
	    })
	}
	manager.updateCount = function(id) {
		var sql = "SELECT requests FROM geodata WHERE id = '"+id+"';";
		Geodata.query(sql, {}, function(error, result) {
			if (error) {
				console.log(error);
				return;
			}
			if (result.rows && result.rows.length) {
		        Geodata.update({id: id}, {requests:result.rows[0].requests+1}).exec(function(error, result) {
		            if (error) return console.log(error);
		            console.log("updated "+id+" to "+(result[0].requests)+" requests!");
		        });
		    }
		});
	}

	return manager;
}

module.exports = CacheManager;