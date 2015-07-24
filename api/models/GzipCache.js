module.exports = {
	attributes: {
		id: {
			type: "text",
			primaryKey: true
		},
		gzipData: {
			type: "binary",
			required: true
		}
	},
	migrate: "safe"
}
