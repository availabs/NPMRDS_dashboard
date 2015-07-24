var zlib = require("zlib");

module.exports = function() {
    var cacher = {
        find: function(id, cb) {
            GzipCache.findOne(id).exec(function(err, data) {
                if (err) {
                    cb(err);
                }
                else if (!data) {
                    cb(err, data);
                }
                else {
                    var buf = new Buffer(data.gzipData, "base64"),
                        smallBufSize = buf.length;

                    zlib.gunzip(buf, function(err, gunzipData) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            var bigBufSize = gunzipData.length;
                            console.log("Retrieved gzip data from cache. Inflated",smallBufSize,"bytes to",bigBufSize,"bytes");
                            cb(err, JSON.parse(gunzipData));
                        }
                    });
                }
            })
        },
        cache: function(id, data) {
            var buf = new Buffer(JSON.stringify(data), "utf-8"),
                bigBufSize = buf.length;

            zlib.gzip(buf, function(err, gzData) {
                if (err) {
                    console.log("error creating gzip:", err);
                    return;
                }
                var smallBufSize = gzData.length;
                GzipCache.create({ id: id, gzipData: gzData }).exec(function(err, res) {
                    if (err) {
                        console.log("error caching gzip:", err);
                        return;
                    }
                    console.log("Cached gzip. Compressed",bigBufSize,"bytes down to",smallBufSize,"bytes");
                })
            });
        }
    }
    return cacher;
}
