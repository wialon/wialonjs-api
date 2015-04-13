/** Main app logic
 */
var app = (function () {

	var self = this;
	/** @private */
	var map = null,
		session = null,
		unitsData = {};

	/** Print message to log
	 */
	function msg(text) {
		console.log(text);
	}

	/** Random color generator
	 */
	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	/** Execute after login succeed
	 */
	function init() {
		var params = {spec:[{'type': 'type', 'data': 'avl_unit', 'flags': 0x411, 'mode': 0}]};
		// load items to current session
		session.execute('core/update_data_flags', params, function () {
			showUnits();
		});
		// register event listener
		session.on('positionChanged', handlePositionChange);
	}

	/** Show units on map and bind event
	 */
	function showUnits(){
		// get loaded 'avl_units's items
		var units = session.getItems('avl_unit');
		// check if units found
		if (!units || !units.length){
			msg('Units not found');
			return;
		}
		var bounds = [];
		for (var i = 0, pos = null; i< units.length; i++) {
			pos = units[i].pos;
			// check if map created and we can detect position of unit
			if (map && pos) {
				// add point to bounds
				bounds.push([pos.y, pos.x]);
				var icon = L.icon({
					iconUrl: session.getBaseUrl() + units[i].uri + '?b=32',
					iconAnchor: [16, 16]
				});
				// construct data to store it and reuse
				unitsData[units[i].id] = {
					marker: L.marker({lat: pos.y, lng: pos.x}, {icon: icon})
								.addTo(map)
								.bindPopup(units[i].nm + '<div>Speed: <b>' + pos.s + '</b> kph</div>'),
					tail: L.polyline([{lat: pos.y, lng: pos.x}], {color: getRandomColor(), opacity: 0.8})
							.addTo(map)
				};
			}
		}
	}

	/** Position changed event handler
	 * @param {Event} evt
	 */
	function handlePositionChange(evt) {
		// get data from evt
		var data = evt.d;
		var pos = data.pos;
		if (pos) {
			var unit = session.getItem(evt.i);
			if (unit.id in unitsData) {
				// move marker
				var marker = unitsData[unit.id].marker;
				marker.setLatLng({lat: pos.y, lng: pos.x});
				// update marker content
				if (marker.getPopup() && pos.s) {
					marker.getPopup().setContent(
						unit.nm + '<div>Speed: <b>' + pos.s + '</b> kph</div>'
					).update();
				}
				// add point to tail
				unitsData[unit.id].tail.addLatLng({lat: pos.y, lng: pos.x});
				// remove oldest point if tail too long
				if (unitsData[unit.id].tail.getLatLngs().length > 10) {
					unitsData[unit.id].tail.spliceLatLngs(0, 1);
				}
			}
		}
	}

	/** App login
	 * @param {String} user   wialon username
	 * @param {String} password   password
	 * @param {String} url   server host url (@default: 'https://hst-api.wialon.com')
	 */
	self.login = function (user, password, url) {
		url = url || 'https://hst-api.wialon.com';

		// init session
		session = new W.Session(url, {eventsTimeout: 3});
		// login
		session.execute('core/login', {user: user, password: password}, function (data) { // login callback
			// if error code - print error message
			if (data.error) {
				msg('Login error');
			} else {
				msg('Logged successfully');
				// hide overlay
				document.getElementById('overlay').style.display = 'none';
				// when login succeed then run init() function
				init();
			}
		});
	};

	/** App initializition
	 *  Executes after DOM loaded
	 */
	self.initialize = function () {
		// bind login function to click
		document.getElementById('loginBtn').onclick = function () {
			var user = document.getElementById('username').value;
			var password = document.getElementById('password').value;
			self.login(user, password);
		};
		// create a map in the "map" div
		map = L.map('map').setView([52.32728615559, 9.798388481140], 14);
		// add an OpenStreetMap tile layer
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
	};

	return self;
})();
