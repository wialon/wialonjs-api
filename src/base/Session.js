/** W.Session is the central class of the API
 */

W.Session = W.Evented.extend({
    options: {
        eventsTimeout: 10
    },

    api: {},

    _cache: {},
    _request: null,
    _serverTime: 0,
    _eventsInterval: 0,

    _sid: null,
    _url: null,

    _gisRenderUrl: 'https://render-maps.wialon.com',
    _gisSearchUrl: 'https://search-maps.wialon.com',
    _gisGeocodeUrl: 'https://geocode-maps.wialon.com',
    _gisRoutingUrl: 'https://routing-maps.wialon.com',

    _items: {},
    _classes: {},
    _features: {},
    _classItems: {}, // items grouped by class
    _currentUser: null,

    /** Constructor
     */
    initialize: function (url, options) {
        options = W.setOptions(this, options);

        this._request = new W.Request(url);
        this._url = url;
    },

    /** Execute Remote API request
     */
    execute: function (method, params, callback) {
        var
            svc = ('' + method).split('/'),
            skipArr = ['login', 'use_auth_hash', 'duplicate'];

        // Check if session initialized and callback exists
        if (!this._sid && skipArr.indexOf(svc[1]) === -1 && callback) {
            // Call callback function with error code 1
            return callback({error: 1});
        }

        // Construct params
        params = params || {};
        // Add session ID into params
        if (this._sid) {
            params.sid = this._sid;
        }

        // if service and method in list
        if (svc[0] in this.api && svc[1] in this.api[svc[0]]) {
            // call with internal callback handler
            this.api[svc[0]][svc[1]].call(this, params, callback);
        } else {
            // call
            this._request.api(method, params, callback);
        }
    },

    /** Get events from server (execute 'avl_evts' request)
     */
    getEvents: function () {
        if (this._sid !== null) {
            this._request.send('/avl_evts',
                {sid: this._sid},
                this._getEventsCallback.bind(this),
                this._getEventsCallback.bind(this)
            );
            // schedule new getEvents call
            if (this.options.eventsTimeout) {
                clearTimeout(this._eventsInterval);
                this._eventsInterval = setTimeout(
                    this.getEvents.bind(this),
                    this.options.eventsTimeout * 1000
                );
            }
        }
    },

    /** Get session base url (e.g. https://hst-api.wialon.com)
     */
    getBaseUrl: function() {
        return this._url;
    },

    /** Get items by type
     */
    getItems: function(type) {
        if (!this._classItems || !this._classes) {
            return [];
        }
        type = type || 'avl_unit';
        return this._classItems[this._classes[type]];
    },

    /** Get item by id
     */
    getItem: function(id) {
        return this._items[id] || null;
    },

    /** Get session id, null if not logged in
     */
    getSid: function() {
        return this._sid;
    },

    /** Get current user, null if not logged in
     */
    getCurrentUser: function() {
        return this._currentUser;
    },

    /** Fetch avaible billing services for given session
    */
    getFeatures: function() {
        return this._features;
    },

    /** Check if billing service is avaible for given session
    */
    checkFeature: function(feature) {
        if (!this._features || typeof this._features.svcs === 'undefined') {
            return 0;
        }
        if (typeof this._features.svcs[feature] === 'undefined') {
            // check billing plan for unlimited services
            if (this._features.unlim === 1) {
                return 1;
            }
            return 0;
        }
        var featureVal = this._features.svcs[feature];
        if (featureVal === 1) {
            return 1;
        } else if (featureVal === 0) {
            return -1;
        }
        return 0;
    },

    _loginCallback: function (callback, data) {
        if (data.error) {
            W.logger('warn', 'Login error');
        } else {
            W.logger('Login success');

            // set baseUrl for Wialon & GIS SDK
            if (data.base_url && data.base_url !== this.getBaseUrl()) {
                this._url = data.base_url;
                // re-init request
                var counter = this._request._counter;
                this._request.destroy();
                this._request = new W.Request(this._url, '', {}, counter);
            }

            // reassign GIS urls
            if (data.gis_render) {
                this._gisRenderUrl = data.gis_render.replace(/\/+$/, '');
            }
            if (data.gis_geocode) {
                this._gisGeocodeUrl = data.gis_geocode.replace(/\/+$/, '');
            }
            if (data.gis_search) {
                this._gisSearchUrl = data.gis_search.replace(/\/+$/, '');
            }
            if (data.gis_routing) {
                this._gisRoutingUrl = data.gis_routing.replace(/\/+$/, '');
            }

            // store login response data
            this._sid = data.eid;
            this._serverTime = data.tm;
            this._classes = data.classes;
            this._features = data.features;
            // current user
            this._currentUser = data.user;
            this._registerItem(this._currentUser);

            // start events timer
            if (this.options.eventsTimeout) {
                this._eventsInterval = setTimeout(
                    this.getEvents.bind(this),
                    this.options.eventsTimeout * 1000
                );
            }
        }

        // return data in callback
        callback && callback(data);
    },

    _logoutCallback: function (callback, data) {
        if (data.error) {
            W.logger('warn', 'Logout error');
        } else {
            W.logger('Logout success');

            this._destroy();
        }

        // return data in callback
        callback && callback(data);
    },

    _getEventsCallback: function (data) {
        if (!data || data.error) {
            W.logger('log', 'Error getting events', data);
        } else {
            // update serverTime
            this._serverTime = data.tm;
            // parse events
            var evt = null, item = null;
            while (data.events.length) {
                evt = data.events.shift();
                if (evt.i > 0) {
                    item = this._items[evt.i];
                    // skip not loaded items
                    if (!item) {
                        continue;
                    }
                    // message received
                    if (evt.t === 'm') {
                        //update last message
                        item.lmsg = evt.d;
                        this.fire('lastMessageChanged', evt);
                        // update position
                        if (evt.d.pos) {
                            item.pos = evt.d.pos;
                            this.fire('positionChanged', evt);
                        }
                    // item has been deleted
                    } else if (evt.t === 'd') {
                        this.fire('itemDeleted', item);
                        this._unregisterItem(evt.i);
                    // data update event
                    } else if (evt.t === 'u') {
                        for (var k in evt.d) {
                            var
                                val, oldParams, nm;
                            if (k === 'prpu') {
                                val = evt.d['prpu'];
                                oldParams = W.extend({}, item.prp);
                                // update custom propery
                                for (nm in val) {
                                    // simple form
                                    if (val[nm] !== '') {
                                        oldParams[nm] = val[nm];
                                    } else if (nm in oldParams) {
                                        delete oldParams[nm];
                                    }
                                }
                                item.prp = oldParams;
                            } else if (k === 'prms') {
                                val = evt.d['prms'];
                                oldParams = W.extend({}, item.prms);
                                for (nm in val) {
                                    // simple form
                                    if (typeof val[nm] === 'object') {
                                        oldParams[nm] = val[nm];
                                    } else if (typeof oldParams[nm] === 'object') {
                                        oldParams[nm].at = val[nm];
                                    }
                                }
                                item.prms = oldParams;
                                this.fire('messageParamsChanged', evt);
                                // check position changes
                                if (typeof val.posinfo === 'object' || typeof val.speed === 'object') {
                                    this.fire('positionChanged', evt);
                                }
                            } else {
                                item[k] = evt.d[k];
                            }
                        }
                        this.fire('itemChanged', evt);
                    } else {
                        W.logger('log', 'unknown event', JSON.stringify(evt));
                    }
                } else if (evt.i === -3) {
                    // changed billing features avaible for current user
                    this._features = evt.d;
                    this.fire('featuresChanged');
                }
            }
            // fire event after avl_evts
            this.fire('sessionUpdated');
        }
    },

    _updateDataFlagsCallback: function (callback, items) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].d) {
                this._registerItem(items[i].d);
            } else {
                this._unregisterItem(items[i].i);
            }
        }
        callback && callback(items);
    },

    // register item in JS session
    _registerItem: function (item) {
        if (!this._classItems[item.cls]) {
            this._classItems[item.cls] = [];
        }
        this._classItems[item.cls].push(item);
        this._items[item.id] = item;
    },

    // unregister item from JS session
    _unregisterItem: function(id) {
        if (!id) {
            return this;
        }
        if (id in this._items) {
            var
                item = this._items[id];
            if (this._classItems[item.cls]) {
                var
                    // Get index
                    index_ = this._classItems[item.cls].indexOf(item);
                if (index_ !== -1) {
                    // Remove from list
                    this._classItems[item.cls].splice(index_, 1);
                }
            }
            item = null;
            delete this._items[id];
        }
    },

    _destroy: function() {
        this._sid = null;
        this._url = null;
        this._items = null;
        this._classes = null;
        this._features = null;
        this._classItems = null;
        this._currentUser = null;

        // clear interval
        clearTimeout(this._eventsInterval);
    }
});

W.session = function (url, options) {
    return new W.Session(url, options);
};