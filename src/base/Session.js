/** W.Session is the central class of the API
 */

W.Session = W.Evented.extend({
    options: {
        eventsTimeout: 10,
    },

    api: {},

    _request: null,
    _serverTime: 0,
    _eventsInterval: 0,

    _sid: null,
    _url: null,
    _items: {},
    _classes: {},
    _classItems: {}, // items grouped by class
    // toDo: features

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

        // Check if session initialized
        if (!this._sid && skipArr.indexOf(svc[1]) === -1) {
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

    _loginCallback: function (callback, data) {
        // ToDo: validate data before callback
        if (data.error) {
            W.logger('warn', 'Login error');
        } else {
            W.logger('Login success');

            this._sid = data.eid;
            this._serverTime = data.tm;
            this._classes = data.classes;

            // toDo: features

            // start events timer
            if (this.options.eventsTimeout) {
                this._eventsInterval = setInterval(
                    this.getEvents.bind(this),
                    this.options.eventsTimeout * 1000
                );
            }
        }

        // return data in callback
        callback && callback(data);
    },

    _getEventsCallback: function (data) {
        // update serverTime
        this._serverTime = data.tm;
        // parse events
        var evt = null;
        while (data.events.length) {
            evt = data.events.shift();
            // skip not loaded items
            if (!this._items[evt.i]) {
                continue;
            }
            // message received
            if (evt.t === 'm') {
                //update last message
                this._items[evt.i].lmsg = evt.d;
                // update position
                if (evt.d.pos) {
                    this._items[evt.i].pos = evt.d.pos;
                    this.fire('changePosition', evt);
                }
                this.fire('messageRegistered', evt);
            // item has been deleted
            } else if (evt.t === 'd') {
                this.fire('itemDeleted', this._items[evt.i]);
                this._onItemDeleted(evt.i);
            } else {
                W.logger('log', 'unknown event', JSON.stringify(evt));
            }
        }
    },

    _updateDataFlagsCallback: function (callback, items) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].d) {
                if (!this._classItems[items[i].d.cls]) {
                    this._classItems[ items[i].d.cls ] = [];
                }
                this._classItems[ items[i].d.cls ].push(items[i].d);
                this._items[items[i].i] = items[i].d;
            } else {
                this._onItemDeleted(items[i].i);
            }
            // ToDo: generate arrays by type?...
        }
        callback && callback(items);
    },

    _onItemDeleted: function(id) {
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
    }
});

W.session = function (url, options) {
    return new W.Session(url, options);
};