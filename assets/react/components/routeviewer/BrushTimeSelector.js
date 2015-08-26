var d3 = require("d3");

function BrushSelector() {
    var brush = d3.svg.brush()
            .clamp(true)
            .on("brushstart", brushStart)
            .on("brush", brush)
            .on("brushend", brushEnd),
        svg = null,
        timeout = null,
        dispatcher = d3.dispatch("change");

    function selector(selection) {
        if (selection) {
            svg = selection.append("g");
            svg.call(brush);
            svg.selectAll("rect")
                .style("height", "100%");
            return;
        }
    }
    selector.xScale = function(x) {
        if (!arguments.length) {
            return brush.x();
        }
        brush.x(x);
        return selector;
    }
    selector.extent = function(e) {
        if (!arguments.length) {
            return brush.extent();
        }
        brush.extent(e);
        return selector;
    }
    selector.onChange = function(l) {
        dispatcher.on("change", l);
        return selector;
    }

    return selector;

    function brushStart() {
        if (timeout) {
            clearTimeout(timeout)
        }
    }
    function brush() {
        if (d3.event.sourceEvent) {
            var extent = brush.extent();
            brush.extent([Math.round(extent[0]), Math.round(extent[1])]);
            d3.select(this).call(brush);
        }
    }
    function brushEnd() {
        timeout = setTimeout(setTimeBounds, 2000);
    }

    function setTimeBounds() {
        dispatcher.change(brush.extent());
    }
}

module.exports = BrushSelector;
