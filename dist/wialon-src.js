/**
 wialonjs-api 0.0.1, a JS library for Wialon Remote API
 Copyright (c) 2015, Gurtam (http://gurtam.com)
*/
(function (window) {/* jshint -W079 */
/* global define */

var W = {
    version: '0.0.1',
    debug: false
};

function expose() {
    var oldW = window.W;

    W.noConflict = function () {
        window.W = oldW;
        return this;
    };

    window.W = W;
}


// define Wialon for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = W;
// define Wialon as an AMD module
} else if (typeof define === 'function' && define.amd) {
    define(W);
}
// define Wialon as a global W variable, saving the original W to restore later if needed
if (typeof window !== 'undefined') {
    expose();
}

/**
 * W.Util contains various utility functions
 */

W.Util = {
    /** Extend an object with properties of one or more other objects
     */
    extend: function (dest) {
        var i, j, len, src;

        for (j = 1, len = arguments.length; j < len; j++) {
            src = arguments[j];
            for (i in src) {
                dest[i] = src[i];
            }
        }
        return dest;
    },

    /** Create an object from a given prototype
     */
    create: Object.create || (function () {
        function F() {}
        return function (proto) {
            F.prototype = proto;
            return new F();
        };
    })(),

    /** Return unique ID of an object
     */
    stamp: function (obj) {
        obj._id = obj._id || ++W.Util.lastId;
        return obj._id;
    },

    lastId: 0,

    /** Do nothing (used as a noop throughout the code)
     */
    falseFn: function () { return false; },

    /** Round a given number to a given precision
     */
    formatNum: function (num, digits) {
        var pow = Math.pow(10, digits || 5);
        return Math.round(num * pow) / pow;
    },

    /** Trim whitespace from both sides of a string
     */
    trim: function (str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    /** Split a string into words
     */
    splitWords: function (str) {
        return W.Util.trim(str).split(/\s+/);
    },

    /** Set options to an object, inheriting parent's options as well
     */
    setOptions: function (obj, options) {
        if (!obj.hasOwnProperty('options')) {
            obj.options = obj.options ? W.Util.create(obj.options) : {};
        }
        for (var i in options) {
            obj.options[i] = options[i];
        }
        return obj.options;
    },

    /** Make a URL with GET parameters out of a set of properties/values
     */
    getParamString: function (obj, existingUrl, uppercase) {
        var params = [];
        for (var i in obj) {
            params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
        }
        return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
    },

    isArray: Array.isArray || function (obj) {
        return (Object.prototype.toString.call(obj) === '[object Array]');
    },

    /** Logger
     */
    write: function() {
        if (!W.debug || !arguments.length) {
            return;
        }

        var
            // Get method
            method = arguments[0],
            console = window.console;
        // Check browser support
        if (!console[method]) {
            console[method] = function() {};
        }
        // If there are only 1 argument - use console.log
        if (arguments.length === 1) {
            return console.log(arguments[0]);
        }
        // Check our own method "stringify"
        if (method === 'stringify') {
            var
                data = arguments[1];
            // Check if it is object
            if (data === Object(data) && JSON) {
                try {
                    data = JSON.stringify(data);
                } catch (e) {}
            }
            return console.log(data);
        }
        return console[method].apply(console, Array.prototype.slice.call(arguments, 1));
    }
};

// shortcuts for most used utility functions
W.extend = W.Util.extend;
W.stamp = W.Util.stamp;
W.setOptions = W.Util.setOptions;
W.logger = W.Util.write;

/**
 * W.Class powers the OOP facilities of the library.
 * Thanks to John Resig and Dean Edwards for inspiration!
 */

W.Class = function () {};

W.Class.extend = function (props) {

    // extended class with the new prototype
    var NewClass = function () {

        // call the constructor
        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }

        // call all constructor hooks
        this.callInitHooks();
    };

    var parentProto = NewClass.__super__ = this.prototype;

    var proto = W.Util.create(parentProto);
    proto.constructor = NewClass;

    NewClass.prototype = proto;

    //inherit parent's statics
    for (var i in this) {
        if (this.hasOwnProperty(i) && i !== 'prototype') {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        W.extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        W.Util.extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (proto.options) {
        props.options = W.Util.extend(W.Util.create(proto.options), props.options);
    }

    // mix given properties into the prototype
    W.extend(proto, props);

    proto._initHooks = [];

    // add method for calling all hooks
    proto.callInitHooks = function () {

        if (this._initHooksCalled) { return; }

        if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (var i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };

    return NewClass;
};

/** Method for adding properties to prototype
 */
W.Class.include = function (props) {
    W.extend(this.prototype, props);
};

/** Merge new default options to the Class
 */
W.Class.mergeOptions = function (options) {
    W.extend(this.prototype.options, options);
};

/** Add a constructor hook
 */
W.Class.addInitHook = function (fn) { // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);

    var init = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._initHooks = this.prototype._initHooks || [];
    this.prototype._initHooks.push(init);
};

/**
 * W.Evented is a base class that Wialon classes inherit from to handle custom events.
 */

W.Evented = W.Class.extend({

    on: function (types, fn, context) {

        // types can be a map of types/handlers
        if (typeof types === 'object') {
            for (var type in types) {
                // we don't process space-separated events here for performance;
                // it's a hot path since Layer uses the on(obj) syntax
                this._on(type, types[type], fn);
            }

        } else {
            // types can be a string of space-separated words
            types = W.Util.splitWords(types);

            for (var i = 0, len = types.length; i < len; i++) {
                this._on(types[i], fn, context);
            }
        }

        return this;
    },

    off: function (types, fn, context) {

        if (!types) {
            // clear all listeners if called without arguments
            delete this._events;

        } else if (typeof types === 'object') {
            for (var type in types) {
                this._off(type, types[type], fn);
            }

        } else {
            types = W.Util.splitWords(types);

            for (var i = 0, len = types.length; i < len; i++) {
                this._off(types[i], fn, context);
            }
        }

        return this;
    },

    // attach listener (without syntactic sugar now)
    _on: function (type, fn, context) {

        var events = this._events = this._events || {};
        var contextId = context && context !== this && W.stamp(context);

        if (contextId) {
            // store listeners with custom context in a separate hash (if it has an id);
            // gives a major performance boost when firing and removing events (e.g. on map object)

            var indexKey = type + '_idx';
            var indexLenKey = type + '_len';
            var typeIndex = events[indexKey] = events[indexKey] || {};
            var id = W.stamp(fn) + '_' + contextId;

            if (!typeIndex[id]) {
                typeIndex[id] = {fn: fn, ctx: context};

                // keep track of the number of keys in the index to quickly check if it's empty
                events[indexLenKey] = (events[indexLenKey] || 0) + 1;
            }

        } else {
            // individual layers mostly use "this" for context and don't fire listeners too often
            // so simple array makes the memory footprint better while not degrading performance

            events[type] = events[type] || [];
            events[type].push({fn: fn});
        }
    },

    _off: function (type, fn, context) {
        var events = this._events;
        var indexKey = type + '_idx';
        var indexLenKey = type + '_len';

        if (!events) { return; }

        if (!fn) {
            // clear all listeners for a type if function isn't specified
            delete events[type];
            delete events[indexKey];
            delete events[indexLenKey];
            return;
        }

        var contextId = context && context !== this && W.stamp(context);
        var listeners;
        var i;
        var len;
        var listener;
        var id;

        if (contextId) {
            id = W.stamp(fn) + '_' + contextId;
            listeners = events[indexKey];

            if (listeners && listeners[id]) {
                listener = listeners[id];
                delete listeners[id];
                events[indexLenKey]--;
            }

        } else {
            listeners = events[type];

            if (listeners) {
                for (i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i].fn === fn) {
                        listener = listeners[i];
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // set the removed listener to noop so that's not called if remove happens in fire
        if (listener) {
            listener.fn = W.Util.falseFn;
        }
    },

    fire: function (type, data, propagate) {
        if (!this.listens(type, propagate)) { return this; }

        var event = W.Util.extend({}, data, {type: type, target: this});
        var events = this._events;

        if (events) {
            var typeIndex = events[type + '_idx'];
            var i;
            var len;
            var listeners;
            var id;

            if (events[type]) {
                // make sure adding/removing listeners inside other listeners won't cause infinite loop
                listeners = events[type].slice();

                for (i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].fn.call(this, event);
                }
            }

            // fire event for the context-indexed listeners as well
            for (id in typeIndex) {
                typeIndex[id].fn.call(typeIndex[id].ctx, event);
            }
        }

        if (propagate) {
            // propagate the event to parents (set with addEventParent)
            this._propagateEvent(event);
        }

        return this;
    },

    listens: function (type, propagate) {
        var events = this._events;

        if (events && (events[type] || events[type + '_len'])) { return true; }

        if (propagate) {
            // also check parents for listeners if event propagates
            for (var id in this._eventParents) {
                if (this._eventParents[id].listens(type, propagate)) { return true; }
            }
        }
        return false;
    },

    once: function (types, fn, context) {

        if (typeof types === 'object') {
            for (var type in types) {
                this.once(type, types[type], fn);
            }
            return this;
        }

        var handler = W.bind(function () {
            this
                .off(types, fn, context)
                .off(types, handler, context);
        }, this);

        // add a listener that's executed once and removed after that
        return this
            .on(types, fn, context)
            .on(types, handler, context);
    },

    // adds a parent to propagate events to (when you fire with true as a 3rd argument)
    addEventParent: function (obj) {
        this._eventParents = this._eventParents || {};
        this._eventParents[W.stamp(obj)] = obj;
        return this;
    },

    removeEventParent: function (obj) {
        if (this._eventParents) {
            delete this._eventParents[W.stamp(obj)];
        }
        return this;
    },

    _propagateEvent: function (e) {
        for (var id in this._eventParents) {
            this._eventParents[id].fire(e.type, W.extend({layer: e.target}, e), true);
        }
    }
});

var proto = W.Evented.prototype;

// aliases; we should ditch those eventually
proto.addEventListener = proto.on;
proto.removeEventListener = proto.clearAllEventListeners = proto.off;
proto.addOneTimeEventListener = proto.once;
proto.fireEvent = proto.fire;
proto.hasEventListeners = proto.listens;

W.Mixin = {Events: proto};

/**
 * W.Request - class performs remote requests
 */

W.Request = W.Class.extend({

    options: {},

    _id: 0,
    _url: '',
    _io: null,
    _counter: 0,
    _requests: [],
    _callbacks: [],
    _frameReady: false,

    /** Constructor
     */
    initialize: function (url, options) {
        options = W.setOptions(this, options);

        this._url = this._createFullUrl(url) + '/wialon/post.html';
        this._id = this._url;

        // create iframe
        this._io = document.createElement('iframe');
        this._io.style.display = 'none';
        this._io.setAttribute('src', this._url);

        // bind events
        this._io.onload = this._frameLoaded.bind(this);
        window.addEventListener('message', this._receiveMessage.bind(this), false);

        // append iframe to body
        document.body.appendChild(this._io);
    },

    /** Execute simple Remote API request
     */
    api: function (svc, params, callback) {
        this.send('/wialon/ajax.html?svc=' + svc, params, callback, callback);
    },

    /** Process request sending
     */
    send: function (url, params, success, error) {
        var data = {
            id: ++this._counter,
            url: url,
            params: this._urlEncodeData(params),
            source: this._id
        };

        var win = this._io.contentWindow;
        if (win) {
            var sdata = JSON.stringify(data);
            this._callbacks[this._counter] = [success, error, sdata, 0];

            if (this._frameReady) {
                win.postMessage(sdata, this._url);
            } else {
                this._requests.push(sdata);
            }
        }
    },

    _createFullUrl: function(url) {
        if (!url) {
            var loc = document.location;
            url = loc.protocol + '//' + loc.hostname + (loc.port.length ? ':' + loc.port : '');
        }
        return url;
    },

    _receiveMessage: function(evt) {
        var data = {error: -1};
        try {
            data = JSON.parse(evt.data);
        } catch (e) {
            try {
                /* jshint evil: true */
                data = eval('(' + evt.data + ')');
            } catch (e) {
                W.logger('warn', 'Invalid JSON');
            }
        }

        if (data.source !== this._id) {
            return;
        }

        if (!data.id) {
            this._frameReady = true;
            this._frameLoaded();
        } else {
            var callback = this._callbacks[data.id];
            if (callback) {
                // resend request
                if (data && data.text && data.text.error && data.text.error === 1003 && callback[3] < 3) {
                    callback[3]++;
                    // restart timer
                    if (callback[4] && callback[5]) {
                        clearTimeout(callback[5]);
                        callback[5] = setTimeout(W.bind(this._timeout, this, this._counter), callback[4] * 1000);
                    }
                    // async call
                    if (this._io.contentWindow) {
                        setTimeout(W.bind(function(request) {
                            this._io.contentWindow.postMessage(request, this._url);
                        }, this, callback[2]), Math.random() * 1000);
                        return;
                    }
                }
                if (callback[data.error]) {
                    callback[data.error](data.text);
                }
                if (callback[4] && callback[5]) {
                    clearTimeout(callback[5]);
                }
                delete this._callbacks[data.id];
            }
        }
    },

    _frameLoaded: function () {
        if (!this._frameReady) {
            this._io.contentWindow.postMessage('{id: 0, source:"' + this._id + '"}', this._url);
        } else {
            while (this._requests.length) {
                this._io.contentWindow.postMessage(this._requests.pop(), this._url);
            }
        }
    },

    _timeout: function (id) {
        var callback = this._callbacks[id];
        if (callback) {
            if (callback[1]) {
                callback[1]();
            }
            delete this._callbacks[id];
        }
    },

    _urlEncodeData: function (data) {
        var arr = [];
        if (typeof data === 'object') {
            for (var n in data) {
                if (typeof data[n] === 'object') {
                    arr.push(n + '=' + encodeURIComponent(JSON.stringify(data[n])));
                } else {
                    arr.push(n + '=' + encodeURIComponent(data[n]));
                }
            }
            return arr.join('&');
        }
        return '';
    }
});

W.request = function (url, options) {
    return new W.Request(url, options);
};

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

/** Remote API 'core' service methods
 *  Specific methods for pre- and post-processing Remote API request
 */

W.Session.prototype.api.core = {
    update_data_flags: function (params, callback) {
        // Call request
        this._request.api('core/update_data_flags',
            {params: params, sid: this._sid},
            this._updateDataFlagsCallback.bind(this, callback)
        );
    },

    login: function (params, callback) {
        W.extend({
            user: null,
            password: null,
            operateAs: ''
        }, params);
        // Call request
        this._request.api('core/login',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    },

    logout: function (callback) {
        // Call request
        this._request.api('core/logout',
            {params: {}, sid: this._sid},
            this._logoutCallback.bind(this, callback)
        );
    },

    use_auth_hash: function(params, callback) {
        // Call request
        this._request.api('core/use_auth_hash',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    },

    duplicate: function(params, callback) {
        // Call request
        this._request.api('core/duplicate',
            {params: params},
            this._loginCallback.bind(this, callback)
        );
    }
};

}(window));