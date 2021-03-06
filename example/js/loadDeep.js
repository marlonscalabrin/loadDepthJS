whenLoaded = function(func) {
	if (typeof jQuery !== "undefined") {
		$(document).ready(func);
	} else if (typeof Prototype !== "undefined") {
		document.observe("dom:loaded", func);
	} else {
		setTimeout(func, 2000);
	}
}
whenLoaded(function() {
	newHash = { keys: [], values: [] };
	moveChildren = function(elem, hash) {
		var keysMoved = [];
		for (var i = 0; i < hash.keys.length; i++) {
			var key = hash.keys[i];
			if (elem.id != key && parentContains(elem.id, key)) {
				keysMoved.push(key);
				child = insertElement(hash.values[i], elem.children);
			}
		}
		for (var i = 0; i < keysMoved.length; i++) {
			var index = getIndexById(keysMoved[i], hash);
			hash.keys.splice(index, 1);
			var value = hash.values.splice(index, 1);
		}
	}
	getIndexById = function(id, hash) {
		for (var i = 0; i < hash.keys.length; i++) {
			if (hash.keys[i] == id) {
				return i;
			}
		}
	}
	insertReference = function(id, _location, hash) {
		var i = getIndexById(id, hash);
		var elem = hash.values[i];
		if (i != undefined) {
			hash.keys.splice(i, 1);
			hash.values.splice(i, 1);
		}
		hash.keys.push(id);
		if (elem == undefined){
			elem = {id: id, loaded: false, location: _location, children:{ keys: [], values: [] }};
		} else if (elem.location != _location) {
			elem.location = _location;
			elem.loaded = false;
			elem.children = { keys: [], values: [] };
		}
		hash.values.push(elem);
		moveChildren(elem, hash);
		return elem;
	}
	insertElement = function(elem, hash) {
		var i = getIndexById(elem.id, hash);
		if (i != undefined) {
			hash.keys.splice(i, 1);
			hash.values.splice(i, 1);
		}
		hash.keys.push(elem.id);
		hash.values.push(elem);
		return elem;
	}
	parentContains = function(parentId, childId) {
		if (document.getElementById(parentId) == undefined || document.getElementById(childId) == undefined) {
			return false;
		}
		if (typeof jQuery !== "undefined") {
			return $(document.getElementById(parentId)).find("#" + childId).length > 0;
		} else if (typeof Prototype !== "undefined") {
			return $(document.getElementById(parentId)).select("#" + childId).length > 0;
		} else {
			return document.getElementById(parentId).contains(document.getElementById(childId));
		}
	}
	addToHash = function(id, location, hash) {
		if (hash.keys && hash.keys.length > 0) {
			for (var i = 0; i < hash.keys.length; i++) {
				if (id != hash.keys[i] && parentContains(hash.keys[i], id)) {
					var elem = addToHash(id, location, hash.values[i].children);
					if (elem != undefined) {
						return elem;
					} else {
						break;
					}
				}
			}
		}
		return insertReference(id, location, hash);
	}

	loadDeep = function(hash) {
		var _hash = hash;
		for (var i = 0; i < _hash.keys.length; i++) {
			if (document.getElementById(_hash.keys[i]) != undefined) {
				if (!_hash.values[i].loaded) {
					if (typeof jQuery !== "undefined" ) {
						$("#" + _hash.values[i].id).load(_hash.values[i].location, function(response, status, xhr) {
							var i = getIndexById(this.id, _hash);
							if (i != undefined) {
								var value = _hash.values[i];
								value.loaded = true;
								moveChildren(value, _hash);
								loadDeep(value.children);
							}
						});
					} else if (typeof Prototype !== "undefined") {
						new Ajax.Updater(_hash.keys[i], value.location, { onSuccess: function(response) {
							value.loaded = true;
							moveChildren(value, _hash);
							loadDeep(value.children);
						}});
					}
				} else {
					var value = _hash.values[i];
					moveChildren(value, _hash);
					loadDeep(value.children);
				}
			}
		}
	}
	generateHash = function(hash) {
		var _hash = hash;
		var hashString = "";
		for (var i = 0; i < _hash.keys.length; i++) {
			hashString += "#" + _hash.keys[i] + ":" + _hash.values[i].location;
			hashString += generateHash(_hash.values[i].children);
		}
		return hashString;
	}
	loadContent = function(id, location) {
		removeFromHash(id, newHash);
		window.location.hash = generateHash(newHash).substring(1) + "#" + id + ":" + location;
	}
	window.onhashchange = function() {
		vector = window.location.hash.split("#");
		for (var i = 1; i < vector.length; i++) {
			item = vector[i].split(":");
			elem=addToHash(item[0], item[1], newHash);
		}
		loadDeep(newHash);
		//window.location.hash = generateHash(newHash).substring(1);
	};
	window.onhashchange();
	removeFromHash = function(id, hash) {
		var _hash = hash;
		for (var i = 0; i < _hash.keys.length; i++) {
			if (id == _hash.keys[i]) {
				_hash.keys.splice(i, 1);
				_hash.values.splice(i, 1);
			} else if (id != _hash.keys[i] && parentContains(_hash.keys[i], id)) {
				removeFromHash(id, _hash.values[i].children);
			}
		}
	}
});
