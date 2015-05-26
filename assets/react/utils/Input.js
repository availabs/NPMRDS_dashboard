"use strict"

var KEY_MAP = {
	"ctrl": 17
}

function Input() {
	var events = {};

	function input() {

	}
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
			keyCode = KEY_MAP[key];
		}
		else if (typeof key == "number") {
			keyCode = key;
		}
		return events[keyCode];
	}
	return input;

	function keydown(key) {
		events[key.keyCode] = key.timeStamp;
	}
	function keyup(key) {
		events[key.keyCode] = 0;
	}
}

module.exports = Input;