/*
 Wialon 0.0.1, a JS library for Wialon
 (c) 2015 Aleksey Shmigelski
*/
(function (window) {
var W = {
  version: '0.0.1'
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

/*
 * W.Util contains various utility functions
 */

W.Util = {
  // extend an object with properties of one or more other objects
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

  // create an object from a given prototype
  create: Object.create || (function () {
    function F() {}
    return function (proto) {
      F.prototype = proto;
      return new F();
    };
  })(),

  // bind a function to be called with a given context
  bind: function (fn, obj) {
    var slice = Array.prototype.slice;

    if (fn.bind) {
      return fn.bind.apply(fn, slice.call(arguments, 1));
    }

    var args = slice.call(arguments, 2);

    return function () {
      return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
  },

// return unique ID of an object
  stamp: function (obj) {
    obj._id = obj._id || ++W.Util.lastId;
    return obj._id;
  },

  lastId: 0,

  // do nothing (used as a noop throughout the code)
  falseFn: function () { return false; },

  // round a given number to a given precision
  formatNum: function (num, digits) {
    var pow = Math.pow(10, digits || 5);
    return Math.round(num * pow) / pow;
  },

  // trim whitespace from both sides of a string
  trim: function (str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
  },

  // split a string into words
  splitWords: function (str) {
    return W.Util.trim(str).split(/\s+/);
  },

  // set options to an object, inheriting parent's options as well
  setOptions: function (obj, options) {
    if (!obj.hasOwnProperty('options')) {
      obj.options = obj.options ? W.Util.create(obj.options) : {};
    }
    for (var i in options) {
      obj.options[i] = options[i];
    }
    return obj.options;
  },

  // make a URL with GET parameters out of a set of properties/values
  getParamString: function (obj, existingUrl, uppercase) {
    var params = [];
    for (var i in obj) {
      params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
    }
    return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
  },

  isArray: Array.isArray || function (obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
  }
};

// shortcuts for most used utility functions
W.extend = W.Util.extend;
W.stamp = W.Util.stamp;
W.bind = W.Util.bind;
W.setOptions = W.Util.setOptions;


/*
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


// method for adding properties to prototype
W.Class.include = function (props) {
  W.extend(this.prototype, props);
};

// merge new default options to the Class
W.Class.mergeOptions = function (options) {
  W.extend(this.prototype.options, options);
};

// add a constructor hook
W.Class.addInitHook = function (fn) { // (Function) || (String, args...)
  var args = Array.prototype.slice.call(arguments, 1);

  var init = typeof fn === 'function' ? fn : function () {
    this[fn].apply(this, args);
  };

  this.prototype._initHooks = this.prototype._initHooks || [];
  this.prototype._initHooks.push(init);
};

/*
 * W.Evented is a base class that Leaflet classes inherit from to handle custom events.
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

    var events = this._events = this._events || {},
        contextId = context && context !== this && W.stamp(context);

    if (contextId) {
      // store listeners with custom context in a separate hash (if it has an id);
      // gives a major performance boost when firing and removing events (e.g. on map object)

      var indexKey = type + '_idx',
          indexLenKey = type + '_len',
          typeIndex = events[indexKey] = events[indexKey] || {},
          id = W.stamp(fn) + '_' + contextId;

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
    var events = this._events,
        indexKey = type + '_idx',
        indexLenKey = type + '_len';

    if (!events) { return; }

    if (!fn) {
      // clear all listeners for a type if function isn't specified
      delete events[type];
      delete events[indexKey];
      delete events[indexLenKey];
      return;
    }

    var contextId = context && context !== this && W.stamp(context),
        listeners, i, len, listener, id;

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

    var event = W.Util.extend({}, data, {type: type, target: this}),
        events = this._events;

    if (events) {
        var typeIndex = events[type + '_idx'],
            i, len, listeners, id;

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

/*
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

  initialize: function (url, options) { // (HTMLElement or String, Object)
    options = W.setOptions(this, options);
    
    this._url = this._createFullUrl(url) + '/wialon/post.html';
    this._id = this._url;

    // create iframe
    this._io = document.createElement('iframe');
    this._io.style.display = 'none';
    if (window.attachEvent) {
      this._io.attachEvent('onload', W.bind(this._frameLoaded, this));
    } else {
      this._io.addEventListener("load", W.bind(this._frameLoaded, this), false);
    }
    this._io.setAttribute("src", this._url);
    document.body.appendChild(this._io);

    if (window.addEventListener) {
      window.addEventListener("message", W.bind(this._recieveMessage, this), false);
    } else {
      window.attachEvent("onmessage", W.bind(this._recieveMessage, this));
    }
  },

  send: function (url, params, success, error, timeout) {
    var data = {id: ++this._counter, url: url, params: this._urlEncodeData(params), source: this._id};
    var win = this._io.contentWindow;
    if (win) {
      var sdata = JSON.stringify(data);
      this._callbacks[this._counter] = [success, error, sdata, 0, timeout];
      
      if (timeout) {
        this._callbacks[this._counter].push(setTimeout(W.bind(this._timeout, this, this._counter), timeout * 1000));
      }
      
      if (this._frameReady){
        win.postMessage(sdata, this._url);
      } else {
        this._requests.push(sdata)
      }
    }
  },

  _createFullUrl: function(url) {
    if (document && !url) {
      var loc = document.location;
      url = loc.protocol + "//" + loc.hostname + (loc.port.length ? ":" + loc.port : "");
    }
    return url;
  },

  _recieveMessage: function() {
    var data = {error: -1};
    try {
      data = JSON.parse(event.data);
    } catch(e) {
      try {
        data = eval('('+event.data+')');
      } catch(e) {
        console.warn('Invalid JSON');
      }
    }
    
    if (data.source != this._id) {
        return;
    }
    
    if (!data.id) {
      this._frameReady = true;
      this._frameLoaded();
    } else {
      var callback = this._callbacks[data.id];
      if (callback) {
        // resend request
        if (data && data.text && data.text.error && data.text.error == 1003 && callback[3] < 3) {
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
      this._io.contentWindow.postMessage("{id: 0, source:'" + this._id + "'}", this._url);
      return;
    }
    for (var i = 0; i < this._requests.length; i++) {
      this._io.contentWindow.postMessage(this._requests[i], this._url);
    }
    this._requests = [];
  },

  _timeout: function (id) {
    var callback = this._callbacks[id];
    if (callback) {
      if (callback[1])
        callback[1]();
      delete this._callbacks[id];
    }
  },

  _urlEncodeData: function (data) {
    var arr = [];
    var sid = false;
    if (typeof data == "object") {
      for (var n in data) {
        if (typeof data[n] == "object") {
          arr.push(n + "=" + encodeURIComponent(JSON.stringify(data[n])));
        } else {
          arr.push(n + "=" + encodeURIComponent(data[n]));
        }
        if (n == "sid") {
          sid = true;
        }
      }
      return arr.join("&") + (sid ? "&sid=" + sid : "");
    }
    return sid ? "&sid=" + sid : "";
  }
});

W.request = function (url, options) {
  return new W.Request(url, options);
};

/*
 * W.Session is the central class of the API
 */

W.Session = W.Evented.extend({

  options: {
    eventsTimeout: 10,
  },

  _request: null,

  _sid: null,

  _serverTime: 0,

  initialize: function (url, options) {
    options = W.setOptions(this, options);

    this._request = new W.Request(url);

  },

  login: function (user, password, operateAs, callback) {

    if (!this._sid) {
      var params = {
        user: user,
        password: password,
        operateAs: operateAs || ""
      };

      this._request.send("/wialon/ajax.html?svc=core/login",
        {params: params},
        W.bind(this._loginCallback, this, callback),
        W.bind(this._loginCallback, this, callback)
      );
    }

  },

  _loginCallback: function (callback, data) {
    // ToDo: validate data before callback
    if (data.error) {
      console.warn('Login error');
    } else {
      this._sid = data.eid;
      this._serverTime = data.tm;

      // ToDo: start event timer
      if (this.options.eventsTimeout) {
        setInterval(
          W.bind(this.getEvents, this),
          this.options.eventsTimeout * 1000
        );
      }


    }

    // return data in callback
    callback(data);
  },

  getEvents: function () {
    if (this._sid !== null) {
      this._request.send("/avl_evts",
        {sid: this._sid},
        this._getEventsCallback,
        this._getEventsCallback
      );

    }
  },

  _getEventsCallback: function (data) {
    this._serverTime = data.tm;
  }

});

W.session = function (url, options) {
  return new W.Session(url, options);
};

}(window));