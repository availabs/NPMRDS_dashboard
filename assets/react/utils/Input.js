"use strict"

var d3 = require("d3");

var string2code_MAP = {
		"ctrl": 17
	},
	code2string_MAP = {
		17: "ctrl"
	}

function Input() {
	var events = {},
		dispatcher = d3.dispatch("keydown", "keyup");

	var input = {};

	input.init = function() {
		window.addEventListener('keydown', keydown);
		window.addEventListener('keyup', keyup);
		return input;
	}
	input.close = function() {
		window.removeEventListener('keydown', keydown);
		window.removeEventListener('keyup', keyup);
		return input;
	}
	input.keyDown = function(key) {
		var keyCode;
		if (typeof key == "string") {
			keyCode = string2code_MAP[key];
		}
		else if (typeof key == "number") {
			keyCode = key;
		}
		return events[keyCode];
	}
	input.on = function(e, l) {
		if (!arguments.length) {
			return input;
		}
		if (arguments.length == 1) {
			return dispatcher.on(e);
		}
		dispatcher.on(e, l);
		return input;
	}

	return input;

	function keydown(key) {
		events[key.keyCode] = key.timeStamp;
		dispatcher.keydown(code2string_MAP[key.keyCode], key);
	}
	function keyup(key) {
		events[key.keyCode] = 0;
		dispatcher.keyup(code2string_MAP[key.keyCode], key);
	}
}

module.exports = Input;