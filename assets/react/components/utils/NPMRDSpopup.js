function Popup() {
	var div = null;

	function popup(data) {
		popup.display(true);
		div.html(function() {
			var html = "";
			if (data.properties.tmc) {
				html += "<h4>"+data.properties.tmc+"</h4>";
			}
			if (data.properties.name) {
				html += "<p>"+data.properties.name;
				if (!data.properties.travelDir) {
					html += "</p>";
				}
			}
			if (data.properties.travelDir) {
				if (!data.properties.name) {
					html += "<p>"
				}
				else {
					html += " ";
				}
				html += data.properties.travelDir+"</p>";
			}
			return html;
		});
	}
	popup.init = function(selection) {
		div = selection.append("div")
			.attr("class", "NPMRDS-popup")
			.style({
				position: "absolute",
				left: "24px",
				bottom: "10px",
				"background-color": "#fff",
				color: "#666",
				padding: "5px 20px",
				margin: "0px",
				display: "none"
			});
		return popup;
	}
	popup.display = function(bool) {
		div.style("display", bool ? "inline" : "none");
		return popup;
	}
	return popup;
}

module.exports = Popup;